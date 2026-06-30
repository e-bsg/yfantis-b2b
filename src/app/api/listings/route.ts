import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let query = supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('is_moderated', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type && ['job_offer', 'job_seeking', 'service'].includes(type)) {
    query = query.eq('type', type);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,title_en.ilike.%${search}%,description_en.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, title_en, description, description_en, type, category, location, salary_min, salary_max } = body;

  if (!title || !description || !type || !category) {
    return NextResponse.json(
      { error: 'Missing required fields: title, description, type, category' },
      { status: 400 }
    );
  }

  if (!['job_offer', 'job_seeking', 'service'].includes(type as string)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: 'Profile not found. Please complete your profile first.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      profile_id: profile.id,
      title,
      title_en: title_en || null,
      description,
      description_en: description_en || null,
      type,
      category,
      location: location || null,
      salary_min: salary_min != null ? Number(salary_min) : null,
      salary_max: salary_max != null ? Number(salary_max) : null,
      is_moderated: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
