'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export function ReplyFormClient({
  messageId,
  recipientId,
  subject,
}: {
  messageId: string;
  recipientId: string;
  subject: string;
}) {
  const t = useTranslations('messages');
  const tc = useTranslations('common');
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        from_profile_id: (await supabase.auth.getUser()).data.user?.id,
        to_profile_id: recipientId,
        subject,
        body: body.trim(),
        is_read: false,
        is_from_admin: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setBody('');
      toast.success('Reply sent');
      router.refresh();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply..."
        rows={4}
        required
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
        {sending ? `${tc('loading')}...` : t('send')}
      </button>
    </form>
  );
}
