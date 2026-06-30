'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Profile, ProfileCategory, TransportDetails } from '@/lib/types';

const CATEGORIES: ProfileCategory[] = ['factory', 'business', 'transport', 'personnel'];

export default function EditProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tt = useTranslations('transport');
  const tcat = useTranslations('categories');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transport, setTransport] = useState<TransportDetails | null>(null);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<ProfileCategory>('business');
  const [email, setEmail] = useState('');
  const [afm, setAfm] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Transport fields
  const [countriesServed, setCountriesServed] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState('');
  const [hasRefrigerated, setHasRefrigerated] = useState(false);
  const [hasAdr, setHasAdr] = useState(false);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data as Profile);
      setCompanyName(data.company_name || '');
      setCategory(data.category || 'business');
      setEmail(data.email || '');
      setAfm(data.afm || '');
      setPhone(data.phone || '');
      setDescription(data.description || '');
      setDescriptionEn(data.description_en || '');
      setWebsite(data.website || '');
      setCountry(data.country || '');
      setCity(data.city || '');
      if (data.logo_url) setLogoPreview(data.logo_url);
    }

    // Fetch transport details if category is transport
    if (data?.category === 'transport') {
      const { data: td } = await supabase
        .from('transport_details')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (td) {
        setTransport(td as TransportDetails);
        setCountriesServed((td.countries_served || []).join(', '));
        setVehicleTypes((td.vehicle_types || []).join(', '));
        setHasRefrigerated(td.has_refrigerated || false);
        setHasAdr(td.has_adr || false);
      }
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let logoUrl = profile?.logo_url || null;

    // Upload logo if a new file was selected
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        toast.error(uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      logoUrl = urlData.publicUrl;
    }

    const upsertData = {
      id: user.id,
      company_name: companyName,
      category,
      email,
      afm,
      phone,
      description,
      description_en: descriptionEn || null,
      website: website || null,
      country,
      city,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(upsertData);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // Save transport details if category is transport
    if (category === 'transport') {
      const transportData = {
        profile_id: user.id,
        countries_served: countriesServed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        vehicle_types: vehicleTypes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        has_refrigerated: hasRefrigerated,
        has_adr: hasAdr,
      };

      const { error: transportError } = await supabase
        .from('transport_details')
        .upsert(transportData);

      if (transportError) {
        toast.error(transportError.message);
      }
    }

    toast.success(tc('save'));
    setSaving(false);

    // If this was a new profile, update state
    if (!profile) {
      setProfile({
        ...upsertData,
        phone_verified: false,
        is_moderated: false,
        is_blocked: false,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
      } as Profile);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">{tc('loading')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('edit_profile')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('logo')}</label>
          {logoPreview && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-20 w-20 rounded-lg border object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('company_name')} <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {tcat('select_category')} <span className="text-destructive">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProfileCategory)}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {tcat(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* AFM */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('afm')}</label>
          <input
            type="text"
            value={afm}
            onChange={(e) => setAfm(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('phone')}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description English */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('description_en')}</label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('website')}</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('country')}</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('city')}</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Transport Details (conditional) */}
        {category === 'transport' && (
          <div className="space-y-4 rounded-lg border p-4">
            <h2 className="text-lg font-semibold">{tcat('transport')}</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                {tt('countries_served')}
              </label>
              <input
                type="text"
                value={countriesServed}
                onChange={(e) => setCountriesServed(e.target.value)}
                placeholder="Greece, Bulgaria, Romania"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">{tc('optional')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {tt('vehicle_types')}
              </label>
              <input
                type="text"
                value={vehicleTypes}
                onChange={(e) => setVehicleTypes(e.target.value)}
                placeholder="Truck, Van, Refrigerated"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">{tc('optional')}</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_refrigerated"
                checked={hasRefrigerated}
                onChange={(e) => setHasRefrigerated(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="has_refrigerated" className="text-sm font-medium">
                {tt('refrigerated')}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_adr"
                checked={hasAdr}
                onChange={(e) => setHasAdr(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="has_adr" className="text-sm font-medium">
                {tt('adr')}
              </label>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? tc('loading') : tc('save')}
        </button>
      </form>
    </div>
  );
}
