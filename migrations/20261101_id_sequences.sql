-- pages, eventpages, categories, menu and team_members came over from Supabase
-- with a bigint id but NO default, so every "Create item" in Directus failed
-- with 'Validation failed for field "id". Value is required.' -- an editor could
-- edit existing pages/events/team members but never add one. Give each an owned
-- sequence starting after the current maximum id. Idempotent.
--   docker exec -i commons-hub-directus-db psql -U postgres -d directus < migrations/20261101_id_sequences.sql
-- Restart Directus afterwards so it re-reads the schema.
DO $$
DECLARE
  t text;
  seq text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pages', 'eventpages', 'categories', 'menu', 'team_members'] LOOP
    seq := t || '_id_seq';
    IF (SELECT column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'id') IS NULL THEN
      EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I OWNED BY %I.id', seq, t);
      EXECUTE format('SELECT setval(%L, GREATEST((SELECT COALESCE(MAX(id), 0) FROM %I), 1))', seq, t);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', t, seq);
      RAISE NOTICE '%: id default added', t;
    END IF;
  END LOOP;
END $$;
