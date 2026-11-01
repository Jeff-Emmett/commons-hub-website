-- carousel_items.image was a text column holding directus_files ids, so the
-- Directus Studio showed a raw uuid instead of an image picker and could not
-- show thumbnails. Every value is a valid file id (checked 2026-11-01: 38/38),
-- so the cast is lossless. scripts/cms/directus-schema-apply.mjs adds the file
-- relation once the column is uuid. Run BEFORE the schema script:
--   docker exec -i commons-hub-directus-db psql -U postgres -d directus < migrations/20261101_carousel_items_image_uuid.sql
BEGIN;
UPDATE carousel_items SET image = NULL WHERE image = '';
ALTER TABLE carousel_items ALTER COLUMN image TYPE uuid USING image::uuid;
UPDATE directus_fields SET special = 'file', interface = 'file-image'
 WHERE collection = 'carousel_items' AND field = 'image';
COMMIT;
