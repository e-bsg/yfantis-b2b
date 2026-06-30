import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { ProfileCategory } from '@/lib/types';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_name,
      category,
      email,
      afm,
      phone,
      description,
      description_en,
      website,
      country,
      city,
      logo_url,
      countries_served,
      vehicle_types,
      has_refrigerated,
      has_adr,
    } = body;

    if (!company_name || !category || !email || !afm || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validCategories: ProfileCategory[] = [
      'factory',
      'business',
      'transport',
      'personnel',
    ];
    if (!validCategories.includes(category as ProfileCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          company_name,
          category: category as ProfileCategory,
          email,
          afm,
          phone,
          description: description || '',
          description_en: description_en || null,
          website: website || null,
          country: country || '',
          city: city || '',
          logo_url: logo_url || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (category === 'transport') {
      const transportData = {
        profile_id: user.id,
        countries_served: countries_served || [],
        vehicle_types: vehicle_types || [],
        has_refrigerated: has_refrigerated || false,
        has_adr: has_adr || false,
      };

      await supabase.from('transport_details').upsert(transportData, {
        onConflict: 'profile_id',
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
