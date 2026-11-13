import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AdminDesktopNav, AdminMobileNav, AdminHeaderMenu } from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Saat belum login, halaman tampil bersih tanpa navbar atau apapun
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#ECEEF2] transition-colors dark:bg-black">
      <div className="ios-ambient-backdrop relative mx-auto flex min-h-screen max-w-5xl flex-col transition-colors">
        <header className="no-print sticky top-0 z-40 border-b border-black/[0.06] bg-white/75 backdrop-blur-2xl backdrop-saturate-150 transition-colors dark:border-white/[0.08] dark:bg-black/80">
          <div className="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 tap-bounce"
                aria-label="CV Multitech Dashboard Admin"
              >
                <BrandLogo href="" compact />
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  CV Multitech
                </span>
              </Link>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white dark:bg-white dark:text-slate-900">
                ADMIN
              </span>
            </div>

            <AdminDesktopNav />

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AdminHeaderMenu session={session} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-12">
          {children}
        </main>

        <AdminMobileNav session={session} />
      </div>
    </div>
  );
}
