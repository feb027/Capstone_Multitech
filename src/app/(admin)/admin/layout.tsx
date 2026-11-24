import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getCachedServerDataset } from '@/lib/dataset-store';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminNav';

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

  const dataset = await getCachedServerDataset();

  return (
    <div className="ios-ambient-backdrop flex min-h-screen w-full flex-col transition-colors md:flex-row">
      <AdminSidebar
        session={session}
        initialOrders={dataset.orders}
        initialCustomers={dataset.customers}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl backdrop-saturate-150 transition-colors dark:border-white/[0.08] dark:bg-black/80 md:hidden">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
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

            <ThemeToggle />
          </div>
        </header>

        <main className="w-full min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 md:px-7 md:py-6 lg:px-8 lg:py-7">
          {children}
        </main>

        <AdminMobileNav session={session} />
      </div>
    </div>
  );
}
