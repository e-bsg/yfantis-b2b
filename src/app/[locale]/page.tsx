import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import { Factory, Building2, Truck, Users, Briefcase, Search, MessageSquare } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_moderated', true)
    .eq('is_blocked', false)
    .limit(6)
    .order('created_at', { ascending: false });

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('is_moderated', true)
    .eq('is_active', true)
    .limit(4)
    .order('created_at', { ascending: false });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            <HomeHeroTitle />
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            <HomeHeroSubtitle />
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
            >
              <HomeRegisterCTA />
            </Link>
            <Link
              href="/catalog"
              className="rounded-md border px-6 py-3 text-lg font-medium hover:bg-accent"
            >
              <HomeBrowseCTA />
            </Link>
          </div>

          {/* Category Quick Links */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {(['factory', 'business', 'transport', 'personnel'] as const).map((cat) => (
              <Link
                key={cat}
                href={`/catalog?category=${cat}`}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <CategoryIcon cat={cat} />
                <span className="text-sm font-medium">
                  <CategoryName cat={cat} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">
          <HomeFeaturedCompanies />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(profiles || []).map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="rounded-lg border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                  {profile.logo_url ? (
                    <img src={profile.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{profile.company_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.city}, {profile.country}</p>
                </div>
              </div>
            </Link>
          ))}
          {(!profiles || profiles.length === 0) && (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              <HomeNoCompanies />
            </div>
          )}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold mb-8">
            <HomeRecentListings />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(listings || []).map((listing) => (
              <Link
                key={listing.id}
                href={`/listings`}
                className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase">
                    <ListingTypeLabel type={listing.type} />
                  </span>
                </div>
                <h3 className="font-semibold">{listing.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {listing.description}
                </p>
                {listing.profiles && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {listing.profiles.company_name}
                    {listing.location ? ` — ${listing.location}` : ''}
                  </p>
                )}
              </Link>
            ))}
            {(!listings || listings.length === 0) && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <HomeNoListings />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          <HomeHowItWorks />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            icon={<Users className="h-8 w-8" />}
            title={<HomeStep1Title />}
            desc={<HomeStep1Desc />}
          />
          <StepCard
            icon={<Search className="h-8 w-8" />}
            title={<HomeStep2Title />}
            desc={<HomeStep2Desc />}
          />
          <StepCard
            icon={<MessageSquare className="h-8 w-8" />}
            title={<HomeStep3Title />}
            desc={<HomeStep3Desc />}
          />
        </div>
      </section>
    </div>
  );
}

function StepCard({ icon, title, desc }: { icon: React.ReactNode; title: React.ReactNode; desc: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function CategoryIcon({ cat }: { cat: string }) {
  switch (cat) {
    case 'factory': return <Factory className="h-6 w-6" />;
    case 'business': return <Building2 className="h-6 w-6" />;
    case 'transport': return <Truck className="h-6 w-6" />;
    case 'personnel': return <Users className="h-6 w-6" />;
    default: return <Building2 className="h-6 w-6" />;
  }
}

// Translation wrapper components
import { getTranslations } from 'next-intl/server';

async function HomeHeroTitle() { const t = await getTranslations('home'); return <>{t('hero_title')}</>; }
async function HomeHeroSubtitle() { const t = await getTranslations('home'); return <>{t('hero_subtitle')}</>; }
async function HomeRegisterCTA() { const t = await getTranslations('common'); return <>{t('register')}</>; }
async function HomeBrowseCTA() { const t = await getTranslations('common'); return <>{t('catalog')}</>; }
async function CategoryName({ cat }: { cat: string }) { const t = await getTranslations('categories'); return <>{t(cat as any)}</>; }
async function HomeFeaturedCompanies() { const t = await getTranslations('home'); return <>{t('featured_companies')}</>; }
async function HomeNoCompanies() { const t = await getTranslations('common'); return <>{t('no_results')}</>; }
async function HomeRecentListings() { const t = await getTranslations('home'); return <>{t('recent_listings')}</>; }
async function HomeNoListings() { const t = await getTranslations('common'); return <>{t('no_results')}</>; }
async function ListingTypeLabel({ type }: { type: string }) { const t = await getTranslations('listings'); return <>{t(type as any)}</>; }
async function HomeHowItWorks() { const t = await getTranslations('home'); return <>{t('how_it_works')}</>; }
async function HomeStep1Title() { const t = await getTranslations('home'); return <>{t('step1_title')}</>; }
async function HomeStep1Desc() { const t = await getTranslations('home'); return <>{t('step1_desc')}</>; }
async function HomeStep2Title() { const t = await getTranslations('home'); return <>{t('step2_title')}</>; }
async function HomeStep2Desc() { const t = await getTranslations('home'); return <>{t('step2_desc')}</>; }
async function HomeStep3Title() { const t = await getTranslations('home'); return <>{t('step3_title')}</>; }
async function HomeStep3Desc() { const t = await getTranslations('home'); return <>{t('step3_desc')}</>; }
