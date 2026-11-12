import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AdminDesktopNav, AdminMobileNav } from '@/components/admin/AdminNav';
import { logoutAdminAction } from './actions';
import { LogOut, Cpu } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F7] text-slate-900 transition-colors dark:bg-black dark:text-white">
      <header className="no-print sticky top-0 z-40 border-b border-black/[0.06] bg-[#F2F2F7]/85 backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/85">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BrandLogo href="/admin/dashboard" compact />
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white dark:bg-white dark:text-slate-900">
                ADMIN
              </span>
            </div>

            <AdminDesktopNav />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/modules"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.06] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:text-slate-900 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-300 dark:hover:text-white md:hidden"
              aria-label="Kelola Jenis Modul"
            >
              <Cpu className="h-4 w-4" aria-hidden="true" />
            </Link>

            <ThemeToggle />

            {session && (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-semibold text-slate-600 dark:text-slate-400 lg:inline">
                  {session.name}
                </span>
                <form action={logoutAdminAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3.5 text-xs font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-[#2C2C2E]"
                    aria-label="Keluar dari akun admin"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pt-5 pb-24 md:pb-12">
        {children}
      </main>

      <AdminMobileNav />
    </div>
  );
}
