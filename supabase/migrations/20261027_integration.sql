-- FrostDew Supabase integration migration
-- Run this once in the SQL Editor after the initial schema.
--
-- Adds:
--   1. products.sort_order so the catalog keeps its curated order
--   2. save_site_settings() so settings + partners update atomically

alter table public.products
  add column if not exists sort_order integer not null default 0;

create index if not exists products_sort_order_idx
  on public.products (sort_order, id);

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
