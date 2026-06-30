import { createServerSupabase } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import type { Message, Profile } from '@/lib/types';

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoginPrompt />;
  }

  // Fetch the main message
  const { data: message, error } = await supabase
    .from('messages')
    .select('*, from_profile:profiles!messages_from_profile_id_fkey(*), to_profile:profiles!messages_to_profile_id_fkey(*)')
    .eq('id', id)
    .single();

  if (error || !message) {
    return <NotFound />;
  }

  // Ensure user is either sender or recipient
  const isParticipant =
    message.from_profile_id === user.id || message.to_profile_id === user.id;

  if (!isParticipant) {
    return <Unauthorized />;
  }

  // Mark as read if recipient
  if (message.to_profile_id === user.id && !message.is_read) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', message.id);
  }

  // Fetch all replies (messages with same subject between same parties)
  const { data: replies } = await supabase
    .from('messages')
    .select('*, from_profile:profiles!messages_from_profile_id_fkey(*), to_profile:profiles!messages_to_profile_id_fkey(*)')
    .eq('subject', message.subject)
    .neq('id', message.id)
    .order('created_at', { ascending: true });

  const allMessages = [message, ...(replies || [])];
  const otherParty =
    message.from_profile_id === user.id
      ? message.to_profile
      : message.from_profile;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <BackToInbox />
        </Link>
        <h1 className="text-2xl font-bold">{message.subject}</h1>
        {otherParty && (
          <p className="text-sm text-muted-foreground mt-1">
            <WithLabel />{' '}
            <Link
              href={`/profile/${otherParty.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {otherParty.company_name}
            </Link>
          </p>
        )}
      </div>

      {/* Messages Thread */}
      <div className="space-y-4 mb-8">
        {allMessages.map((msg: Message & { from_profile?: Profile; to_profile?: Profile }) => {
          const isMine = msg.from_profile_id === user.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.from_profile && (
                    <span className="text-xs font-medium opacity-70">
                      {msg.from_profile.company_name}
                    </span>
                  )}
                  <span className="text-xs opacity-50">
                    {formatDate(msg.created_at, 'en')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Form (client component wrapper) */}
      <ReplyForm
        messageId={message.id}
        recipientId={
          message.from_profile_id === user.id
            ? message.to_profile_id
            : message.from_profile_id
        }
        subject={message.subject}
      />
    </div>
  );
}

// Client component for reply form
import { ReplyFormClient } from './reply-form';

function ReplyForm({
  messageId,
  recipientId,
  subject,
}: {
  messageId: string;
  recipientId: string;
  subject: string;
}) {
  return (
    <div className="border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">
        <ReplyTitle />
      </h2>
      <ReplyFormClient
        messageId={messageId}
        recipientId={recipientId}
        subject={subject}
      />
    </div>
  );
}

function LoginPrompt() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <p className="mt-4 text-lg text-muted-foreground">
        <LoginToView />
      </p>
      <Link
        href="/login"
        className="mt-2 inline-block text-sm text-primary hover:underline"
      >
        <LoginLink />
      </Link>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h1 className="mt-4 text-2xl font-bold">
        <NotFoundTitle />
      </h1>
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
      <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
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
async function BackToInbox() {
  const t = await getTranslations('messages');
  return <>{t('inbox')}</>;
}
async function WithLabel() {
  const t = await getTranslations('messages');
  return <>{t('from')}</>;
}
async function ReplyTitle() {
  const t = await getTranslations('messages');
  return <>{t('reply')}</>;
}
async function LoginToView() {
  const t = await getTranslations('auth');
  return <>Please login to view this message.</>;
}
async function LoginLink() {
  const t = await getTranslations('common');
  return <>{t('login')}</>;
}
async function NotFoundTitle() {
  const t = await getTranslations('messages');
  return <>Message not found.</>;
}
async function UnauthorizedTitle() {
  const t = await getTranslations('common');
  return <>Access Denied</>;
}
async function UnauthorizedDesc() {
  const t = await getTranslations('common');
  return <>You do not have permission to view this conversation.</>;
}
