import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Profile, ProfileCategory } from '@/lib/types';
import { getCategoryLabel, formatDate, cn } from '@/lib/utils';
import { Search, Building2, Factory, Truck, Users } from 'lucide-react';

type Props = {
  searchParams: Promise<{ search?: string; category?: string }>;
  params: Promise<{ locale: string }>;
};

const CATEGORIES: ProfileCategory[] = ['factory', 'business', 'transport', 'personnel'];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  factory: Factory,
  business: Building2,
  transport: Truck,
  personnel: Users,
};

export default async function CatalogPage({ searchParams, params }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createServerSupabase();

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_moderated', true)
    .eq('is_blocked', false)
    .order('created_at', { ascending: false });

  if (sp.search) {
    query = query.or(
      `company_name.ilike.%${sp.search}%,description.ilike.%${sp.search}%,city.ilike.%${sp.search}%`
    );
  }

  if (sp.category && CATEGORIES.includes(sp.category as ProfileCategory)) {
    query = query.eq('category', sp.category);
  }

  const { data: profiles } = await query;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <CatalogTitle />
        </h1>
        <p className="mt-2 text-muted-foreground">
          <CatalogSubtitle />
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={sp.search || ''}
            placeholder="Search companies..."
            className="w-full rounded-md border pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Category filter buttons */}
        <div className="flex flex-wrap gap-2">
          <a
            href={`/${locale}/catalog`}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
              !sp.category
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            )}
          >
            <AllCategories />
          </a>
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat] || Building2;
            return (
              <a
                key={cat}
                href={`/${locale}/catalog?category=${cat}`}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border inline-flex items-center gap-1.5',
                  sp.category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {getCategoryLabel(cat, locale)}
              </a>
            );
          })}
        </div>

        {/* Active search/category indicator */}
        {(sp.search || sp.category) && (
          <p className="text-sm text-muted-foreground">
            <ShowingResults /> {(profiles || []).length}
          </p>
        )}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(profiles || []).map((profile: Profile) => {
          const Icon = categoryIcons[profile.category] || Building2;
          return (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="group rounded-lg border bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt={profile.company_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {profile.company_name}
                  </h3>
                  <span className="inline-block mt-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {getCategoryLabel(profile.category, locale)}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                {profile.city && profile.country && (
                  <p>
                    {profile.city}, {profile.country}
                  </p>
                )}
                <p className="text-xs">
                  <JoinedDate date={profile.created_at} locale={locale} />
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {(!profiles || profiles.length === 0) && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            <NoCompaniesFound />
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            <NoCompaniesHint />
          </p>
        </div>
      )}
    </div>
  );
}

// Translation wrapper components
async function CatalogTitle() {
  const t = await getTranslations('common');
  return <>{t('catalog')}</>;
}

async function CatalogSubtitle() {
  const t = await getTranslations('common');
  return <>{t('site_description')}</>;
}

async function AllCategories() {
  const t = await getTranslations('categories');
  return <>{t('select_category')}</>;
}

async function ShowingResults() {
  const t = await getTranslations('common');
  return <>{t('search')}:</>;
}

async function NoCompaniesFound() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}

async function NoCompaniesHint() {
  const t = await getTranslations('catalog');
  return <>{t('no_companies_hint')}</>;
}

function JoinedDate({ date, locale }: { date: string; locale: string }) {
  return <>{formatDate(date, locale)}</>;
}
