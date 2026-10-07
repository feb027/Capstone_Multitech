import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { logoutAdminAction } from './actions';
import { LayoutDashboard, Users, Cpu, LogOut } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-[#070b12] dark:text-slate-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="rounded-lg bg-navy px-2 py-1 text-xs font-black text-white dark:bg-crimson">
                ADMIN
              </span>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                MULTI<span className="text-crimson">TECH</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/admin/customers"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Users className="h-3.5 w-3.5" />
                Pelanggan & Kendaraan
              </Link>
              <Link
                href="/admin/modules"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Cpu className="h-3.5 w-3.5" />
                Jenis Modul
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {session && (
              <div className="flex items-center gap-3">
                <span className="hidden text-xs font-medium text-slate-600 dark:text-slate-400 sm:inline">
                  {session.name}
                </span>
                <form action={logoutAdminAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Keluar"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 sm:pb-12">{children}</main>

      {/* Mobile Bottom Navigation Bar (Apple Tab Bar for Thumb ergonomis) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link
            href="/admin/dashboard"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-white"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/customers"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-white"
          >
            <Users className="h-5 w-5" />
            <span>Pelanggan</span>
          </Link>
          <Link
            href="/admin/modules"
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-white"
          >
            <Cpu className="h-5 w-5" />
            <span>Modul</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
