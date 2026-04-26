-- Schema for Commons Hub Website
-- This file contains the SQL commands to create and manage database tables

-- ============================================================================
-- DROP TABLES (in reverse order of creation to handle dependencies)
-- ============================================================================

-- First drop junction tables
DROP TABLE IF EXISTS post_carousel CASCADE;
DROP TABLE IF EXISTS post_accordion CASCADE;
DROP TABLE IF EXISTS category_carousel CASCADE;
DROP TABLE IF EXISTS category_accordion CASCADE;
DROP TABLE IF EXISTS category_post CASCADE;
DROP TABLE IF EXISTS page_carousel CASCADE;
DROP TABLE IF EXISTS page_accordion CASCADE;
DROP TABLE IF EXISTS page_post CASCADE;
DROP TABLE IF EXISTS page_category CASCADE;

-- Then drop entity tables
DROP TABLE IF EXISTS carousel_items CASCADE;
DROP TABLE IF EXISTS carousels CASCADE;
DROP TABLE IF EXISTS accordion_items CASCADE;
DROP TABLE IF EXISTS accordions CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS stake_links CASCADE;
DROP TABLE IF EXISTS eventPages CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS menu CASCADE;

-- Finally drop enum types
DROP TYPE IF EXISTS page_status CASCADE;
DROP TYPE IF EXISTS menu_position CASCADE;

-- ============================================================================
-- CREATE ENUM TYPES
-- ============================================================================

CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE menu_position AS ENUM ('header', 'footer');

-- ============================================================================
-- CREATE BASE TABLES
-- ============================================================================

-- Menu table (singleton)
CREATE TABLE menu (
  id BIGINT PRIMARY KEY DEFAULT 1,
  position menu_position UNIQUE
);

-- Pages table
CREATE TABLE pages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status page_status,
  sort INTEGER,
  title TEXT,
  slug TEXT,
  main_image UUID,
  body TEXT,
  menu_id BIGINT,
  is_homepage BOOLEAN,
  is_map BOOLEAN,
  is_team BOOLEAN,
  summary TEXT,
  main_icon UUID,
  is_eventpage BOOLEAN,
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

-- Categories table
CREATE TABLE categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status CHARACTER VARYING,
  sort INTEGER,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  title CHARACTER VARYING,
  slug CHARACTER VARYING,
  main_image UUID,
  body TEXT,
  summary CHARACTER VARYING,
  main_icon UUID
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  status CHARACTER VARYING,
  sort INTEGER,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  title CHARACTER VARYING,
  slug CHARACTER VARYING,
  main_image UUID,
  body TEXT,
  summary CHARACTER VARYING,
  main_icon UUID
);

-- Accordions table
CREATE TABLE accordions (
  id INTEGER PRIMARY KEY,
  status CHARACTER VARYING,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  name_not_used CHARACTER VARYING
);

-- Accordion items table
CREATE TABLE accordion_items (
  id INTEGER PRIMARY KEY,
  content TEXT,
  header CHARACTER VARYING,
  main_image UUID,
  accordion_id INTEGER,
  FOREIGN KEY (accordion_id) REFERENCES accordions(id)
);

-- Carousels table
CREATE TABLE carousels (
  id INTEGER PRIMARY KEY,
  status CHARACTER VARYING,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  heading CHARACTER VARYING
);

-- Carousel items table
CREATE TABLE carousel_items (
  id INTEGER PRIMARY KEY,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  quote TEXT,
  image UUID,
  button_link CHARACTER VARYING
);

-- Stake links table
CREATE TABLE stake_links (
  id UUID PRIMARY KEY,
  status CHARACTER VARYING,
  sort INTEGER,
  cta CHARACTER VARYING,
  link CHARACTER VARYING,
  logo UUID,
  name CHARACTER VARYING
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  status CHARACTER VARYING,
  sort INTEGER,
  name CHARACTER VARYING,
  role CHARACTER VARYING,
  profile_image UUID,
  bio TEXT,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE
);

-- Event pages table
CREATE TABLE eventPages (
  id INTEGER PRIMARY KEY,
  status page_status,
  sort INTEGER,
  user_created UUID,
  date_created TIMESTAMP WITH TIME ZONE,
  user_updated UUID,
  date_updated TIMESTAMP WITH TIME ZONE,
  title CHARACTER VARYING,
  slug CHARACTER VARYING,
  main_image UUID,
  summary TEXT,
  body TEXT,
  main_icon UUID,
  StartDateTime TIMESTAMP WITHOUT TIME ZONE,
  EndDateTime TIMESTAMP WITHOUT TIME ZONE
);

-- ============================================================================
-- CREATE JUNCTION TABLES
-- ============================================================================

-- Pages and Categories
CREATE TABLE page_category (
  page_id BIGINT,
  category_id BIGINT,
  PRIMARY KEY (page_id, category_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Pages and Posts
CREATE TABLE page_post (
  page_id BIGINT,
  post_id UUID,
  PRIMARY KEY (page_id, post_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Pages and Accordions
CREATE TABLE page_accordion (
  page_id BIGINT,
  accordion_id INTEGER,
  PRIMARY KEY (page_id, accordion_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (accordion_id) REFERENCES accordions(id) ON DELETE CASCADE
);

-- Pages and Carousels
CREATE TABLE page_carousel (
  page_id BIGINT,
  carousel_id INTEGER,
  PRIMARY KEY (page_id, carousel_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (carousel_id) REFERENCES carousels(id) ON DELETE CASCADE
);

-- Categories and Posts
CREATE TABLE category_post (
  category_id BIGINT,
  post_id UUID,
  PRIMARY KEY (category_id, post_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Categories and Accordions
CREATE TABLE category_accordion (
  category_id BIGINT,
  accordion_id INTEGER,
  PRIMARY KEY (category_id, accordion_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (accordion_id) REFERENCES accordions(id) ON DELETE CASCADE
);

-- Categories and Carousels
CREATE TABLE category_carousel (
  category_id BIGINT,
  carousel_id INTEGER,
  PRIMARY KEY (category_id, carousel_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (carousel_id) REFERENCES carousels(id) ON DELETE CASCADE
);

-- Posts and Accordions
CREATE TABLE post_accordion (
  post_id UUID,
  accordion_id INTEGER,
  PRIMARY KEY (post_id, accordion_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (accordion_id) REFERENCES accordions(id) ON DELETE CASCADE
);

-- Posts and Carousels
CREATE TABLE post_carousel (
  post_id UUID,
  carousel_id INTEGER,
  PRIMARY KEY (post_id, carousel_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (carousel_id) REFERENCES carousels(id) ON DELETE CASCADE
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Base tables
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accordions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accordion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventPages ENABLE ROW LEVEL SECURITY;

-- Junction tables
ALTER TABLE page_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_accordion ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_accordion ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_accordion ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_carousel ENABLE ROW LEVEL SECURITY;