import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import { Briefcase, Search, Wrench, Image, MapPin } from 'lucide-react';
import type { ListingType, Listing, ListingImage } from '@/lib/types';
import { cn } from '@/lib/utils';

type SearchParams = Promise<{ type?: string }>;

const LOCALE_LABELS: Record<string, string> = {
  el: 'Greek',
  it: 'Italian',
  zh: 'Chinese',
  bg: 'Bulgarian',
  tr: 'Turkish',
};

function getLocalizedField(
  listing: Listing,
  field: 'title' | 'description',
  locale: string
): string {
  if (locale === 'en') {
    return listing[field];
  }
  const key = `${field}_${locale}` as keyof Listing;
  const val = listing[key];
  if (val && typeof val === 'string' && val.trim() !== '') {
    return val as string;
  }
  return listing[field];
}

function getListingImageUrl(
  listing: Listing,
  type: ListingType
): { url: string; isUnsplash: boolean } {
  if (listing.listing_images && listing.listing_images.length > 0) {
    const sorted = [...listing.listing_images].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    return { url: sorted[0].url, isUnsplash: false };
  }
  const unsplashMap: Record<string, string> = {
    job_offer:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    job_seeking:
      'https://images.unsplash.com/photo-1521791135924-9a6f9e6c8b0a?w=600&h=400&fit=crop',
    service:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop',
  };
  return { url: unsplashMap[type] || unsplashMap.job_offer, isUnsplash: true };
}

export default async function ListingsPage({
  searchParams,
  params,
}: {
  searchParams: SearchParams;
  params: Promise<{ locale: string }>;
}) {
  const supabase = await createServerSupabase();
  const sp = await searchParams;
  const { locale } = await params;

  let query = supabase
    .from('listings')
    .select('*, profiles(*), listing_images(*)')
    .eq('is_moderated', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (sp.type && ['job_offer', 'job_seeking', 'service'].includes(sp.type)) {
    query = query.eq('type', sp.type);
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
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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
            !sp.type
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
              sp.type === type
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
          {listings.map((listing) => {
            const img = getListingImageUrl(
              listing as Listing,
              listing.type as ListingType
            );
            const localizedTitle = getLocalizedField(
              listing as Listing,
              'title',
              locale
            );
            const localizedDescription = getLocalizedField(
              listing as Listing,
              'description',
              locale
            );

            return (
              <Link
                key={listing.id}
                href={`/profile/${listing.profile_id}`}
                className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                {/* Card Image */}
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={localizedTitle}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {img.isUnsplash && (
                    <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
                      <Image className="inline h-3 w-3 mr-1" />
                      placeholder
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={listing.type as ListingType} />
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      <ListingTypeLabel type={listing.type as ListingType} />
                    </span>
                  </div>

                  <h2 className="font-semibold text-lg leading-snug group-hover:text-primary transition-colors">
                    {localizedTitle}
                  </h2>

                  {listing.profiles && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {listing.profiles.company_name}
                    </p>
                  )}

                  {listing.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{listing.location}</span>
                    </div>
                  )}

                  {(listing.salary_min || listing.salary_max) && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {listing.salary_min &&
                        `€${listing.salary_min.toLocaleString()}`}
                      {listing.salary_min && listing.salary_max && ' — '}
                      {listing.salary_max &&
                        `€${listing.salary_max.toLocaleString()}`}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {localizedDescription}
                  </p>
                </div>
              </Link>
            );
          })}
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
