import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getCategoryLabel } from '@/lib/utils';
import { Profile, TransportDetails } from '@/lib/types';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  const supabase = await createServerSupabase();
  const t = await getTranslations('profile');
  const tc = await getTranslations('common');
  const tt = await getTranslations('transport');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single<Profile>();

  if (error || !profile) {
    notFound();
  }

  let transportDetails: TransportDetails | null = null;
  if (profile.category === 'transport') {
    const { data: td } = await supabase
      .from('transport_details')
      .select('*')
      .eq('profile_id', id)
      .single<TransportDetails>();
    transportDetails = td;
  }

  const categoryLabel = getCategoryLabel(profile.category, locale);
  const description =
    locale === 'en' && profile.description_en
      ? profile.description_en
      : profile.description;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/catalog"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        ← {tc('back')}
      </Link>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 p-6 border-b">
          {profile.logo_url ? (
            <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-muted">
              <Image
                src={profile.logo_url}
                alt={profile.company_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl font-bold text-muted-foreground">
              {profile.company_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{profile.company_name}</h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {categoryLabel}
              </span>
              {!profile.is_moderated && (
                <span className="inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {t('pending_moderation')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.email && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {profile.email}
                </a>
              </div>
            )}
            {profile.phone && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('phone')}
                </span>
                <a
                  href={`tel:${profile.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.website && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('website')}
                </span>
                <a
                  href={
                    profile.website.startsWith('http')
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile.afm && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('afm')}
                </span>
                <span className="text-sm">{profile.afm}</span>
              </div>
            )}
            {profile.country && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('country')}
                </span>
                <span className="text-sm">{profile.country}</span>
              </div>
            )}
            {profile.city && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('city')}
                </span>
                <span className="text-sm">{profile.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Transport Details */}
        {transportDetails && (
          <div className="p-6 border-t">
            <h2 className="text-lg font-semibold mb-4">{tt('vehicle_types')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {transportDetails.countries_served &&
                transportDetails.countries_served.length > 0 && (
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {tt('countries_served')}
                    </span>
                    <span className="text-sm">
                      {transportDetails.countries_served.join(', ')}
                    </span>
                  </div>
                )}
              {transportDetails.vehicle_types &&
                transportDetails.vehicle_types.length > 0 && (
                  <div>
                    <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {tt('vehicle_types')}
                    </span>
                    <span className="text-sm">
                      {transportDetails.vehicle_types.join(', ')}
                    </span>
                  </div>
                )}
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {tt('refrigerated')}
                </span>
                <span className="text-sm">
                  {transportDetails.has_refrigerated ? tt('yes') : tt('no')}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {tt('adr')}
                </span>
                <span className="text-sm">
                  {transportDetails.has_adr ? tt('yes') : tt('no')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Button */}
        <div className="p-6 border-t bg-muted/30">
          <Link
            href={`/messages/new?to=${profile.id}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
