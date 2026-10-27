-- FrostDew Supabase schema
-- Run this in the Supabase Dashboard → SQL Editor.
--
-- Tables:
--   products       – one row per catalog product
--   site_settings  – singleton row for social links + editable site copy
--   partners       – ordered footer partner links
--
-- Security model:
--   * Public pages read with the publishable/anon key; RLS allows SELECT only.
--   * The admin API writes with the secret/service-role key, which bypasses RLS.
--   * No browser role can insert, update, or delete rows.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id                 text primary key,
  brand              text not null check (char_length(btrim(brand)) > 0),
  name               text not null check (char_length(btrim(name)) > 0),
  full_name          text not null check (char_length(btrim(full_name)) > 0),
  categories         text[] not null default '{}'::text[],
  short              text not null,
  description        text not null,
  features           text[] not null default '{}'::text[],
  image              text not null check (char_length(btrim(image)) > 0),
  images             text[] not null default '{}'::text[],
  url                text not null check (char_length(btrim(url)) > 0),
  store              text not null check (char_length(btrim(store)) > 0),
  bestseller         boolean not null default false,
  sort_order         integer not null default 0,
  price              text,
  sale_price         text,
  rating             numeric(2, 1) check (rating is null or rating between 1 and 5),
  review_count       integer check (review_count is null or review_count >= 0),
  added_date         date,
  affiliate_links    jsonb not null default '{}'::jsonb
                       check (jsonb_typeof(affiliate_links) = 'object'),
  related_products   text[] not null default '{}'::text[],
  brand_key          text not null,
  name_key           text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint products_brand_name_not_empty
    check (brand_key <> '' and name_key <> ''),
  constraint products_brand_name_unique
    unique (brand_key, name_key)
);

comment on table public.products is
  'FrostDew catalog. brand_key + name_key mirror lib/product-rules.mjs normalization.';
comment on column public.products.affiliate_links is
  'Optional store links: {"amazonUs": "...", "amazonUk": "...", "stylevana": "..."}';

/**
 * Mirrors normalizeProductBrand()/normalizeProductName() in lib/product-rules.mjs:
 * NFKC, trim, collapse whitespace, lowercase. The composite key is what makes
 * brand + name unique without merging punctuation or size variants.
 */
create or replace function public.set_product_duplicate_keys()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.brand_key := lower(
    btrim(regexp_replace(normalize(new.brand, NFKC), '[[:space:]]+', ' ', 'g'))
  );
  new.name_key := lower(
    btrim(regexp_replace(normalize(new.name, NFKC), '[[:space:]]+', ' ', 'g'))
  );
  return new;
end;
$$;

drop trigger if exists products_set_duplicate_keys on public.products;
create trigger products_set_duplicate_keys
before insert or update of brand, name on public.products
for each row execute function public.set_product_duplicate_keys();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists products_categories_gin
  on public.products using gin (categories);
create index if not exists products_bestseller_idx
  on public.products (bestseller);
create index if not exists products_sort_order_idx
  on public.products (sort_order, id);

-- ---------------------------------------------------------------------------
-- Site settings (one row)
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  id            text primary key default 'default' check (id = 'default'),
  social_links  jsonb not null default '{}'::jsonb
                  check (jsonb_typeof(social_links) = 'object'),
  content       jsonb not null default '{}'::jsonb
                  check (jsonb_typeof(content) = 'object'),
  updated_at    timestamptz not null default now()
);

comment on table public.site_settings is
  'Singleton settings row. social_links and content retain the JSON shape from data/settings.json.';

insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Partners (ordered footer links)
-- ---------------------------------------------------------------------------

create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  url         text not null
                check (char_length(url) between 1 and 300 and url ~* '^https://'),
  new_tab     boolean not null default true,
  position    integer not null default 0 check (position between 0 and 19),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.partners is
  'Footer partner links in display order. position 0 renders first.';

create unique index if not exists partners_url_unique
  on public.partners (lower(btrim(url)));
create index if not exists partners_position_idx
  on public.partners (position);

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic settings + partner replacement
-- ---------------------------------------------------------------------------

create or replace function public.save_site_settings(
  p_social_links jsonb,
  p_content jsonb,
  p_partners jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_settings (id, social_links, content)
  values (
    'default',
    coalesce(p_social_links, '{}'::jsonb),
    coalesce(p_content, '{}'::jsonb)
  )
  on conflict (id) do update
    set social_links = excluded.social_links,
        content = excluded.content;

  delete from public.partners;

  insert into public.partners (name, url, new_tab, position)
  select
    item.name,
    item.url,
    coalesce(item.new_tab, true),
    item.position
  from jsonb_to_recordset(coalesce(p_partners, '[]'::jsonb))
    as item(name text, url text, new_tab boolean, position integer);
end;
$$;

revoke all on function public.save_site_settings(jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_site_settings(jsonb, jsonb, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.products      enable row level security;
alter table public.site_settings enable row level security;
alter table public.partners      enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read partners" on public.partners;
create policy "Public can read partners"
  on public.partners for select
  to anon, authenticated
  using (true);

-- Explicit privileges: browser roles can only read. Admin writes use the
-- service-role key, which is never shipped to the browser.
revoke all on public.products      from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.partners      from anon, authenticated;

grant select on public.products      to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.partners      to anon, authenticated;

grant all on public.products      to service_role;
grant all on public.site_settings to service_role;
grant all on public.partners      to service_role;
