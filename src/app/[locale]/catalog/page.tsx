import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Profile, ProfileCategory } from '@/lib/types';
import { getCategoryLabel, cn } from '@/lib/utils';
import { Search, Building2, Factory, Truck, Users, ArrowRight, MapPin } from 'lucide-react';

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

const categoryUnsplash: Record<string, string> = {
  factory: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  transport: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
  personnel: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
};

function getCompanyInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

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
    <div className="min-h-screen bg-muted/20">
      {/* Page Header with gradient */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <CatalogTitle />
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            <CatalogSubtitle />
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <div className="container mx-auto max-w-7xl px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-xl shadow-lg border p-6 space-y-4">
          {/* Search bar */}
          <form className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              defaultValue={sp.search || ''}
              placeholder={sp.search ? '' : 'Search factories, products, services...'}
              className="w-full rounded-lg border bg-muted/30 pl-12 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
            <SearchPlaceholder />
          </form>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`/${locale}/catalog`}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-all border-2',
                !sp.category
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'hover:bg-accent hover:border-accent-foreground/20'
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
                    'rounded-full px-5 py-2 text-sm font-medium transition-all border-2 inline-flex items-center gap-2',
                    sp.category === cat
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                      : 'hover:bg-accent hover:border-accent-foreground/20'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {getCategoryLabel(cat, locale)}
                </a>
              );
            })}
          </div>

          {/* Results indicator */}
          {(sp.search || sp.category) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
              <ShowingResults /> <span className="font-semibold text-foreground">{(profiles || []).length}</span>
              {sp.search && (
                <span>
                  — &ldquo;{sp.search}&rdquo;
                </span>
              )}
              {(sp.search || sp.category) && (
                <a href={`/${locale}/catalog`} className="ml-2 text-primary hover:underline text-xs font-medium">
                  <ClearFilter />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="container mx-auto max-w-7xl px-4 py-10">
        {profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(profiles as Profile[]).map((profile) => {
              const Icon = categoryIcons[profile.category] || Building2;
              const imageUrl = categoryUnsplash[profile.category] || categoryUnsplash.business;
              const descriptionText =
                locale === 'el' && profile.description
                  ? profile.description
                  : profile.description_en || profile.description;

              return (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.id}`}
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col"
                >
                  {/* Card image */}
                  <div className="relative h-48 overflow-hidden bg-slate-200">
                    <img
                      src={imageUrl}
                      alt={profile.company_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Company logo/initials overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center overflow-hidden ring-2 ring-white/50">
                        {profile.logo_url ? (
                          <img
                            src={profile.logo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700">
                            {getCompanyInitials(profile.company_name)}
                          </span>
                        )}
                      </div>
                      <div className="text-white">
                        <h3 className="font-bold text-lg leading-tight drop-shadow-sm">
                          {profile.company_name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Icon className="h-3 w-3" />
                        {getCategoryLabel(profile.category, locale)}
                      </span>
                    </div>

                    {(profile.city || profile.country) && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {[profile.city, profile.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {descriptionText && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">
                        {descriptionText}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-border/50">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                        <ViewProfileLabel />
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-14 w-14 text-muted-foreground/30" />
              </div>
              <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary/50" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              <NoCompaniesFound />
            </h3>
            <p className="text-muted-foreground max-w-md">
              <NoCompaniesHint />
            </p>
            {(sp.search || sp.category) && (
              <a
                href={`/${locale}/catalog`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                <ClearAllFilters />
              </a>
            )}
          </div>
        )}
      </div>
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
  const t = await getTranslations('catalog');
  return <>{t('all_categories')}</>;
}

async function SearchPlaceholder() {
  return null;
}

async function ShowingResults() {
  const t = await getTranslations('common');
  return <>{t('search')}:</>;
}

async function ClearFilter() {
  const t = await getTranslations('common');
  return <>{t('back')}</>;
}

async function ClearAllFilters() {
  const t = await getTranslations('common');
  return <>{t('back')}</>;
}

async function NoCompaniesFound() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}

async function NoCompaniesHint() {
  const t = await getTranslations('catalog');
  return <>{t('no_companies_hint')}</>;
}

async function ViewProfileLabel() {
  const t = await getTranslations('catalog');
  return <>{t('view_profile')}</>;
}
