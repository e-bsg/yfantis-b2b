'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, X, Image as ImageIcon, ChevronDown } from 'lucide-react';
import type { ListingType } from '@/lib/types';

const LOCALE_OPTIONS = [
  { code: 'el', label: 'Greek' },
  { code: 'it', label: 'Italian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'tr', label: 'Turkish' },
] as const;

interface TranslationFields {
  code: string;
  title: string;
  description: string;
}

export default function NewListingPage() {
  const t = useTranslations('listings');
  const ct = useTranslations('common');
  const router = useRouter();
  const supabase = createClient();

  // English (mandatory) fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType>('job_offer');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  // Translation slots
  const [translations, setTranslations] = useState<TranslationFields[]>([]);
  const [addTranslationOpen, setAddTranslationOpen] = useState(false);

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const availableLocales = LOCALE_OPTIONS.filter(
    (loc) => !translations.some((tr) => tr.code === loc.code)
  );

  function addTranslation(code: string) {
    setTranslations((prev) => [...prev, { code, title: '', description: '' }]);
    setAddTranslationOpen(false);
  }

  function removeTranslation(code: string) {
    setTranslations((prev) => prev.filter((tr) => tr.code !== code));
  }

  function updateTranslation(
    code: string,
    field: 'title' | 'description',
    value: string
  ) {
    setTranslations((prev) =>
      prev.map((tr) => (tr.code === code ? { ...tr, [field]: value } : tr))
    );
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages(userId: string): Promise<string[]> {
    if (imageFiles.length === 0) return [];

    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/listing-${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);
      urls.push(urlData.publicUrl);
    }

    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('You must be logged in to create a listing.');
      setSubmitting(false);
      return;
    }

    let imageUrls: string[] = [];

    if (imageFiles.length > 0) {
      setUploadingImages(true);
      try {
        imageUrls = await uploadImages(user.id);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to upload images.'
        );
        setSubmitting(false);
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    // Build localized fields payload
    const localizedPayload: Record<string, string | null> = {};
    for (const tr of translations) {
      localizedPayload[`title_${tr.code}`] = tr.title || null;
      localizedPayload[`description_${tr.code}`] = tr.description || null;
    }

    const body = {
      title,
      description,
      type,
      category,
      location: location || null,
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
      image_urls: imageUrls,
      ...localizedPayload,
    };

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to create listing.');
      setSubmitting(false);
      return;
    }

    toast.success(ct('save'));
    router.push('/listings');
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        {t('new_listing')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title (English — mandatory) */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('title')}{' '}
            <span className="text-muted-foreground text-xs">
              (English &mdash; {ct('required')})
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Senior Welder for factory in Athens"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description (English — mandatory) */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('description')}{' '}
            <span className="text-muted-foreground text-xs">
              (English &mdash; {ct('required')})
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the listing in English…"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Translation slots */}
        {translations.map((tr) => (
          <div
            key={tr.code}
            className="rounded-lg border border-dashed p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {LOCALE_OPTIONS.find((l) => l.code === tr.code)?.label}{' '}
                {t('translation') || 'translation'}
              </span>
              <button
                type="button"
                onClick={() => removeTranslation(tr.code)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={tr.title}
              onChange={(e) =>
                updateTranslation(tr.code, 'title', e.target.value)
              }
              placeholder={t('title') + ' (' + tr.code.toUpperCase() + ')'}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={tr.description}
              onChange={(e) =>
                updateTranslation(tr.code, 'description', e.target.value)
              }
              rows={3}
              placeholder={t('description') + ' (' + tr.code.toUpperCase() + ')'}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}

        {/* Add translation dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAddTranslationOpen(!addTranslationOpen)}
            disabled={availableLocales.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('add_translation') || 'Add translation'}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {addTranslationOpen && availableLocales.length > 0 && (
            <div className="absolute top-full mt-1 z-10 rounded-md border bg-popover shadow-md min-w-[200px]">
              {availableLocales.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => addTranslation(loc.code)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('type')}{' '}
            <span className="text-muted-foreground text-xs">
              ({ct('required')})
            </span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ListingType)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="job_offer">{t('job_offer')}</option>
            <option value="job_seeking">{t('job_seeking')}</option>
            <option value="service">{t('service')}</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('category')}{' '}
            <span className="text-muted-foreground text-xs">
              ({ct('required')})
            </span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="e.g. Welding, Logistics, Software"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('location')}{' '}
            <span className="text-muted-foreground text-xs">
              ({ct('optional')})
            </span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Athens, Greece"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Salary range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('salary_min')}{' '}
              <span className="text-muted-foreground text-xs">
                ({ct('optional')})
              </span>
            </label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              min="0"
              placeholder="€"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('salary_max')}{' '}
              <span className="text-muted-foreground text-xs">
                ({ct('optional')})
              </span>
            </label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              min="0"
              placeholder="€"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            <ImageIcon className="inline h-4 w-4 mr-1" />
            {t('images') || 'Images'}{' '}
            <span className="text-muted-foreground text-xs">
              ({ct('optional')})
            </span>
          </label>

          {/* Previews */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={`Preview ${i + 1}`}
                    className="h-24 w-24 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {uploadingImages
            ? t('uploading_images') || 'Uploading images…'
            : submitting
              ? ct('loading')
              : ct('submit')}
        </button>
      </form>
    </div>
  );
}
