# Admin prototype

The `/admin` area is a **local development tool**, not a production CMS. It reads and writes
`data/products.json` and `data/settings.json` directly through Node's filesystem API.

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
| `/admin/settings` | Content manager (including hero seasons), social media, and partner links stored in `data/settings.json` |
| `POST /api/admin/login` | Password → signed session cookie |
| `POST /api/admin/logout` | Clears the cookie |
| `GET/POST /api/admin/products` | List / create |
| `GET/PUT/DELETE /api/admin/products/[id]` | Read / update / delete one record |
| `GET/PUT /api/admin/settings` | Read / update site settings |
| `POST /api/admin/uploads` | Save a hero or product image/video under `public/uploads/` |

All mutations are validated by the same rules used by `pnpm validate:data`
(`lib/product-rules.mjs`), so an admin edit cannot silently break store allowlists or
affiliate tags. Writes go to a temporary file and are renamed into place, so a crash cannot
leave a half-written JSON file.

## Duplicate products

Products are unique by **brand + normalized name**. The `id` remains a separate, immutable
uniqueness constraint.

- Normalization is Unicode NFKC, trimmed, whitespace-collapsed, and lowercase. Punctuation and
  size/count text are preserved, so genuinely different variants are not merged.
- **Add product** warns as you type — `A product with this name already exists.` — shows the
  matching product, marks the field invalid, and disables **Create product**.
- **Edit product** excludes the record being edited, so keeping the current brand + name is
  always allowed. Changing it to match another product is blocked.
- The same name under a different brand is allowed.
- A duplicate `id` on create gets the equivalent ID warning and also disables the button.
- Inline checks are a convenience; the API repeats the same check and returns **409** with
  `error`, `field` (`name` or `id`), `duplicate`, and `errors`. The form maps that response back
  onto the offending field, so a stale browser tab cannot bypass the rule.
- `pnpm validate:data` applies the same rule to `data/products.json`. Direct JSON edits that
  introduce a duplicate brand + name fail validation. There is no Import JSON feature in the
  admin; if one is added later it must reuse `findDuplicateProduct()` from
  `lib/product-rules.mjs` and skip or explicitly confirm duplicates before writing.

- **Affiliate Links** — the edit form keeps the legacy `url` + `store` pair and adds optional
  Amazon US, Amazon UK, and Stylevana URLs below it. When a store-specific link exists it wins
  for that store; the storefront merges both sources into one deduplicated button set.
  Every link is checked for the approved host and tag, and the same URL may not appear twice
  (within one product or across products).
- **Related products** — search and select existing product IDs at the bottom of the form.
  The product dialog shows the first six under "You may also like". Every referenced ID must
  exist; self-references and duplicates are rejected.
- **Delete guard** — deleting a product that another product lists in `relatedProducts`
  returns **409** with a `referrers` array. Remove those references before deleting.
- **No backfill** — existing records are untouched. They keep working through the legacy
  `url` + `store` pair until you add extra links in the admin form.

## Product gallery images

The product form keeps the required main `image` field and adds an optional, collapsible
**Add extra images** section. Extra images appear after the main photo in the product detail
popup.

- `images` is an optional array of **additional** image sources; the main image is always first.
- Maximum eight extra images. Duplicate sources (including the main image) are rejected.
- Each source may be an `https://` URL or a root-relative public path such as
  `/uploads/products/….jpg`.
- The form accepts paste-in URLs and local uploads. Product cards continue to use only the main
  `image`.
- Existing products without `images` remain valid and unchanged.

## Sale pricing

`salePrice` is optional. When set, it must use the same currency symbol as `price` and be
strictly lower; `price` must also be present. Product cards and the detail dialog show the
sale price prominently, the regular price struck through beside it, and a rounded `-X%` pill.
Products without `salePrice` render exactly as before.

## Site settings

`/admin/settings` edits `data/settings.json`, which holds three independent sections:

```json
{
  "socialLinks": {
    "instagram": "https://www.instagram.com/yourhandle/",
    "tiktok": "https://www.tiktok.com/@yourhandle",
    "pinterest": "https://www.pinterest.com/yourhandle/",
    "youtube": "https://www.youtube.com/@yourhandle",
    "x": "https://x.com/yourhandle",
    "threads": "https://www.threads.net/@yourhandle"
  },
  "content": {
    "hero": {
      "eyebrow": "K-Beauty Skincare",
      "headline": "FROSTDEW",
      "subheadline": "Skincare for a Winter-Proof Glow",
      "ctaLabel": "Shop the collection",
      "ctaHref": "#shop",
      "activeSeason": "winter",
      "seasons": {
        "winter": {
          "type": "video",
          "url": "/hero/hero-video.mp4",
          "posterUrl": "/hero/hero-poster.jpg"
        },
        "springSummer": { "type": "image", "url": "", "posterUrl": "" },
        "autumn": { "type": "image", "url": "", "posterUrl": "" }
      }
    },
    "about": {
      "eyebrow": "Our Story",
      "title": "About FrostDew",
      "intro": "FrostDew is an independent edit of Korean skincare…"
    },
    "footer": {
      "tagline": "Skincare for a Winter-Proof Glow"
    },
    "contact": {
      "intro": "Questions about a product, a broken link…",
      "responseTime": "We usually reply within 2 business days…"
    }
  },
  "partners": [
    {
      "name": "BeautyNest Korea",
      "url": "https://beautynestkorea.vercel.app/",
      "newTab": true
    }
  ]
}
```

### Content manager

The **Content manager** section controls the homepage hero, About page heading/description,
footer tagline, and Contact page intro/response-time copy.

- Every text field is required, trimmed, and length-limited.
- The hero CTA link accepts `#anchor`, `/internal-path`, or an `https://` URL; `javascript:` and
  `http://` links are rejected.
- Missing or invalid fields fall back to the current defaults in `lib/site-content.ts`, so a
  hand-edited settings file cannot blank out public copy.
- Each form saves only its own section (`content`, `socialLinks`, or `partners`). The API merges
  the supplied section into the current file, so saving one never erases the others.

### Hero season media

The hero has three persistent media slots: **Winter**, **Spring/Summer**, and **Autumn**.
Exactly one slot is live at a time. The admin can upload files or paste URLs for any slot, then
click **Use … as live** and save. Switching seasons later does not require re-uploading.

- `activeSeason` is `winter`, `springSummer`, or `autumn`.
- Each slot has `type` (`image` or `video`), `url`, and an optional `posterUrl`.
- Inactive slots may be empty. The active slot must contain media.
- Missing or invalid media falls back to the built-in winter video/poster on public pages, so
  the hero cannot lose its background.
- Media URLs may be `https://` URLs or root-relative public paths such as `/uploads/hero/…`.
- When a video fails to load, the saved poster (or the winter poster) is shown instead.

### Image uploads

The **Upload** buttons in the Content Manager and product form call
`POST /api/admin/uploads` with a multipart file and a `kind` of `hero`, `poster`, or `product`.

- Hero and poster files save to `public/uploads/hero/`; product images save to
  `public/uploads/products/`.
- URLs are returned as `/uploads/hero/…` or `/uploads/products/…` and stored in the JSON
  settings/product record.
- `next start` snapshots `public/` at boot, so newly uploaded files would normally 404 until a
  restart. `app/uploads/[...path]/route.ts` reads `public/uploads/` per request instead, so a
  fresh upload is served immediately.
- Uploaded filenames are random UUIDs; the original filename is never used for the path.
- Images may be JPEG, PNG, WebP, AVIF, or GIF (maximum **8 MB**). Videos may be MP4 or WebM
  (maximum **25 MB**). SVG is rejected.
- The server checks the real file signature, not just the browser-supplied MIME type.
- Uploads use the same admin session, write-enabled, and same-origin checks as other admin
  writes.
- Uploading saves the file immediately. The hero or product record is updated when you click
  **Save content** or **Save changes**.
- Files are not deleted automatically if you remove a row or abandon a form. Clean up unused
  files in `public/uploads/` manually.
- Vercel's filesystem is read-only/ephemeral. These uploads work for the local JSON setup, but
  production needs object storage.

### Partner links

The **Partner Links** section manages the footer's Partners column. There are no hardcoded
partner links in the codebase; the entire list lives in `data/settings.json`.

- Each partner has a name, an absolute `https://` URL, and a "new tab" toggle.
- The list order is the footer order. Maximum 20 partners; duplicate destinations are rejected.
- Names are required (max 80 characters); URLs are required (max 300) and cannot contain
  credentials.
- An empty list hides the whole column, and the footer grid collapses back to four columns.
- `newTab: true` renders `target="_blank"` with `rel="noopener noreferrer"`; `false` opens in the
  same tab.
- Invalid entries in a hand-edited file are dropped on read rather than rendered as broken links.

### Social links

- All six keys always exist; an empty string hides that icon in the footer.
- Only `https://` URLs are accepted, and the host must match the platform
  (Pinterest regional domains and `youtu.be` are allowed; X accepts `x.com` and `twitter.com`).
- URLs longer than 300 characters, URLs with embedded credentials, and duplicate profile URLs
  are rejected with a field-level error.
- The platform list, labels, order, and icons live in `lib/social-links.ts` and
  `components/social-icon.tsx`. Add a platform there if the set ever grows.

Every public page calls `connection()` and reads the settings file per request, so saving in the
admin form updates the live site on the next page load — no rebuild required. The homepage also
reads `data/products.json` per request and passes the result into the shop, so product and gallery
edits appear immediately as well. This makes the public routes dynamic (`ƒ` in the build output).

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
- The public site reads `data/settings.json` and the homepage reads `data/products.json` on every
  request, so content, social-link, product, and gallery edits appear without a rebuild.
- The JSON store and `public/uploads/` assume a persistent writable disk. Vercel's filesystem is
  read-only/ephemeral, so `data/products.json`, `data/settings.json`, and uploaded media need a
  database or blob store there.

## Replacing the JSON store with a real backend

1. Keep the API contract (`/api/admin/products`, `/api/admin/settings`) or move the same
   handlers to server actions.
2. Replace the three functions in `lib/admin/products-store.ts`:

   ```ts
   readProducts()
   writeProducts(next)
   productIndexById(products, id)
   ```

   and the two functions in `lib/site-settings.ts`:

   ```ts
   readSiteSettings()
   writeSiteSettings(settings)
   ```

   with database queries. Nothing else imports the filesystem directly.
3. Keep calling `validateProductRecord` from `lib/product-rules.mjs` in the write path.
4. Replace the shared-password check in `lib/admin/auth.ts` with your identity provider.
5. Remove `ADMIN_ALLOW_WRITES` and the filesystem-specific 501 response once writes are durable.
6. Consider optimistic concurrency (an `updatedAt` or version column) before allowing multiple
   editors.

When that is done, delete this note's "prototype" banner in `app/admin/layout.tsx`.
