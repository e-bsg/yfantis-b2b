import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createServerSupabase } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { Mail, MessageSquare } from 'lucide-react';

export default async function MessagesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          <MessagesInboxTitle />
        </h1>
        <div className="text-center py-16">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">
            <LoginPrompt />
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            <LoginLink />
          </Link>
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*, from_profile:profiles!messages_from_profile_id_fkey(*)')
    .eq('to_profile_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        <MessagesInboxTitle />
      </h1>

      {messages && messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map((message) => (
            <Link
              key={message.id}
              href={`/messages/${message.id}`}
              className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="mt-0.5">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold truncate">
                    {message.subject || <NoSubject />}
                  </h2>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(message.created_at, 'en')}
                  </span>
                </div>
                {message.from_profile && (
                  <p className="text-sm text-muted-foreground">
                    {message.from_profile.company_name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {message.body}
                </p>
              </div>
              {!message.is_read && (
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">
            <NoMessages />
          </p>
        </div>
      )}
    </div>
  );
}

// Translation wrapper components
import { getTranslations } from 'next-intl/server';

async function MessagesInboxTitle() {
  const t = await getTranslations('messages');
  return <>{t('inbox')}</>;
}
async function NoMessages() {
  const t = await getTranslations('messages');
  return <>{t('no_messages')}</>;
}
async function NoSubject() {
  const t = await getTranslations('messages');
  return <span className="text-muted-foreground">({t('subject')})</span>;
}
async function LoginPrompt() {
  const t = await getTranslations('auth');
  return <>{t('login_title')}</>;
}
async function LoginLink() {
  const t = await getTranslations('common');
  return <>{t('login')}</>;
}
