import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  Factory,
  Globe,
  ArrowRight,
  Search,
  Building2,
  Users,
  Briefcase,
  Star,
  Shield,
  MessageSquare,
  Zap,
} from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

const FEATURED_UNSPLASH = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565464027197-ca5c4c8b5e6f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504917597771-1fd029a8d07e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586528116311-604f1f0e3b7a?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
];

function listingBorderColor(type: string) {
  switch (type) {
    case 'job_offer':
      return 'border-l-blue-500';
    case 'service':
      return 'border-l-green-500';
    case 'job_seeking':
      return 'border-l-amber-500';
    default:
      return 'border-l-primary';
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerSupabase();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_moderated', true)
    .eq('is_blocked', false)
    .limit(6)
    .order('created_at', { ascending: false });

  // Read max listings per category setting (default: 2)
  let maxPerCategory = 2;
  try {
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage.max_listings_per_category')
      .single();
    if (setting?.value) maxPerCategory = parseInt(setting.value, 10) || 2;
  } catch { /* table may not exist yet, use default */ }

  // Fetch listings, then deduplicate by category up to maxPerCategory each
  const { data: allListings } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('is_moderated', true)
    .eq('is_active', true)
    .limit(20)
    .order('created_at', { ascending: false });

  // Deduplicate: max N per type
  const typeCounts: Record<string, number> = {};
  const listings = (allListings || []).filter((l) => {
    typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    return typeCounts[l.type] <= maxPerCategory;
  }).slice(0, 8);

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative bg-cover bg-center text-white overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop)',
        }}
      >
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-950/90" />

        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial glow accents */}
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_50%,#60a5fa_0,transparent_50%),radial-gradient(circle_at_70%_20%,#94a3b8_0,transparent_50%)]" />

        <div className="relative container mx-auto max-w-7xl px-4 py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 mb-8 backdrop-blur-sm">
              <Globe className="h-4 w-4" />
              <HomeHeroBadge />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <HomeHeroTitle />
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              <HomeHeroSubtitle />
            </p>

            {/* CTA Buttons — more prominent */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.03]"
              >
                <Building2 className="h-5 w-5" />
                <HomeRegisterCTA />
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/catalog"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-white/5 px-10 py-4 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:border-blue-400/60 transition-all duration-300 hover:scale-[1.03]"
              >
                <Search className="h-5 w-5" />
                <HomeBrowseCTA />
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="container mx-auto max-w-7xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            <HomeWhyChooseUs />
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            <HomeWhyChooseUsSubtitle />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <WhyCard
            icon={<Shield className="h-10 w-10" />}
            title={<HomeWhyVerified />}
            desc={<HomeWhyVerifiedDesc />}
          />
          <WhyCard
            icon={<Globe className="h-10 w-10" />}
            title={<HomeWhyGlobal />}
            desc={<HomeWhyGlobalDesc />}
          />
          <WhyCard
            icon={<MessageSquare className="h-10 w-10" />}
            title={<HomeWhyDirect />}
            desc={<HomeWhyDirectDesc />}
          />
          <WhyCard
            icon={<Zap className="h-10 w-10" />}
            title={<HomeWhyFree />}
            desc={<HomeWhyFreeDesc />}
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              <HomeHowItWorks />
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              <HomeHowItWorksSubtitle />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<Users className="h-9 w-9" />}
              title={<HomeStep1Title />}
              desc={<HomeStep1Desc />}
            />
            <StepCard
              step={2}
              icon={<Search className="h-9 w-9" />}
              title={<HomeStep2Title />}
              desc={<HomeStep2Desc />}
            />
            <StepCard
              step={3}
              icon={<Globe className="h-9 w-9" />}
              title={<HomeStep3Title />}
              desc={<HomeStep3Desc />}
            />
          </div>
        </div>
      </section>

      {/* ── Featured Companies ── */}
      <section className="container mx-auto max-w-7xl px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            <HomeFeaturedCompanies />
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            <HomeFeaturedSubtitle />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(profiles || []).map((profile, idx) => {
            const imgSrc = FEATURED_UNSPLASH[idx % FEATURED_UNSPLASH.length];
            return (
              <Link
                key={profile.id}
                href={`/profile/${profile.id}`}
                className="group rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Large image header */}
                <div className="relative h-[300px] overflow-hidden">
                  <img
                    src={imgSrc}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Dark gradient overlay at the bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

                  {/* Company name overlay at the bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                        {profile.logo_url ? (
                          <img
                            src={profile.logo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-bold text-slate-700">
                            {profile.company_name?.charAt(0).toUpperCase() ||
                              '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3
                          className="font-semibold text-lg text-white leading-tight"
                          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                        >
                          {profile.company_name}
                        </h3>
                        <p className="text-sm text-white/80">
                          {profile.city}
                          {profile.city && profile.country && ', '}
                          {profile.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    {profile.subscription_tier === 'premium' ? (
                      <Star className="h-3 w-3 text-amber-500" />
                    ) : null}
                    <HomeVerifiedBadge />
                  </span>
                  <span className="text-sm font-medium text-primary group-hover:underline">
                    <HomeViewProfile />
                  </span>
                </div>
              </Link>
            );
          })}

          {(!profiles || profiles.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg text-muted-foreground">
                <HomeNoCompanies />
              </p>
            </div>
          )}
        </div>

        {/* View all link */}
        <div className="mt-10 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <HomeViewAllCompanies />
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Recent Listings ── */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              <HomeRecentListings />
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              <HomeRecentListingsSubtitle />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(listings || []).map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className={`group rounded-xl border border-l-4 bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 ${listingBorderColor(listing.type)}`}
              >
                {/* Card header with listing type badge overlay */}
                <div className="relative overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <Briefcase className="h-3 w-3" />
                        <ListingTypeLabel type={listing.type} />
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                      {listing.description}
                    </p>
                  </div>
                </div>

                {listing.profiles && (
                  <div className="flex items-center gap-2 px-6 pb-5 pt-3 border-t mx-5 mb-1">
                    <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {listing.profiles.company_name
                        ?.charAt(0)
                        .toUpperCase() || '?'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {listing.profiles.company_name}
                      {listing.location ? ` — ${listing.location}` : ''}
                    </p>
                  </div>
                )}
              </Link>
            ))}

            {(!listings || listings.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4 text-lg text-muted-foreground">
                  <HomeNoListings />
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <HomeViewAllListings />
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function WhyCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border bg-card p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
      <div className="mb-5 rounded-full bg-primary/10 p-4 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  desc,
}: {
  step: number;
  icon: React.ReactNode;
  title: React.ReactNode;
  desc: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center text-center rounded-2xl border bg-card p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      {/* Step number badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
        {step}
      </div>
      <div className="mb-5 mt-3 rounded-full bg-primary/10 p-4 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Translation wrapper components ──

async function HomeHeroBadge() {
  const t = await getTranslations('common');
  return <>{t('site_description')}</>;
}

async function HomeHeroTitle() {
  const t = await getTranslations('home');
  return <>{t('hero_title')}</>;
}

async function HomeHeroSubtitle() {
  const t = await getTranslations('home');
  return <>{t('hero_subtitle')}</>;
}

async function HomeRegisterCTA() {
  const t = await getTranslations('home');
  return <>{t('cta_register')}</>;
}

async function HomeBrowseCTA() {
  const t = await getTranslations('home');
  return <>{t('cta_browse')}</>;
}

// ── Why Choose Us translations ──

async function HomeWhyChooseUs() {
  const t = await getTranslations('home');
  return <>{t('why_choose_us')}</>;
}

async function HomeWhyChooseUsSubtitle() {
  const t = await getTranslations('home');
  return <>{t('why_choose_us_subtitle')}</>;
}

async function HomeWhyVerified() {
  const t = await getTranslations('home');
  return <>{t('why_verified')}</>;
}

async function HomeWhyVerifiedDesc() {
  const t = await getTranslations('home');
  return <>{t('why_verified_desc')}</>;
}

async function HomeWhyGlobal() {
  const t = await getTranslations('home');
  return <>{t('why_global')}</>;
}

async function HomeWhyGlobalDesc() {
  const t = await getTranslations('home');
  return <>{t('why_global_desc')}</>;
}

async function HomeWhyDirect() {
  const t = await getTranslations('home');
  return <>{t('why_direct')}</>;
}

async function HomeWhyDirectDesc() {
  const t = await getTranslations('home');
  return <>{t('why_direct_desc')}</>;
}

async function HomeWhyFree() {
  const t = await getTranslations('home');
  return <>{t('why_free')}</>;
}

async function HomeWhyFreeDesc() {
  const t = await getTranslations('home');
  return <>{t('why_free_desc')}</>;
}

// ── Featured / How It Works / Listings translations ──

async function HomeFeaturedCompanies() {
  const t = await getTranslations('home');
  return <>{t('featured_companies')}</>;
}

async function HomeFeaturedSubtitle() {
  const t = await getTranslations('home');
  return <>{t('hero_subtitle')}</>;
}

async function HomeViewProfile() {
  const t = await getTranslations('catalog');
  return <>{t('view_profile')}</>;
}

async function HomeViewAllCompanies() {
  const t = await getTranslations('home');
  return <>{t('view_all_companies')}</>;
}

async function HomeNoCompanies() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}

async function HomeHowItWorks() {
  const t = await getTranslations('home');
  return <>{t('how_it_works')}</>;
}

async function HomeHowItWorksSubtitle() {
  const t = await getTranslations('home');
  return <>Three simple steps to expand your industrial network</>;
}

async function HomeStep1Title() {
  const t = await getTranslations('home');
  return <>{t('step1_title')}</>;
}

async function HomeStep1Desc() {
  const t = await getTranslations('home');
  return <>{t('step1_desc')}</>;
}

async function HomeStep2Title() {
  const t = await getTranslations('home');
  return <>{t('step2_title')}</>;
}

async function HomeStep2Desc() {
  const t = await getTranslations('home');
  return <>{t('step2_desc')}</>;
}

async function HomeStep3Title() {
  const t = await getTranslations('home');
  return <>{t('step3_title')}</>;
}

async function HomeStep3Desc() {
  const t = await getTranslations('home');
  return <>{t('step3_desc')}</>;
}

async function HomeRecentListings() {
  const t = await getTranslations('home');
  return <>{t('recent_listings')}</>;
}

async function HomeRecentListingsSubtitle() {
  const t = await getTranslations('home');
  return <>{t('recent_listings_subtitle')}</>;
}

async function HomeNoListings() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}

async function HomeViewAllListings() {
  const t = await getTranslations('common');
  return <>{t('listings')}</>;
}

async function ListingTypeLabel({ type }: { type: string }) {
  const t = await getTranslations('listings');
  return <>{t(type as any)}</>;
}

async function HomeVerifiedBadge() {
  const t = await getTranslations('home');
  return <>{t('verified_badge')}</>;
}
