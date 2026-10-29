-- FrostDew: finish the duplicate-protection step.
--
-- The live table still has plain, empty brand_key/name_key columns plus an older
-- unique index named products_brand_name_unique built on lower(btrim(brand)) /
-- lower(btrim(name)). That index name is why the first repair attempt stopped:
-- "add constraint products_brand_name_unique" cannot reuse a taken name.
--
-- This script drops both, then recreates the keys as stored generated columns so
-- they can never drift from brand/name (no trigger needed). The 51 products and
-- every other column stay untouched.
--
-- Safe to re-run.

begin;

-- Older session objects that occupy the constraint name.
alter table public.products drop constraint if exists products_brand_name_unique;
drop index if exists public.products_brand_name_unique;
alter table public.products drop constraint if exists products_brand_name_not_empty;

-- Leftovers from the earlier trigger-based attempt.
drop trigger if exists products_set_duplicate_keys on public.products;
drop function if exists public.set_product_duplicate_keys();

-- Replace the plain key columns with generated ones. Dropping a column also
-- drops any index/constraint that depends on it.
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

commit;

-- Expect: 51 rows, 0 blank keys, 51 distinct keys, no trigger.
select
  count(*) as products,
  count(*) filter (where brand_key is null or name_key is null or brand_key = '' or name_key = '') as blank_keys,
  count(distinct brand_key || '|' || name_key) as distinct_keys
from public.products;
