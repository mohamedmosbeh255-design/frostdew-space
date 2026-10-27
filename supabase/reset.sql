-- FrostDew schema reset.
--
-- Run this ONLY when the three tables exist with the wrong columns (for example
-- an older prototype schema), because `create table if not exists` in
-- schema.sql silently skips an existing table.
--
-- This deletes every product, setting, and partner row. It is safe before the
-- first seed, which is the only time it should be needed.

do $$
declare
  target record;
begin
  for target in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('products', 'site_settings', 'partners')
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    execute format(
      'drop %s if exists public.%I cascade',
      case target.relkind
        when 'v' then 'view'
        when 'm' then 'materialized view'
        when 'f' then 'foreign table'
        else 'table'
      end,
      target.relname
    );
  end loop;
end;
$$;

-- Recreated by schema.sql; dropped so a stale signature cannot linger.
drop function if exists public.save_site_settings(jsonb, jsonb, jsonb);
drop function if exists public.set_product_duplicate_keys() cascade;
drop function if exists public.set_updated_at() cascade;
