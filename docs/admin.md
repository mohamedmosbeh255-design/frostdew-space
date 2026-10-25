# Admin prototype

The `/admin` area is a **local development tool**, not a production CMS. It reads and writes
`data/products.json` directly through Node's filesystem API.

## Local setup

1. Add credentials to `.env.local` (gitignored):

   ```bash
   ADMIN_PASSWORD=choose-a-local-password
   ADMIN_SESSION_SECRET=some-long-random-value   # optional; falls back to the password
   ```

2. Restart the dev server so Next.js picks up the env file:

   ```bash
   pnpm dev
   ```

3. Open <http://localhost:3000/admin> and sign in.

If `ADMIN_PASSWORD` is missing, every admin page shows a setup notice and the login API
returns `503`. There is deliberately no built-in default password.

## What it does

| Route | Purpose |
| --- | --- |
| `/admin` | Table of every product in `data/products.json` |
| `/admin/add` | Create form |
| `/admin/edit/[id]` | Edit form (the `id` is immutable) |
| `POST /api/admin/login` | Password → signed session cookie |
| `POST /api/admin/logout` | Clears the cookie |
| `GET/POST /api/admin/products` | List / create |
| `GET/PUT/DELETE /api/admin/products/[id]` | Read / update / delete one record |

All mutations are validated by the same rules used by `pnpm validate:data`
(`lib/product-rules.mjs`), so an admin edit cannot silently break store allowlists or
affiliate tags. Writes go to a temporary file and are renamed into place, so a crash cannot
leave a half-written JSON file.

## Production gating

| Variable | Effect |
| --- | --- |
| `ADMIN_PASSWORD` | Required to sign in. No default. |
| `ADMIN_SESSION_SECRET` | HMAC key for the session cookie. |
| `ADMIN_ENABLED` | Production only. `/admin` returns **404** unless `true`. |
| `ADMIN_ALLOW_WRITES` | Production only. Writes return **501** unless `true`. |

Local development allows access and writes as soon as `ADMIN_PASSWORD` is set. Production
stays closed by default even if the code is deployed.

## Security limitations (prototype)

- One shared password, no user accounts, no audit trail.
- The login throttle is in-memory and per-instance; it is not a real rate limiter.
- CSRF is mitigated by `SameSite=Lax` plus an origin check, not by tokens.
- Concurrent editors can overwrite each other (last write wins). Git is the safety net.
- The public site reads a build-time snapshot of the JSON, so changes appear immediately in
  dev but require a rebuild/redeploy in production.

## Replacing the JSON store with a real backend

1. Keep the API contract (`/api/admin/products`) or move the same handlers to server actions.
2. Replace the three functions in `lib/admin/products-store.ts`:

   ```ts
   readProducts()
   writeProducts(next)
   productIndexById(products, id)
   ```

   with database queries. Nothing else imports the filesystem directly.
3. Keep calling `validateProductRecord` from `lib/product-rules.mjs` in the write path.
4. Replace the shared-password check in `lib/admin/auth.ts` with your identity provider.
5. Remove `ADMIN_ALLOW_WRITES` and the filesystem-specific 501 response once writes are durable.
6. Consider optimistic concurrency (an `updatedAt` or version column) before allowing multiple
   editors.

When that is done, delete this note's "prototype" banner in `app/admin/layout.tsx`.
