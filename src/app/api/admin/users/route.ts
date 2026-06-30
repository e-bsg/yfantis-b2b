import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, status: 401, user: null };
  }

  const isAdmin = user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    return { authorized: false, status: 403, user: null };
  }

  return { authorized: true, status: 200, user };
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { authorized, status, user } = await checkAdmin(supabase);

    if (!authorized) {
      return NextResponse.json(
        { error: status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status }
      );
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: profiles });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { authorized, status } = await checkAdmin(supabase);

    if (!authorized) {
      return NextResponse.json(
        { error: status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { targetId, subscriptionTier } = body;

    if (!targetId || !subscriptionTier) {
      return NextResponse.json(
        { error: 'Missing required fields: targetId, subscriptionTier' },
        { status: 400 }
      );
    }

    const validTiers = ['free', 'basic', 'premium'];
    if (!validTiers.includes(String(subscriptionTier))) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: String(subscriptionTier),
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(targetId))
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
