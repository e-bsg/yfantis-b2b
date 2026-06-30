import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder'); // 'inbox' or 'sent'

    if (folder === 'sent') {
      const { data, error } = await supabase
        .from('messages')
        .select('*, to_profile:profiles!messages_to_profile_id_fkey(*)')
        .eq('from_profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Default: inbox
    const { data, error } = await supabase
      .from('messages')
      .select('*, from_profile:profiles!messages_from_profile_id_fkey(*)')
      .eq('to_profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { to_profile_id, subject, body: messageBody } = body;

    if (!to_profile_id || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to_profile_id, subject, body' },
        { status: 400 }
      );
    }

    // Get the sender's profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!senderProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', String(to_profile_id))
      .single();

    if (!recipientProfile) {
      return NextResponse.json(
        { error: 'Recipient profile not found.' },
        { status: 404 }
      );
    }

    // Prevent self-messaging
    if (String(to_profile_id) === user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_profile_id: user.id,
        to_profile_id: String(to_profile_id),
        subject: String(subject),
        body: String(messageBody),
        is_read: false,
        is_from_admin: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
