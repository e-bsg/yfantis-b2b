-- ============================================================
-- MIGRATION: Localized listings (i18n columns + listing_images)
-- Run AFTER schema.sql and migration_agents.sql
-- ============================================================

-- ============================================================
-- 1. Add localized columns to listings
--    title / description = English (mandatory, already exist)
--    title_xx / description_xx = optional localized overrides
-- ============================================================
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS title_el TEXT,
  ADD COLUMN IF NOT EXISTS title_it TEXT,
  ADD COLUMN IF NOT EXISTS title_zh TEXT,
  ADD COLUMN IF NOT EXISTS title_bg TEXT,
  ADD COLUMN IF NOT EXISTS title_tr TEXT,
  ADD COLUMN IF NOT EXISTS description_el TEXT,
  ADD COLUMN IF NOT EXISTS description_it TEXT,
  ADD COLUMN IF NOT EXISTS description_zh TEXT,
  ADD COLUMN IF NOT EXISTS description_bg TEXT,
  ADD COLUMN IF NOT EXISTS description_tr TEXT;

-- ============================================================
-- 2. Replace listings_search_update() to include all localized
--    columns in the search vector
-- ============================================================
CREATE OR REPLACE FUNCTION listings_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_el, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_it, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_zh, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_bg, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_tr, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_el, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_it, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_zh, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_bg, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_tr, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Create listing_images table
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing
  ON listing_images(listing_id, sort_order);

-- ============================================================
-- 4. RLS for listing_images
-- ============================================================
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Public: read images of moderated, active listings
CREATE POLICY "public_read_images" ON listing_images
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_images.listing_id
    AND listings.is_moderated = true
    AND listings.is_active = true
  ));

-- Owner: manage images of own listings
CREATE POLICY "owner_manage_images" ON listing_images
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_images.listing_id
    AND listings.profile_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_images.listing_id
    AND listings.profile_id = (SELECT auth.uid())
  ));

-- ============================================================
-- 5. GRANT for listing_images
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON listing_images TO authenticated;
GRANT SELECT ON listing_images TO anon;
