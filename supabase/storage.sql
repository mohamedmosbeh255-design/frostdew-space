-- Public Storage bucket for admin media uploads.
--
-- Run once in Supabase Dashboard → SQL Editor, or with:
--   supabase db execute --file supabase/storage.sql
--
-- Re-running is safe: the bucket settings are updated in place.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  26214400, -- 25 MB, matching MAX_VIDEO_BYTES
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No INSERT policy is needed for `anon` or `authenticated`: uploads use a
-- short-lived signed token issued by the server with the service-role key.
-- Public read works because the bucket is public; no SELECT policy is needed
-- for the `/storage/v1/object/public/...` URL used by the site.
