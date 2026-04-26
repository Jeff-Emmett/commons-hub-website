-- Commons Hub — auto-generated schema from database.types.ts
-- Drops existing public tables and recreates them.

BEGIN;

-- Drop tables + enums
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.stake_links CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.room_ao CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.public_profiles CASCADE;
DROP TABLE IF EXISTS public.progressbar CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.profilepages CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.post_carousel CASCADE;
DROP TABLE IF EXISTS public.post_accordion CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.page_post CASCADE;
DROP TABLE IF EXISTS public.page_images CASCADE;
DROP TABLE IF EXISTS public.page_category CASCADE;
DROP TABLE IF EXISTS public.page_carousel CASCADE;
DROP TABLE IF EXISTS public.page_accordion CASCADE;
DROP TABLE IF EXISTS public.organisations CASCADE;
DROP TABLE IF EXISTS public.menu CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.identities CASCADE;
DROP TABLE IF EXISTS public.identifications CASCADE;
DROP TABLE IF EXISTS public.eventpages CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.category_post CASCADE;
DROP TABLE IF EXISTS public.category_carousel CASCADE;
DROP TABLE IF EXISTS public.category_accordion CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.carousels CASCADE;
DROP TABLE IF EXISTS public.carousel_items CASCADE;
DROP TABLE IF EXISTS public.beds CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.accordions CASCADE;
DROP TABLE IF EXISTS public.accordion_items CASCADE;
DROP TABLE IF EXISTS public.accommodation_prices CASCADE;
DROP TABLE IF EXISTS public.accommodation_offerings CASCADE;

DROP TYPE IF EXISTS public.accommodation_type CASCADE;
DROP TYPE IF EXISTS public.app_permission CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.bed_type CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;
DROP TYPE IF EXISTS public.currency_type CASCADE;
DROP TYPE IF EXISTS public.identification_type_enum CASCADE;
DROP TYPE IF EXISTS public.menu_position CASCADE;
DROP TYPE IF EXISTS public.page_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

CREATE TYPE public.accommodation_type AS ENUM ('single', 'double', 'twin', 'dormitory');
CREATE TYPE public.app_permission AS ENUM ('content.CRU', 'events.CRU', 'accommodation.CRU', 'user_roles.CRUD', 'user_roles.R', 'content.D', 'images.CRUD', 'eventpages.CRU', 'users.CRUD', 'acc_settings.CRUD', 'frontdesk.CRUD', 'pricings.CRUD');
CREATE TYPE public.app_role AS ENUM ('admin', 'frontdesk', 'manager', 'event organiser');
CREATE TYPE public.bed_type AS ENUM ('single', 'double', 'bunk bed top', 'bunk bed bottom');
CREATE TYPE public.booking_status AS ENUM ('pending', 'canceled', 'no-show', 'checked-in', 'checked-out');
CREATE TYPE public.currency_type AS ENUM ('EUR', 'USD', 'EURe');
CREATE TYPE public.identification_type_enum AS ENUM ('passport', 'ID', 'drivers licence');
CREATE TYPE public.menu_position AS ENUM ('header', 'footer');
CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partially-paid', 'paid', 'refunded');

CREATE TABLE public.accommodation_offerings (
  accommodation_type accommodation_type NOT NULL,
  created_at TIMESTAMPTZ,
  description TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  image TEXT,
  is_active BOOLEAN,
  is_exclusive BOOLEAN,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.accommodation_prices (
  accommodation_offering_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ,
  currency currency_type,
  id BIGINT NOT NULL PRIMARY KEY,
  is_active BOOLEAN,
  price NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID,
  valid_from TEXT,
  valid_to TEXT
);

CREATE TABLE public.accordion_items (
  accordion_id BIGINT,
  content TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  header TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  main_image UUID,
  sort NUMERIC,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.accordions (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  name_not_used TEXT,
  status page_status,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.addresses (
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  is_active BOOLEAN,
  profile_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID,
  zip_code TEXT NOT NULL
);

CREATE TABLE public.beds (
  bed_type bed_type NOT NULL,
  created_at TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  is_active BOOLEAN,
  name TEXT NOT NULL,
  room_id BIGINT,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.carousel_items (
  button_link TEXT,
  carousel_id BIGINT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  image TEXT,
  image_url TEXT,
  quote TEXT,
  sort NUMERIC,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.carousels (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  status TEXT,
  title TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.categories (
  body TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  main_icon UUID,
  main_image UUID,
  seo_description TEXT,
  seo_title_tag TEXT,
  slug TEXT NOT NULL,
  sort NUMERIC,
  status page_status,
  summary TEXT,
  title TEXT,
  use_icon_as_image BOOLEAN,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.category_accordion (
  accordion_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.category_carousel (
  carousel_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.category_post (
  category_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  post_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.countries (
  alpha2 TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.eventpages (
  body TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  enddatetime TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  main_icon UUID,
  main_image UUID,
  seo_description TEXT,
  seo_title_tag TEXT,
  slug TEXT,
  sort NUMERIC,
  startdatetime TEXT,
  status page_status,
  summary TEXT,
  title TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.identifications (
  created_at TIMESTAMPTZ,
  date_of_issuance TEXT NOT NULL,
  expiry_date TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  id_number TEXT NOT NULL,
  is_active BOOLEAN,
  issuing_authority TEXT NOT NULL,
  issuing_country_id BIGINT NOT NULL,
  profile_id BIGINT NOT NULL,
  type identification_type_enum NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.identities (
  country_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ,
  date_of_birth TEXT NOT NULL,
  first_name TEXT NOT NULL,
  id BIGINT NOT NULL PRIMARY KEY,
  last_name TEXT NOT NULL,
  profile_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.locations (
  address TEXT,
  city TEXT,
  country_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ,
  description TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  is_active BOOLEAN,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.menu (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  menu_order NUMERIC,
  page_id BIGINT,
  position menu_position,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.organisations (
  created_at TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  is_active BOOLEAN,
  name TEXT NOT NULL,
  profile_id BIGINT NOT NULL,
  registration_number TEXT,
  type TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID,
  vat_number TEXT
);

CREATE TABLE public.page_accordion (
  accordion_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  page_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.page_carousel (
  carousel_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  page_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.page_category (
  category_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  page_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.page_images (
  alt_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  description TEXT,
  id UUID NOT NULL PRIMARY KEY,
  image TEXT NOT NULL,
  name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  user_created UUID,
  user_id UUID,
  user_updated UUID
);

CREATE TABLE public.page_post (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  page_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.pages (
  body TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  icon_filename TEXT,
  icon_id UUID,
  id BIGINT NOT NULL PRIMARY KEY,
  image_filename TEXT,
  image_id UUID,
  is_eventpage BOOLEAN,
  is_homepage BOOLEAN,
  is_map BOOLEAN,
  is_team BOOLEAN,
  main_icon UUID,
  main_image UUID,
  seo_description TEXT,
  seo_title_tag TEXT,
  slug TEXT,
  sort NUMERIC,
  status page_status,
  summary TEXT,
  title TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.post_accordion (
  accordion_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  post_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.post_carousel (
  carousel_id BIGINT NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  post_id BIGINT NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.posts (
  body TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  main_icon UUID,
  main_image UUID,
  seo_description TEXT,
  seo_title_tag TEXT,
  slug TEXT,
  sort NUMERIC,
  status page_status,
  summary TEXT,
  title TEXT,
  user_created UUID,
  user_updated UUID,
  valid_to TEXT NOT NULL
);

CREATE TABLE public.profilepages (
  body TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  main_icon UUID,
  main_image UUID,
  profile_id BIGINT NOT NULL,
  slug TEXT,
  sort NUMERIC,
  status page_status,
  summary TEXT,
  title TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.profiles (
  created_at TIMESTAMPTZ,
  email TEXT NOT NULL,
  id BIGINT NOT NULL PRIMARY KEY,
  public_profile_id BIGINT,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_id UUID,
  user_updated UUID
);

CREATE TABLE public.progressbar (
  "currentValue" NUMERIC NOT NULL,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  label1 TEXT,
  label2 TEXT,
  label3 TEXT,
  post_id BIGINT,
  "targetValue" NUMERIC NOT NULL,
  threshold1 NUMERIC NOT NULL,
  threshold2 NUMERIC NOT NULL,
  title TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.public_profiles (
  created_at TIMESTAMPTZ NOT NULL,
  id BIGINT NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL,
  user_created UUID,
  user_updated UUID,
  username TEXT
);

CREATE TABLE public.role_permissions (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  permission app_permission NOT NULL,
  role app_role NOT NULL,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.room_ao (
  ao_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  room_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.rooms (
  created_at TIMESTAMPTZ,
  description TEXT,
  id BIGINT NOT NULL PRIMARY KEY,
  image TEXT,
  is_active BOOLEAN,
  location_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  room_number TEXT,
  updated_at TIMESTAMPTZ,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.stake_links (
  cta TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id UUID NOT NULL PRIMARY KEY,
  link TEXT,
  logo UUID,
  name TEXT,
  sort NUMERIC,
  status TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.subscribers (
  created_at TIMESTAMPTZ NOT NULL,
  date_subscribed TEXT NOT NULL,
  date_unsubscribed TEXT,
  email TEXT NOT NULL,
  id BIGINT NOT NULL PRIMARY KEY,
  subscribed BOOLEAN NOT NULL,
  unsubscribe_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.team_members (
  bio TEXT,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  name TEXT,
  profile_image UUID,
  role TEXT,
  sort NUMERIC,
  status TEXT,
  user_created UUID,
  user_updated UUID
);

CREATE TABLE public.user_roles (
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  id BIGINT NOT NULL PRIMARY KEY,
  role app_role NOT NULL,
  user_created UUID,
  user_id UUID NOT NULL,
  user_updated UUID
);

-- Grants for PostgREST roles (anon, authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

COMMIT;