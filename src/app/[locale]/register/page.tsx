'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import type { ProfileCategory } from '@/lib/types';

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState<ProfileCategory>('business');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [afm, setAfm] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('GR');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  const categories: { value: ProfileCategory; label: string }[] = [
    { value: 'factory', label: t('categories.factory') },
    { value: 'business', label: t('categories.business') },
    { value: 'transport', label: t('categories.transport') },
    { value: 'personnel', label: t('categories.personnel') },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'user' },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          category,
          company_name: companyName,
          email,
          phone,
          afm,
          city,
          country,
          description,
          description_en: descriptionEn || null,
          is_moderated: false,
          subscription_tier: 'free',
        });

      if (profileError) throw profileError;

      toast.success('Registration successful! Please check your email to confirm.');
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-8">{t('auth.register_title')}</h1>

      {step === 1 ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')} *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')} *</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.confirm_password')} *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t('common.next')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('categories.select_category')} *</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as ProfileCategory)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.company_name')} *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.phone')} *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+30..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.afm')}</label>
            <input
              type="text"
              value={afm}
              onChange={(e) => setAfm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.country')}</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.description_en')}</label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t('common.back')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.submit')}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.already_have_account')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('auth.login_now')}
        </Link>
      </p>
    </div>
  );
}
