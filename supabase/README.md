# Supabase setup

FrostDew stores products, site settings, and partner links in Supabase. The JSON files in
`data/` are seed sources only — nothing reads them at runtime.

## 1. Apply the schema

For a fresh project: open **Supabase Dashboard → SQL Editor**, paste
[`schema.sql`](./schema.sql), and run it.

For a project that already ran an earlier version of the schema, run
[`migrations/20261027_integration.sql`](./migrations/20261027_integration.sql) instead. It adds:

- `products.sort_order` (keeps the curated catalog order), and
- `save_site_settings(jsonb, jsonb, jsonb)` (atomic settings + partner writes).

Both files are safe to re-run.

The schema creates:

| Table | Purpose |
| --- | --- |
| `public.products` | Catalog, one row per product |
| `public.site_settings` | Singleton row (`id = 'default'`) for social links and editable copy |
| `public.partners` | Ordered footer partner links |

It also adds:

- `brand_key + name_key` stored generated columns plus a unique constraint that
  mirrors the app’s NFKC/trim/whitespace/lowercase duplicate rule. Because the
  keys are generated, they cannot drift from `brand`/`name` (no trigger needed).
- `updated_at` triggers on all three tables.
- `sort_order` plus an index for the product display order.
- RLS policies that allow public `SELECT` only.
- Explicit `SELECT` grants for `anon`/`authenticated`; writes are reserved for
  the service role.

## 2. Seed the existing content

Two equivalent paths. Both validate all 51 products with
`validateProductRecord()`/`findDuplicateProduct()` first and refuse to run if the JSON source
would violate the admin rules.

**From SQL (no network access to the project needed):** paste [`seed.sql`](./seed.sql) into the
SQL Editor and run it. It upserts the products, writes the settings row, replaces the partner
list, and prints verification counts. Re-running it is safe.

**From the CLI:**

```bash
corepack pnpm seed:supabase     # node --env-file=.env.local scripts/seed-supabase.mjs
```

Regenerate the SQL file after editing the JSON sources:

```bash
corepack pnpm seed:sql          # node scripts/generate-seed-sql.mjs
```

## 3. Environment variables

Local development (`.env.local`, already gitignored):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<secret-or-service-role-key>
```

Vercel: **Project → Settings → Environment Variables**

| Name | Environments | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Publishable/anon key; safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only (or Production + Preview) | Mark **Sensitive**; never expose to the browser |

`NEXT_PUBLIC_*` values are bundled into the client. The service-role key is
server-only and bypasses RLS.

The client code also accepts the newer Supabase key names:
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

## 4. Storage bucket for uploads

Admin media uploads use Supabase Storage. Create the bucket in the **same
project** as `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`:

**Dashboard → Storage → New bucket**

| Setting | Value |
| --- | --- |
| Name | `media` (or set `SUPABASE_MEDIA_BUCKET` to another name) |
| Public bucket | **On** — the site renders these URLs directly |
| File size limit | **25 MB** |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`, `video/mp4`, `video/webm` |

Or run the reproducible setup:

```bash
# SQL Editor: paste supabase/storage.sql and run it
```

`storage.sql` creates the bucket if missing and updates its limits on re-run.

No `storage.objects` INSERT policy is required. The browser uploads with a
short-lived signed token issued by the server using the service-role key; public
read works because the bucket is public.

Optional environment variable (defaults to `media`):

```dotenv
SUPABASE_MEDIA_BUCKET=media
```

Verify the bucket before deploying:

1. Upload a small image through `/admin` and confirm the returned URL opens in a
   private window.
2. Confirm a file over 25 MB is rejected.
3. Confirm a renamed non-image file (for example a PDF named `.jpg`) is rejected
   at the confirm step and removed from the bucket.
4. Request `/_next/image?url=<new public URL>&w=640&q=75` and confirm a 200.

## 5. Client utilities

`lib/supabase.ts` exports:

- `getSupabasePublicClient()` — publishable key, RLS applies. Used by public pages.
- `getSupabaseAdminClient()` — secret key, trusted server code only. Used by admin API routes.
- `isSupabaseConfigured()` — non-throwing configuration check.

The module imports `server-only`, so an accidental client-component import fails at build time.

## 6. Verify

After seeding, run in the SQL Editor:

```sql
select count(*) as products,
       count(distinct brand_key || '|' || name_key) as unique_names
from public.products;

select name, position from public.partners order by position;

select id, updated_at from public.site_settings;
```

Expected: `51` products, `51` unique names, one partner row, one settings row.

Then check the app:

1. `pnpm dev`, open <http://localhost:3000> — 51 products render from Supabase.
2. Sign in at `/admin` and edit a product description; reload the homepage. The change appears
   without a rebuild.
3. Save the content manager and confirm the footer partner link and hero copy update.
4. Add a product whose brand + name matches an existing one; the form warns
   `A product with this name already exists.` and the API returns `409` if forced.
