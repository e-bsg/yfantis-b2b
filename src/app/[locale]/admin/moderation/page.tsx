import { createServerSupabase } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Shield, CheckCircle, XCircle, Ban, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Profile, Listing } from '@/lib/types';

export default async function ModerationPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Unauthorized />;
  }

  const { data: userData } = await supabase.auth.getUser();
  const isAdmin = userData.user?.app_metadata?.role === 'admin';

  if (!isAdmin) {
    return <Unauthorized />;
  }

  // Fetch pending profiles
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_moderated', false)
    .order('created_at', { ascending: false });

  // Fetch pending listings
  const { data: pendingListings } = await supabase
    .from('listings')
    .select('*, profile:profiles(*)')
    .eq('is_moderated', false)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <BackLink />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          <ModerationTitle />
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex gap-4 border-b pb-2">
          <a href="#profiles" className="text-sm font-medium text-primary border-b-2 border-primary pb-2 -mb-[2px]">
            <PendingProfilesTab />
            {(pendingProfiles?.length ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {pendingProfiles?.length ?? 0}
              </span>
            )}
          </a>
          <a href="#listings" className="text-sm font-medium text-muted-foreground hover:text-foreground pb-2">
            <PendingListingsTab />
            {(pendingListings?.length ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {pendingListings?.length ?? 0}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* Pending Profiles Section */}
      <section id="profiles" className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          <PendingProfilesTitle />
        </h2>
        {pendingProfiles && pendingProfiles.length > 0 ? (
          <div className="space-y-3">
            {pendingProfiles.map((profile: Profile) => (
              <div
                key={profile.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{profile.company_name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {profile.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.email}
                      {profile.phone && ` | ${profile.phone}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.country}, {profile.city}
                    </p>
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(profile.created_at, 'en')}
                    </p>
                    {profile.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {profile.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ModerationButtons
                      targetType="profile"
                      targetId={profile.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              <NoPendingProfiles />
            </p>
          </div>
        )}
      </section>

      {/* Pending Listings Section */}
      <section id="listings">
        <h2 className="text-xl font-semibold mb-4">
          <PendingListingsTitle />
        </h2>
        {pendingListings && pendingListings.length > 0 ? (
          <div className="space-y-3">
            {pendingListings.map((listing: Listing & { profile?: Profile }) => (
              <div
                key={listing.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {listing.type}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {listing.category}
                      </span>
                    </div>
                    {listing.profile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {listing.profile.company_name}
                      </p>
                    )}
                    {listing.location && (
                      <p className="text-sm text-muted-foreground">
                        {listing.location}
                      </p>
                    )}
                    {listing.salary_min != null && listing.salary_max != null && (
                      <p className="text-sm text-muted-foreground">
                        €{listing.salary_min} - €{listing.salary_max}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(listing.created_at, 'en')}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ModerationButtons
                      targetType="listing"
                      targetId={listing.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              <NoPendingListings />
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ModerationButtons({
  targetType,
  targetId,
}: {
  targetType: 'profile' | 'listing';
  targetId: string;
}) {
  return (
    <form
      action="/api/admin/moderate"
      method="POST"
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />

      <button
        type="submit"
        name="action"
        value="approve"
        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Approve
      </button>

      <button
        type="submit"
        name="action"
        value="reject"
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </button>

      {targetType === 'profile' && (
        <button
          type="submit"
          name="action"
          value="block"
          className="inline-flex items-center gap-1 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Ban className="h-3.5 w-3.5" />
          Block
        </button>
      )}
    </form>
  );
}

function Unauthorized() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <Shield className="mx-auto h-16 w-16 text-muted-foreground/30" />
      <h1 className="mt-4 text-2xl font-bold">
        <UnauthorizedTitle />
      </h1>
      <p className="mt-2 text-muted-foreground">
        <UnauthorizedDesc />
      </p>
    </div>
  );
}

// Translation wrapper components
async function ModerationTitle() {
  const t = await getTranslations('moderation');
  return <>{t('pending_profiles')} &amp; {t('pending_listings')}</>;
}
async function BackLink() {
  const t = await getTranslations('common');
  return <>{t('back')}</>;
}
async function PendingProfilesTab() {
  const t = await getTranslations('moderation');
  return <>{t('pending_profiles')}</>;
}
async function PendingListingsTab() {
  const t = await getTranslations('moderation');
  return <>{t('pending_listings')}</>;
}
async function PendingProfilesTitle() {
  const t = await getTranslations('moderation');
  return <>{t('pending_profiles')}</>;
}
async function PendingListingsTitle() {
  const t = await getTranslations('moderation');
  return <>{t('pending_listings')}</>;
}
async function NoPendingProfiles() {
  const t = await getTranslations('admin');
  return <>No pending profiles to review.</>;
}
async function NoPendingListings() {
  const t = await getTranslations('admin');
  return <>No pending listings to review.</>;
}
async function UnauthorizedTitle() {
  const t = await getTranslations('admin');
  return <>Unauthorized</>;
}
async function UnauthorizedDesc() {
  const t = await getTranslations('admin');
  return <>You do not have permission to access this page.</>;
}
