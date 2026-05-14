-- Commons Hub: booking inquiries from the public-facing booking forms.
-- 2026-05-14
--
-- Each row is one inquiry submitted via /api/booking-inquiries (POST).
-- Staff triage these from Directus admin under the "booking_inquiries"
-- collection. Primary key drives Directus admin display.

BEGIN;

CREATE TABLE IF NOT EXISTS booking_inquiries (
  id                    bigserial PRIMARY KEY,
  date_created          timestamptz NOT NULL DEFAULT now(),
  date_updated          timestamptz,
  inquiry_type          text NOT NULL CHECK (inquiry_type IN ('stay', 'event')),
  status                text NOT NULL DEFAULT 'new',
  -- Common fields
  name                  text NOT NULL,
  email                 text NOT NULL,
  check_in              date,
  check_out             date,
  estimated_total_eur   numeric(10, 2),
  message               text,
  -- Stay-specific
  guests                integer,
  room_type             text,
  -- Event-specific
  event_size_package    text,  -- 'small'|'medium'|'large'|'xlarge'|'call'
  event_title           text,
  event_description     text
);

CREATE INDEX IF NOT EXISTS booking_inquiries_status_idx
  ON booking_inquiries (status);
CREATE INDEX IF NOT EXISTS booking_inquiries_created_idx
  ON booking_inquiries (date_created DESC);

-- PostgREST roles are gone, but Directus needs both the "Administrator"
-- and the public policy to be able to read; admins also need write.
-- (Directus auto-discovers the table; permissions are set via the
-- registration helper or the admin UI. No grants needed because Directus
-- runs as `postgres`.)

COMMIT;
