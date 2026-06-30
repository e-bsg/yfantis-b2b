import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Building2, Calendar, Tag, Euro } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createServerSupabase();

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(*), listing_images(*)')
    .eq('id', id)
    .eq('is_moderated', true)
    .eq('is_active', true)
    .single();

  if (!listing) notFound();

  const localizedTitle =
    locale !== 'en' && (listing as any)[`title_${locale}`]
      ? (listing as any)[`title_${locale}`]
      : listing.title;
  const localizedDesc =
    locale !== 'en' && (listing as any)[`description_${locale}`]
      ? (listing as any)[`description_${locale}`]
      : listing.description;

  const images = listing.listing_images || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        <ListingBackLabel />
      </Link>

      {/* Images */}
      {images.length > 0 && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={images[0].url}
            alt={images[0].alt || localizedTitle}
            className="w-full h-64 md:h-96 object-cover"
          />
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {images.slice(1).map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt || ''}
                  className="h-20 w-32 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Briefcase className="h-3 w-3" />
            <ListingTypeLabel type={listing.type} />
          </span>
          {listing.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {listing.category}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{localizedTitle}</h1>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
        {listing.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {listing.location}
          </span>
        )}
        {(listing.salary_min || listing.salary_max) && (
          <span className="flex items-center gap-1">
            <Euro className="h-4 w-4" />
            {listing.salary_min ? `€${listing.salary_min.toLocaleString()}` : ''}
            {listing.salary_min && listing.salary_max ? ' – ' : ''}
            {listing.salary_max ? `€${listing.salary_max.toLocaleString()}` : ''}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="prose prose-gray max-w-none mb-10">
        <p className="text-base leading-relaxed whitespace-pre-line">{localizedDesc}</p>
      </div>

      {/* Company Card */}
      {listing.profiles && (
        <div className="rounded-xl border bg-card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
              {listing.profiles.logo_url ? (
                <img src={listing.profiles.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{listing.profiles.company_name}</h2>
              <p className="text-sm text-muted-foreground">
                {listing.profiles.city && `${listing.profiles.city}, `}{listing.profiles.country}
              </p>
            </div>
            <Link
              href={`/profile/${listing.profiles.id}`}
              className="ml-auto text-sm text-primary hover:underline"
            >
              <ViewProfileLabel />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

async function ListingBackLabel() {
  const t = await getTranslations('listings');
  return <>{t('title')}</>;
}

function ListingTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    job_offer: 'Job Offer',
    job_seeking: 'Job Seeking',
    service: 'Service',
  };
  return <>{labels[type] || type}</>;
}

async function ViewProfileLabel() {
  const t = await getTranslations('catalog');
  return <>{t('view_profile')}</>;
}
