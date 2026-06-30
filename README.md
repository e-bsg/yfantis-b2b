# Yfantis B2B Directory

Professional B2B Catalog — mini Alibaba/Globy for the Greek and international market.

**Stack:** Next.js 16 + Vercel (free hosting) + Supabase (free DB/Auth/Storage)

## Features

| Module | Status |
|---|---|
| 🌐 **Multilingual** | Greek (el) + English (en) via next-intl |
| 👤 **Registration** | 4 categories: Factory, Business, Transport, Personnel |
| 📋 **Profiles** | Company name, email, ΑΦΜ, phone, logo, description, website |
| 🏭 **Catalog** | Searchable B2B company directory with category filters |
| 🚛 **Transport** | Dedicated transport section with countries, vehicle types, ADR/refrigerated |
| 📰 **Listings** | Job offers / job seeking / services with moderation |
| 💬 **Messages** | Admin ↔ User internal messaging |
| 🛡️ **Moderation** | Profile + listing approval, block/unblock |
| 💳 **Subscriptions** | Architecture ready (free/basic/premium tiers) |

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `database/schema.sql`
3. Run the query — this creates all tables, RLS policies, and storage bucket
4. Copy your project URL and anon key from **Settings → API**

### 2. Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and keys
```

### 3. Install & Run

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

```bash
# Push to GitHub, then import in Vercel
# Add the same env vars in Vercel project settings
```

## Architecture

```
src/
  app/
    [locale]/              # i18n pages (el, en)
      page.tsx             # Home page
      catalog/             # B2B company catalog
      listings/            # Job listings + new listing form
      transport/           # Transport-only companies
      profile/[id]/        # Public profile view
      profile/edit/        # Edit own profile
      messages/            # Inbox + thread view
      login/               # Login
      register/            # Registration
      admin/               # Dashboard + moderation queue
    api/                   # REST API routes
      auth/                # Auth endpoints
      profiles/            # Profile CRUD
      listings/            # Listing CRUD
      messages/            # Message CRUD
      admin/               # Moderation + user management
  components/              # Shared React components
  lib/                     # Supabase clients, types, utils
  i18n/                    # Intl config + routing
  messages/                # el.json, en.json
database/
  schema.sql               # Full Supabase schema + RLS
```

## Database Tables

- **profiles** — Company profiles linked to auth.users
- **transport_details** — Transport-specific fields
- **listings** — Job/service classifieds
- **messages** — Internal messaging
- **moderation_logs** — Audit trail

## Free Tier Limits (Supabase)

- 500MB database
- 2 projects
- 50,000 monthly active users
- 1GB storage
- 5GB bandwidth

Scale to paid when you outgrow these.
