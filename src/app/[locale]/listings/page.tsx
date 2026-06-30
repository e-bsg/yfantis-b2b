import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import { Briefcase, Search, Wrench } from 'lucide-react';
import type { ListingType } from '@/lib/types';
import { cn } from '@/lib/utils';

type SearchParams = Promise<{ type?: string }>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createServerSupabase();
  const params = await searchParams;

  let query = supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('is_moderated', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (params.type && ['job_offer', 'job_seeking', 'service'].includes(params.type)) {
    query = query.eq('type', params.type);
  }

  const { data: listings } = await query;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <ListingsTitle />
        </h1>
        <Link
          href="/listings/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ListingsNewCTA />
        </Link>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/listings"
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
            !params.type
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-accent'
          )}
        >
          <AllFilter />
        </Link>
        {(['job_offer', 'job_seeking', 'service'] as const).map((type) => (
          <Link
            key={type}
            href={`/listings?type=${type}`}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
              params.type === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            )}
          >
            <TypeFilterLabel type={type} />
          </Link>
        ))}
      </div>

      {/* Grid */}
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/profile/${listing.profile_id}`}
              className="rounded-lg border bg-card p-6 hover:shadow-lg transition-shadow flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <TypeIcon type={listing.type} />
                <span className="text-xs font-medium text-primary uppercase">
                  <ListingTypeLabel type={listing.type} />
                </span>
              </div>
              <h2 className="font-semibold text-lg">{listing.title}</h2>
              {listing.profiles && (
                <p className="text-sm text-muted-foreground">
                  {listing.profiles.company_name}
                </p>
              )}
              {listing.location && (
                <p className="text-xs text-muted-foreground">{listing.location}</p>
              )}
              {(listing.salary_min || listing.salary_max) && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {listing.salary_min && `€${listing.salary_min.toLocaleString()}`}
                  {listing.salary_min && listing.salary_max && ' — '}
                  {listing.salary_max && `€${listing.salary_max.toLocaleString()}`}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {listing.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">
            <EmptyState />
          </p>
          <Link
            href="/listings"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            <ClearFilters />
          </Link>
        </div>
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: ListingType }) {
  switch (type) {
    case 'job_offer':
      return <Briefcase className="h-4 w-4 text-primary" />;
    case 'job_seeking':
      return <Search className="h-4 w-4 text-primary" />;
    case 'service':
      return <Wrench className="h-4 w-4 text-primary" />;
    default:
      return <Briefcase className="h-4 w-4 text-primary" />;
  }
}

// Translation wrapper components
import { getTranslations } from 'next-intl/server';

async function ListingsTitle() {
  const t = await getTranslations('common');
  return <>{t('listings')}</>;
}
async function ListingsNewCTA() {
  const t = await getTranslations('listings');
  return <>{t('new_listing')}</>;
}
async function AllFilter() {
  const t = await getTranslations('common');
  return <>{t('catalog')}</>;
}
async function TypeFilterLabel({ type }: { type: ListingType }) {
  const t = await getTranslations('listings');
  return <>{t(type)}</>;
}
async function ListingTypeLabel({ type }: { type: ListingType }) {
  const t = await getTranslations('listings');
  return <>{t(type)}</>;
}
async function EmptyState() {
  const t = await getTranslations('common');
  return <>{t('no_results')}</>;
}
async function ClearFilters() {
  const t = await getTranslations('common');
  return <>{t('back')}</>;
}
