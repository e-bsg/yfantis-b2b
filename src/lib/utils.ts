import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, locale: string = 'el') {
  return new Date(date).toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getCategoryLabel(category: string, locale: string = 'el'): string {
  const labels: Record<string, Record<string, string>> = {
    factory: { el: 'Εργοστάσιο', en: 'Factory' },
    business: { el: 'Επιχείρηση', en: 'Business' },
    transport: { el: 'Μεταφορές', en: 'Transport' },
    personnel: { el: 'Προσωπικό', en: 'Personnel' },
  };
  return labels[category]?.[locale] || category;
}

export function getListingTypeLabel(type: string, locale: string = 'el'): string {
  const labels: Record<string, Record<string, string>> = {
    job_offer: { el: 'Θέση Εργασίας', en: 'Job Offer' },
    job_seeking: { el: 'Αναζήτηση Εργασίας', en: 'Job Seeking' },
    service: { el: 'Υπηρεσία', en: 'Service' },
  };
  return labels[type]?.[locale] || type;
}
