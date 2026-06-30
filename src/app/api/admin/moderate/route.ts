import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    // Admin check: either role from auth metadata or profile flag
    const isAdmin =
      user.app_metadata?.role === 'admin' || profile?.subscription_tier === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { action, targetType, targetId, reason } = body;

    if (!action || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, targetType, targetId' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'block', 'unblock'];
    const validTargetTypes = ['profile', 'listing'];

    if (!validActions.includes(action as string)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!validTargetTypes.includes(targetType as string)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    const targetIdStr = String(targetId);
    const reasonStr = reason ? String(reason) : null;

    if (targetType === 'profile') {
      if (action === 'approve') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_moderated: true, is_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (action === 'reject') {
        // For reject, we keep is_moderated=false (or could set a rejected flag)
        // We mark is_blocked=false since it's not blocked, just not approved
        const { error } = await supabase
          .from('profiles')
          .update({ is_moderated: false, is_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (action === 'block') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: true, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (action === 'unblock') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      // Log moderation action
      await supabase.from('moderation_logs').insert({
        moderator_id: user.id,
        target_profile_id: targetIdStr,
        target_listing_id: null,
        action: String(action),
        reason: reasonStr,
        created_at: new Date().toISOString(),
      });
    }

    if (targetType === 'listing') {
      if (action === 'approve') {
        const { error } = await supabase
          .from('listings')
          .update({ is_moderated: true, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('listings')
          .update({ is_moderated: false, updated_at: new Date().toISOString() })
          .eq('id', targetIdStr);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (action === 'block') {
        // Block the profile associated with this listing
        const { data: listing } = await supabase
          .from('listings')
          .select('profile_id')
          .eq('id', targetIdStr)
          .single();

        if (listing) {
          await supabase
            .from('profiles')
            .update({ is_blocked: true, updated_at: new Date().toISOString() })
            .eq('id', listing.profile_id);
        }
      } else if (action === 'unblock') {
        const { data: listing } = await supabase
          .from('listings')
          .select('profile_id')
          .eq('id', targetIdStr)
          .single();

        if (listing) {
          await supabase
            .from('profiles')
            .update({ is_blocked: false, updated_at: new Date().toISOString() })
            .eq('id', listing.profile_id);
        }
      }

      // Log moderation action
      const { data: targetListing } = await supabase
        .from('listings')
        .select('profile_id')
        .eq('id', targetIdStr)
        .single();

      await supabase.from('moderation_logs').insert({
        moderator_id: user.id,
        target_profile_id: targetListing?.profile_id || null,
        target_listing_id: targetIdStr,
        action: String(action),
        reason: reasonStr,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
