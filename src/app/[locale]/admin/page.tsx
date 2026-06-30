import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Shield, Users, FileText, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Profile, Listing, DbUser } from '@/lib/types';

export default async function AdminPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Unauthorized />;
  }

  // Check if user is admin via profiles table using service_role client
  const adminSupabase = await createAdminSupabase();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  // Also check auth metadata role
  const { data: userData } = await supabase.auth.getUser();

  const isAdmin =
    (userData.user?.user_metadata?.role === 'admin') ||
    (userData.user?.app_metadata?.role === 'admin');

  if (!isAdmin) {
    return <Unauthorized />;
  }

  // Fetch counts using service_role to bypass RLS
  const [
    { count: pendingProfilesCount },
    { count: pendingListingsCount },
    { count: totalUsersCount },
    { count: totalListingsCount },
  ] = await Promise.all([
    adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_moderated', false)
      .eq('is_blocked', false),
    adminSupabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_moderated', false),
    adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    adminSupabase
      .from('listings')
      .select('*', { count: 'exact', head: true }),
  ]);

  // Fetch recent unmoderated profiles and listings
  const { data: recentProfiles } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('is_moderated', false)
    .eq('is_blocked', false)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentListings } = await adminSupabase
    .from('listings')
    .select('*, profile:profiles(*)')
    .eq('is_moderated', false)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <AdminTitle />
        </h1>
        <Link
          href="/admin/moderation"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Shield className="h-4 w-4" />
          <ModerationLink />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label={<PendingProfiles />}
          value={pendingProfilesCount ?? 0}
          variant="warning"
        />
        <StatsCard
          icon={<FileText className="h-5 w-5" />}
          label={<PendingListings />}
          value={pendingListingsCount ?? 0}
          variant="warning"
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          label={<TotalUsers />}
          value={totalUsersCount ?? 0}
          variant="default"
        />
        <StatsCard
          icon={<FileText className="h-5 w-5" />}
          label={<TotalListings />}
          value={totalListingsCount ?? 0}
          variant="default"
        />
      </div>

      {/* Recent Unmoderated Profiles */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          <RecentProfilesTitle />
        </h2>
        {recentProfiles && recentProfiles.length > 0 ? (
          <div className="space-y-2">
            {recentProfiles.map((p: Profile) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-semibold">{p.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.email} &middot; {p.country}, {p.city}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.created_at, 'en')}
                  </p>
                </div>
                <Link
                  href="/admin/moderation"
                  className="text-sm text-primary hover:underline"
                >
                  <ReviewLink />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <NoPendingProfiles />
          </p>
        )}
      </section>

      {/* Recent Unmoderated Listings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          <RecentListingsTitle />
        </h2>
        {recentListings && recentListings.length > 0 ? (
          <div className="space-y-2">
            {recentListings.map((l: Listing & { profile?: Profile }) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.type} &middot; {l.category}
                    {l.profile && ` &middot; ${l.profile.company_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(l.created_at, 'en')}
                  </p>
                </div>
                <Link
                  href="/admin/moderation"
                  className="text-sm text-primary hover:underline"
                >
                  <ReviewLink />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <NoPendingListings />
          </p>
        )}
      </section>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: number;
  variant: 'default' | 'warning';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4',
        variant === 'warning' && 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          variant === 'warning'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
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
async function AdminTitle() {
  const t = await getTranslations('common');
  return <>{t('admin')}</>;
}
async function ModerationLink() {
  const t = await getTranslations('moderation');
  return <>{t('pending_profiles')}</>;
}
async function PendingProfiles() {
  const t = await getTranslations('moderation');
  return <>{t('pending_profiles')}</>;
}
async function PendingListings() {
  const t = await getTranslations('moderation');
  return <>{t('pending_listings')}</>;
}
async function TotalUsers() {
  const t = await getTranslations('admin');
  return <>Total Users</>;
}
async function TotalListings() {
  const t = await getTranslations('admin');
  return <>Total Listings</>;
}
async function RecentProfilesTitle() {
  const t = await getTranslations('admin');
  return <>Recent Unmoderated Profiles</>;
}
async function RecentListingsTitle() {
  const t = await getTranslations('admin');
  return <>Recent Unmoderated Listings</>;
}
async function NoPendingProfiles() {
  const t = await getTranslations('admin');
  return <>No pending profiles.</>;
}
async function NoPendingListings() {
  const t = await getTranslations('admin');
  return <>No pending listings.</>;
}
async function ReviewLink() {
  const t = await getTranslations('admin');
  return <>Review</>;
}
async function UnauthorizedTitle() {
  const t = await getTranslations('admin');
  return <>Unauthorized</>;
}
async function UnauthorizedDesc() {
  const t = await getTranslations('admin');
  return <>You do not have permission to access this page.</>;
}
