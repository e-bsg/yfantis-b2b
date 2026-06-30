-- ============================================================
-- SEED FIX: Move existing seed data into localized columns
-- Run AFTER migration_localized_listings.sql
--
-- Current seed data situation:
--   title / description        → Greek text
--   title_en / description_en  → English text
--
-- Desired after this script:
--   title / description        → English (mandatory primary)
--   title_el / description_el  → Greek (localized)
--   title_en / description_en  → DROPPED
-- ============================================================

-- Step 1: Migrate data — Greek → _el, English → primary
UPDATE listings
SET
  title_el       = title,
  description_el = description,
  title          = title_en,
  description    = description_en
WHERE
  title_en IS NOT NULL
  AND title_en != '';

-- Step 2: Drop now-redundant English alias columns
ALTER TABLE listings
  DROP COLUMN IF EXISTS title_en,
  DROP COLUMN IF EXISTS description_en;
