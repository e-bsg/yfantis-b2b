export type ProfileCategory = 'factory' | 'business' | 'transport' | 'personnel';

export type ListingType = 'job_offer' | 'job_seeking' | 'service';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface Profile {
  id: string;
  category: ProfileCategory;
  company_name: string;
  email: string;
  afm: string;
  phone: string;
  phone_verified: boolean;
  logo_url: string | null;
  description: string;
  description_en: string | null;
  website: string | null;
  country: string;
  city: string;
  is_moderated: boolean;
  is_blocked: boolean;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface TransportDetails {
  id: string;
  profile_id: string;
  countries_served: string[];
  vehicle_types: string[];
  has_refrigerated: boolean;
  has_adr: boolean;
}

export interface Listing {
  id: string;
  profile_id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  type: ListingType;
  category: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_moderated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_from_admin: boolean;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface ModerationLog {
  id: string;
  moderator_id: string;
  target_profile_id: string | null;
  target_listing_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}
