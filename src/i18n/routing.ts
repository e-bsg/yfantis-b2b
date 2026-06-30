import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

// Add new locales here as we expand
export const locales = ['en', 'el', 'it', 'zh', 'bg', 'tr'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales: ['en', 'el', 'it', 'zh', 'bg', 'tr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // en → /, el → /el, zh → /zh
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
