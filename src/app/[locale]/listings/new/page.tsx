'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import type { ListingType } from '@/lib/types';

export default function NewListingPage() {
  const t = useTranslations('listings');
  const ct = useTranslations('common');
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [type, setType] = useState<ListingType>('job_offer');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create a listing.');
      setSubmitting(false);
      return;
    }

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        title_en: titleEn || null,
        description,
        description_en: descriptionEn || null,
        type,
        category,
        location: location || null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create listing.');
      setSubmitting(false);
      return;
    }

    router.push('/listings');
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t('new_listing')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('title')} <span className="text-muted-foreground">({ct('required')})</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Title EN */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('title_en')} <span className="text-muted-foreground">({ct('optional')})</span>
          </label>
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('description')} <span className="text-muted-foreground">({ct('required')})</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-y"
          />
        </div>

        {/* Description EN */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('description_en')} <span className="text-muted-foreground">({ct('optional')})</span>
          </label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-y"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('type')} <span className="text-muted-foreground">({ct('required')})</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ListingType)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          >
            <option value="job_offer">{t('job_offer')}</option>
            <option value="job_seeking">{t('job_seeking')}</option>
            <option value="service">{t('service')}</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('category')} <span className="text-muted-foreground">({ct('required')})</span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('location')} <span className="text-muted-foreground">({ct('optional')})</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          />
        </div>

        {/* Salary range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('salary_min')} <span className="text-muted-foreground">({ct('optional')})</span>
            </label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              min="0"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('salary_max')} <span className="text-muted-foreground">({ct('optional')})</span>
            </label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              min="0"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? ct('loading') : ct('submit')}
        </button>
      </form>
    </div>
  );
}
