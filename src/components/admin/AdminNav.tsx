'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  User,
} from 'lucide-react';
import { logoutAdminAction } from '@/app/(admin)/admin/actions';

export const ADMIN_PRIMARY_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Servis', icon: Wrench },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
];

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi Utama Admin" className="hidden items-center gap-1.5 md:flex">
      {ADMIN_PRIMARY_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-xs font-bold transition-all tap-bounce ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-black/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminHeaderMenu({ session }: { session?: { name?: string; email?: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Buka menu opsi admin"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.06] bg-white p-2.5 text-slate-800 shadow-sm transition-all tap-bounce hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-[#2C2C2E] ${
          isOpen ? 'ring-2 ring-slate-900 dark:ring-white' : ''
        }`}
      >
        {isOpen ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Menu className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu Opsi Admin"
          className="ios-glass-card absolute right-0 top-13 z-50 w-64 space-y-2 rounded-2xl p-2.5 shadow-2xl animate-sheet-in"
        >
          {session && (
            <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.04] bg-black/[0.02] p-2.5 dark:border-white/[0.06] dark:bg-white/[0.04]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {session.name || 'Admin'}
                </p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {session.email || 'Staf Internal'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/admin/reports"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>Rekap Laporan</span>
            </Link>

            <Link
              href="/"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span>Lihat Portal Publik</span>
            </Link>
          </div>

          <div className="border-t border-black/[0.06] pt-1.5 dark:border-white/[0.08]">
            <form action={logoutAdminAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 tap-bounce dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Keluar Akun Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminMobileNav({ session }: { session?: { name?: string; email?: string } | null }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Navigasi Mobile Admin"
        className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-white/80 px-3 py-1.5 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/85 md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5">
          {ADMIN_PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-all tap-bounce ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Buka Menu Laporan & Keluar"
            aria-expanded={isMenuOpen}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-all tap-bounce ${
              isMenuOpen || pathname.startsWith('/admin/reports')
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Menu className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Menu on Mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-md md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="ios-glass-card w-full max-w-lg overflow-hidden rounded-t-[32px] p-5 shadow-2xl animate-sheet-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20" aria-hidden="true" />

            <div className="flex items-center justify-between pb-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Menu Admin
              </h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Tutup menu"
                className="ios-glass-inner flex h-9 w-9 items-center justify-center rounded-full text-slate-700 dark:text-zinc-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {session && (
              <div className="mt-2 flex items-center gap-2.5 rounded-2xl border border-black/[0.04] bg-black/[0.02] p-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-black">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {session.name || 'Admin'}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {session.email || 'Staf Internal'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-1">
              <Link
                href="/admin/reports"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[46px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Rekap Laporan</span>
              </Link>

              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[46px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span>Lihat Portal Publik</span>
              </Link>
            </div>

            <div className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white shadow-md tap-bounce dark:bg-red-500"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar Akun Admin</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
