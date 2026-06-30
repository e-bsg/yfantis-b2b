import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

const VALID_LOCALES = ['en', 'el', 'it', 'zh', 'bg', 'tr'];
const PROTECTED_ROUTES = ['profile', 'messages', 'admin', 'listings/new'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  const route = segments[1];

  // Redirect unknown locales to default (en)
  if (locale && !VALID_LOCALES.includes(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = '/' + pathname.split('/').slice(2).join('/') || '/';
    return NextResponse.redirect(url);
  }

  // Protected routes
  if (route && PROTECTED_ROUTES.includes(route)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${locale ? `/${locale}` : ''}/login`;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Admin routes
  if (route === 'admin' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale ? `/${locale}` : ''}/login`;
    return NextResponse.redirect(url);
  }

  // Public auth pages when already logged in
  if ((route === 'login' || route === 'register') && user) {
    const url = request.nextUrl.clone();
    url.pathname = `${locale ? `/${locale}` : ''}/catalog`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
