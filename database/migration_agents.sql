-- ============================================================
-- MIGRATION: Agent/Company multi-management
-- ============================================================

-- Table: Companies (business entities, separate from user profiles)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  afm TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  description TEXT DEFAULT '',
  description_en TEXT,
  website TEXT,
  country TEXT DEFAULT 'GR',
  city TEXT DEFAULT '',
  category profile_category NOT NULL DEFAULT 'business',
  is_moderated BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  subscription_tier subscription_tier DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Company members (agents who can represent a company)
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'agent', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, profile_id)
);

-- Add company_id to listings (listings belong to a company, not directly to a profile)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to transport_details
ALTER TABLE transport_details ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to messages (messages are between companies)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_companies_owner ON companies(owner_profile_id);
CREATE INDEX idx_companies_category ON companies(category);
CREATE INDEX idx_companies_moderated ON companies(is_moderated);
CREATE INDEX idx_company_members_profile ON company_members(profile_id);
CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_listings_company ON listings(company_id);

-- Full-text search for companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING GIN(search_vector);

CREATE OR REPLACE FUNCTION companies_search_update() RETURNS trigger AS $$
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

DROP TRIGGER IF EXISTS companies_search_trigger ON companies;
CREATE TRIGGER companies_search_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION companies_search_update();

-- RLS for new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Grant API access
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_members TO authenticated;

-- Companies: public read moderated
CREATE POLICY "public_read_companies" ON companies
  FOR SELECT TO anon
  USING (is_moderated = true AND is_blocked = false);

-- Companies: members can read their companies
CREATE POLICY "members_read_companies" ON companies
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = companies.id
    AND company_members.profile_id = (SELECT auth.uid())
  ));

-- Companies: owner can update
CREATE POLICY "owner_update_company" ON companies
  FOR UPDATE TO authenticated
  USING (owner_profile_id = (SELECT auth.uid()))
  WITH CHECK (owner_profile_id = (SELECT auth.uid()));

-- Companies: owner can insert
CREATE POLICY "owner_insert_company" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (owner_profile_id = (SELECT auth.uid()));

-- Company members: read own memberships
CREATE POLICY "read_own_memberships" ON company_members
  FOR SELECT TO authenticated
  USING (profile_id = (SELECT auth.uid()));

-- Company members: company owner can manage members
CREATE POLICY "owner_manage_members" ON company_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_members.company_id
    AND companies.owner_profile_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_members.company_id
    AND companies.owner_profile_id = (SELECT auth.uid())
  ));
