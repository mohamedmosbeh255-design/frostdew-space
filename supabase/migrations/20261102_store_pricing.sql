-- FrostDew store price comparison
-- Run this once in the SQL Editor after the integration migration.
--
-- Adds products.store_pricing, an array of per-store prices:
--   [{"store":"Amazon US","price":24.99,"currency":"USD","url":"https://..."}]
--
-- The existing store / price / sale_price columns stay the primary default
-- store; this column only feeds the "Compare prices" dialog on product cards.
-- Safe to re-run.

alter table public.products
  add column if not exists store_pricing jsonb not null default '[]'::jsonb;

alter table public.products
  drop constraint if exists products_store_pricing_is_array;

alter table public.products
  add constraint products_store_pricing_is_array
    check (jsonb_typeof(store_pricing) = 'array');
