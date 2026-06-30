-- B2B Directory Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- Updated: Supabase best practices (TO clause, WITH CHECK, GRANT)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE profile_category AS ENUM ('factory', 'business', 'transport', 'personnel');
CREATE TYPE listing_type AS ENUM ('job_offer', 'job_seeking', 'service');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles table (extends auth.users — one company per user)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  category profile_category NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  afm TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  description TEXT DEFAULT '',
  description_en TEXT,
  website TEXT,
  country TEXT DEFAULT 'GR',
  city TEXT DEFAULT '',
  is_moderated BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  subscription_tier subscription_tier DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transport details (for transport category)
CREATE TABLE transport_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  countries_served TEXT[] DEFAULT '{}',
  vehicle_types TEXT[] DEFAULT '{}',
  has_refrigerated BOOLEAN DEFAULT false,
  has_adr BOOLEAN DEFAULT false
);

-- Job/service listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  type listing_type NOT NULL DEFAULT 'job_offer',
  category TEXT DEFAULT '',
  location TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  is_moderated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal messaging
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  is_from_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation log
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_category ON profiles(category);
CREATE INDEX idx_profiles_moderated ON profiles(is_moderated);
CREATE INDEX idx_profiles_blocked ON profiles(is_blocked);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_created ON profiles(created_at DESC);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_moderated ON listings(is_moderated);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_messages_from ON messages(from_profile_id, created_at DESC);
CREATE INDEX idx_messages_to ON messages(to_profile_id, is_read, created_at DESC);
CREATE INDEX idx_transport_profile ON transport_details(profile_id);

-- ============================================================
-- FULL-TEXT SEARCH
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);

CREATE OR REPLACE FUNCTION profiles_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.company_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.country, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_search_trigger ON profiles;
CREATE TRIGGER profiles_search_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_search_update();

ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(search_vector);

CREATE OR REPLACE FUNCTION listings_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_search_trigger ON listings;
CREATE TRIGGER listings_search_trigger
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION listings_search_update();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Grant API access to roles (required for Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON transport_details TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON listings TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT ON moderation_logs TO authenticated;

-- --- Profiles ---
-- Public: read only moderated, unblocked profiles
CREATE POLICY "public_read_moderated" ON profiles
  FOR SELECT TO anon
  USING (is_moderated = true AND is_blocked = false);

-- Authenticated: read own profile (even if unmoderated)
CREATE POLICY "user_read_own" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Authenticated: insert own profile
CREATE POLICY "user_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Authenticated: update own profile (WITH CHECK prevents IDOR)
CREATE POLICY "user_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Admin: full access on profiles (handled via service_role in API)

-- --- Transport Details ---
CREATE POLICY "public_read_transport" ON transport_details
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = transport_details.profile_id
    AND profiles.is_moderated = true AND profiles.is_blocked = false
  ));

CREATE POLICY "user_manage_transport" ON transport_details
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = transport_details.profile_id
    AND profiles.id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = transport_details.profile_id
    AND profiles.id = (SELECT auth.uid())
  ));

-- --- Listings ---
CREATE POLICY "public_read_listings" ON listings
  FOR SELECT TO anon
  USING (is_moderated = true AND is_active = true);

CREATE POLICY "user_read_own_listings" ON listings
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

CREATE POLICY "user_insert_listings" ON listings
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = profile_id);

CREATE POLICY "user_update_listings" ON listings
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

CREATE POLICY "user_delete_listings" ON listings
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

-- --- Messages ---
CREATE POLICY "user_read_messages" ON messages
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = from_profile_id OR (SELECT auth.uid()) = to_profile_id);

CREATE POLICY "user_send_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = from_profile_id);

-- --- Moderation Logs ---
-- Only readable by admins (handled via service_role in API)
CREATE POLICY "admin_read_logs" ON moderation_logs
  FOR SELECT TO authenticated
  USING (false); -- no regular user can read; admin uses service_role

-- ============================================================
-- STORAGE BUCKET (Company Logos)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, '{image/png,image/jpeg,image/webp,image/svg+xml}')
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (using TO clause, not deprecated auth.role())
CREATE POLICY "public_read_logos" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'logos');

CREATE POLICY "auth_upload_logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "owner_update_logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND owner = (SELECT auth.uid()));

CREATE POLICY "owner_delete_logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND owner = (SELECT auth.uid()));
