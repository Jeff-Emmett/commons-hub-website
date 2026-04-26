-- Commons Hub: unify image storage under directus_files
-- 2026-04-26
--
-- Context: legacy 136 image rows lived in storage.objects (supabase-storage),
-- new uploads land in directus_files. This migration backfills storage.objects
-- into directus_files (preserving UUIDs) so Directus admin can render a file
-- picker over the entire image set, then simplifies the website_images view
-- to read solely from directus_files.
--
-- Idempotent: safe to re-run.

BEGIN;

-- 1. Backfill directus_files from storage.objects (legacy bucket=website-images).
INSERT INTO public.directus_files (
  id, storage, filename_disk, filename_download,
  type, filesize, uploaded_on, created_on, modified_on
)
SELECT
  o.id,
  'local',
  o.name,
  o.name,
  o.metadata->>'mimetype',
  (o.metadata->>'size')::bigint,
  o.created_at,
  o.created_at,
  COALESCE(o.updated_at, o.created_at)
FROM storage.objects o
WHERE o.bucket_id = 'website-images'
  AND o.name IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. NULL legacy UUIDs that don't resolve through directus_files (dangling rot).
--    Required before adding FK constraints in the wire script.
UPDATE public.categories  SET main_icon  = NULL WHERE main_icon  IS NOT NULL AND main_icon  NOT IN (SELECT id FROM public.directus_files);
UPDATE public.categories  SET main_image = NULL WHERE main_image IS NOT NULL AND main_image NOT IN (SELECT id FROM public.directus_files);
UPDATE public.eventpages  SET main_image = NULL WHERE main_image IS NOT NULL AND main_image NOT IN (SELECT id FROM public.directus_files);
UPDATE public.pages       SET main_icon  = NULL WHERE main_icon  IS NOT NULL AND main_icon  NOT IN (SELECT id FROM public.directus_files);
UPDATE public.pages       SET main_image = NULL WHERE main_image IS NOT NULL AND main_image NOT IN (SELECT id FROM public.directus_files);
UPDATE public.posts       SET main_icon  = NULL WHERE main_icon  IS NOT NULL AND main_icon  NOT IN (SELECT id FROM public.directus_files);

-- 3. Simplify website_images view to read solely from directus_files.
--    The view powers all Next.js image lookups via PostgREST.
DROP VIEW IF EXISTS public.website_images;
CREATE VIEW public.website_images AS
SELECT
  f.id,
  f.filename_disk::text AS name,
  'website-images'::text AS bucket_id,
  f.created_on  AS created_at,
  f.modified_on AS updated_at,
  f.uploaded_on AS last_accessed_at,
  f.type::text  AS mime_type,
  f.filesize    AS size
FROM public.directus_files f
WHERE f.filename_disk IS NOT NULL;

GRANT SELECT ON public.website_images TO anon, authenticated, service_role;

COMMIT;

-- Reload PostgREST schema cache:
--   docker compose -f /opt/apps/commons-hub-supabase/docker-compose.yml stop rest
--   docker compose -f /opt/apps/commons-hub-supabase/docker-compose.yml up -d rest
