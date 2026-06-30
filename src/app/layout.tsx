import type { Metadata } from 'next';
import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Yfantis — Global Industrial B2B Directory',
  description:
    'International B2B directory for industrial enterprises — Factories, Manufacturers, Logistics & Industrial Services. Connect with verified industrial partners worldwide.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors closeButton />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
