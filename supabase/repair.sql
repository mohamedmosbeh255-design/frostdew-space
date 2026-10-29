-- FrostDew schema repair for the existing prototype tables.
--
-- Use this instead of rebuild.sql when the tables already hold the 51 products.
-- It keeps the rows and brings the schema in line with supabase/schema.sql:
--   1. brand_key + name_key, the normalization trigger, and the unique constraint
--   2. updated_at triggers
--   3. removal of legacy prototype columns
--   4. save_site_settings() with the DELETE that Supabase's safe-update guard allows
--   5. partner indexes and RLS/grants
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Duplicate protection
-- ---------------------------------------------------------------------------

-- Older sessions may have created a unique index under the constraint name
-- (built on lower(btrim(brand)) / lower(btrim(name))). Clear both forms first.
alter table public.products drop constraint if exists products_brand_name_unique;
drop index if exists public.products_brand_name_unique;
alter table public.products drop constraint if exists products_brand_name_not_empty;

-- Leftovers from the trigger-based attempt.
drop trigger if exists products_set_duplicate_keys on public.products;
drop function if exists public.set_product_duplicate_keys();

-- Replace the plain key columns with stored generated columns, so they can
-- never drift from brand/name. Dropping a column also drops dependants.
alter table public.products drop column if exists brand_key;
alter table public.products drop column if exists name_key;

-- Same normalization as normalizeProductBrand()/normalizeProductName() in
-- lib/product-rules.mjs: NFKC, trim, collapse inner whitespace, lowercase.
alter table public.products
  add column brand_key text generated always as (
    lower(btrim(regexp_replace(normalize(coalesce(brand, ''), NFKC), '[[:space:]]+', ' ', 'g')))
  ) stored,
  add column name_key text generated always as (
    lower(btrim(regexp_replace(normalize(coalesce(name, ''), NFKC), '[[:space:]]+', ' ', 'g')))
  ) stored;

alter table public.products alter column brand_key set not null;
alter table public.products alter column name_key set not null;

alter table public.products add constraint products_brand_name_unique
  unique (brand_key, name_key);

alter table public.products add constraint products_brand_name_not_empty
  check (brand_key <> '' and name_key <> '');

-- ---------------------------------------------------------------------------
-- 2. updated_at triggers
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

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Drop prototype-only columns
-- ---------------------------------------------------------------------------

alter table public.products      drop column if exists image_url;
alter table public.site_settings drop column if exists site_title;
alter table public.site_settings drop column if exists tagline;
alter table public.site_settings drop column if exists hero_video;

alter table public.site_settings alter column social_links set default '{}'::jsonb;
alter table public.site_settings alter column social_links set not null;
alter table public.site_settings alter column content set default '{}'::jsonb;
alter table public.site_settings alter column content set not null;
alter table public.site_settings alter column updated_at set default now();
alter table public.site_settings alter column updated_at set not null;

insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Fixed settings RPC
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

  -- `where true` satisfies Supabase's safe-update guard, which rejects an
  -- unqualified DELETE even inside a SECURITY DEFINER function.
  delete from public.partners where true;

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
-- 5. Indexes, RLS, grants
-- ---------------------------------------------------------------------------

create index if not exists products_categories_gin
  on public.products using gin (categories);
create index if not exists products_bestseller_idx
  on public.products (bestseller);
create index if not exists products_sort_order_idx
  on public.products (sort_order, id);

create unique index if not exists partners_url_unique
  on public.partners (lower(btrim(url)));
create index if not exists partners_position_idx
  on public.partners (position);

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

revoke all on public.products      from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.partners      from anon, authenticated;

grant select on public.products      to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.partners      to anon, authenticated;

grant all on public.products      to service_role;
grant all on public.site_settings to service_role;
grant all on public.partners      to service_role;

commit;
