-- 2026-05-08: PostgREST roles for the commons-hub website.
-- Replaces the archived Supabase stack with PostgREST against the Directus DB.
-- Apply against the directus database (postgres user):
--   docker cp 20260508_postgrest_roles.sql commons-hub-directus-db:/tmp/setup.sql
--   docker exec commons-hub-directus-db psql -U postgres -d directus -f /tmp/setup.sql
--
-- Replace AUTH_PW_PLACEHOLDER with the value of PGRST_AUTHENTICATOR_PW from .env
-- before running, or run via a templating step.

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN PASSWORD 'AUTH_PW_PLACEHOLDER' NOINHERIT;
  ELSE
    ALTER ROLE authenticator WITH PASSWORD 'AUTH_PW_PLACEHOLDER';
  END IF;
END $do$;

GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Directus internals stay private.
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'directus_%'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON TABLE public.%I FROM anon, authenticated, service_role',
      r.tablename
    );
  END LOOP;
END $do$;

-- Newsletter signup form posts as anon.
GRANT INSERT ON public.subscribers TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
