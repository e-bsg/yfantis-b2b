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
    .select('*, profiles(*), listing_images(*)')
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
    // Search across English and all localized columns
    const locales = ['el', 'it', 'zh', 'bg', 'tr'];
    const titleOrClauses = [
      `title.ilike.%${search}%`,
      ...locales.map((l) => `title_${l}.ilike.%${search}%`),
    ];
    const descOrClauses = [
      `description.ilike.%${search}%`,
      ...locales.map((l) => `description_${l}.ilike.%${search}%`),
    ];
    const allOrClauses = [...titleOrClauses, ...descOrClauses];
    query = query.or(allOrClauses.join(','));
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

  const {
    title,
    description,
    type,
    category,
    location,
    salary_min,
    salary_max,
    image_urls,
    // Localized fields
    title_el,
    title_it,
    title_zh,
    title_bg,
    title_tr,
    description_el,
    description_it,
    description_zh,
    description_bg,
    description_tr,
  } = body;

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

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      profile_id: profile.id,
      title,
      description,
      type,
      category,
      location: location || null,
      salary_min: salary_min != null ? Number(salary_min) : null,
      salary_max: salary_max != null ? Number(salary_max) : null,
      title_el: title_el || null,
      title_it: title_it || null,
      title_zh: title_zh || null,
      title_bg: title_bg || null,
      title_tr: title_tr || null,
      description_el: description_el || null,
      description_it: description_it || null,
      description_zh: description_zh || null,
      description_bg: description_bg || null,
      description_tr: description_tr || null,
      is_moderated: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert listing_images if image_urls provided
  const urls = Array.isArray(image_urls) ? (image_urls as string[]) : [];
  if (urls.length > 0) {
    const images = urls.map((url, i) => ({
      listing_id: listing.id,
      url,
      alt: `${title} — image ${i + 1}`,
      sort_order: i,
    }));

    const { error: imgError } = await supabase
      .from('listing_images')
      .insert(images);

    if (imgError) {
      // Listing was created; return partial success
      return NextResponse.json(
        {
          data: listing,
          warning: 'Listing created but image records failed: ' + imgError.message,
        },
        { status: 201 }
      );
    }
  }

  return NextResponse.json({ data: listing }, { status: 201 });
}
