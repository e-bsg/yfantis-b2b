'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const VALID_LOCALES = ['en', 'el', 'it', 'zh', 'bg', 'tr'];

export function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) && VALID_LOCALES.includes(params.locale as string)
    ? (params.locale as string)
    : 'en';
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const links = [
    { href: '/catalog', label: t('catalog') },
    { href: '/listings', label: t('listings') },
    { href: '/transport', label: t('transport') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span>🔷</span>
          <span>Yfantis B2B</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname.includes(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher currentLocale={locale} currentPath={pathname} />
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/messages" className="text-sm text-muted-foreground hover:text-primary">
                {t('messages')}
              </Link>
              <Link href="/profile/edit" className="text-sm text-muted-foreground hover:text-primary">
                {t('profile')}
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 bg-background relative z-[60]">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr />
            <div className="flex flex-wrap gap-2">
              {[locale, ...activeLocales.filter(l => l !== locale)].map((loc) => (
                loc === locale ? (
                  <span key={loc} className="rounded border px-3 py-1 text-xs bg-primary text-primary-foreground border-primary">
                    {localeFlags[loc]} {localeCodes[loc]}
                  </span>
                ) : (
                  <Link
                    key={loc}
                    href={pathname || '/'}
                    locale={loc}
                    onClick={() => setMobileOpen(false)}
                    className="rounded border px-3 py-1 text-xs hover:bg-accent"
                    title={localeNames[loc]}
                  >
                    {localeFlags[loc]} {localeCodes[loc]}
                  </Link>
                )
              ))}
            </div>
            {user ? (
              <>
                <Link href="/profile/edit" className="text-sm">{t('profile')}</Link>
                <Link href="/messages" className="text-sm">{t('messages')}</Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="text-sm text-left text-destructive"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm">{t('login')}</Link>
                <Link href="/register" className="text-sm font-medium text-primary">{t('register')}</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

const localeFlags: Record<string, string> = {
  en: '🇬🇧', el: '🇬🇷', it: '🇮🇹', zh: '🇨🇳', bg: '🇧🇬', tr: '🇹🇷',
};
const localeNames: Record<string, string> = {
  en: 'English', el: 'Ελληνικά', it: 'Italiano',
  zh: '中文', bg: 'Български', tr: 'Türkçe',
};
const localeCodes: Record<string, string> = {
  en: 'EN', el: 'EL', it: 'IT', zh: 'ZH', bg: 'BG', tr: 'TR',
};
const activeLocales = ['en', 'el', 'it'];

function LocaleSwitcher({ currentLocale, currentPath }: { currentLocale: string; currentPath?: string }) {
  const [open, setOpen] = useState(false);
  const sorted = [currentLocale, ...activeLocales.filter(l => l !== currentLocale)];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        title={localeNames[currentLocale]}
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        <span>{localeCodes[currentLocale]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[170px] rounded-md border bg-background p-1 shadow-lg">
            {sorted.map((loc) =>
              loc === currentLocale ? (
                <span
                  key={loc}
                  className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-primary"
                >
                  <span className="text-xs">✓</span>
                  <span className="text-base">{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                </span>
              ) : (
                <Link
                  key={loc}
                  href={currentPath || '/'}
                  locale={loc}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                  title={localeNames[loc]}
                >
                  <span className="text-xs opacity-0">✓</span>
                  <span className="text-base">{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                </Link>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
