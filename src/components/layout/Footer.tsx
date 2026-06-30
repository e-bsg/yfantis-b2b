import { Link } from '@/i18n/routing';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Yfantis B2B Directory. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/catalog" className="hover:text-primary">Catalog</Link>
          <Link href="/register" className="hover:text-primary">Register</Link>
        </div>
      </div>
    </footer>
  );
}
