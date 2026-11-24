'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ItemStatus } from '@prisma/client';
import {
  LayoutDashboard,
  Wrench,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { logoutAdminAction } from '@/app/(admin)/admin/actions';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { MockCustomerRow, MockServiceOrder } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';

export const ADMIN_PRIMARY_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Servis', icon: Wrench },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/reports', label: 'Rekap Laporan', icon: BarChart3 },
];

const ADMIN_MOBILE_TABS = ADMIN_PRIMARY_NAV.slice(0, 3);
const SIDEBAR_STORAGE_KEY = 'mt_admin_sidebar_collapsed';

export function AdminSidebar({
  session,
  initialOrders,
  initialCustomers,
}: {
  session?: { name?: string; email?: string } | null;
  initialOrders?: MockServiceOrder[];
  initialCustomers?: MockCustomerRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const { orders, customers } = useDataset(initialOrders, initialCustomers);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === 'true') setIsCollapsed(true);
    } catch {
      // Ignore storage read errors in restricted browsers
    }
  }, []);

  useEffect(() => {
    for (const item of ADMIN_PRIMARY_NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage write errors in restricted browsers
      }
      return next;
    });
  };

  const activeQueueCount = orders.filter((order) =>
    order.items.some(
      (item) => item.status !== ItemStatus.SELESAI && item.status !== ItemStatus.BATAL
    )
  ).length;

  const getBadgeForRoute = (
    href: string
  ): { text: string; ariaSuffix?: string } | null => {
    if (href === '/admin/services') {
      return {
        text: String(activeQueueCount),
        ariaSuffix: `${activeQueueCount} antrean aktif`,
      };
    }
    if (href === '/admin/customers') {
      return {
        text: String(customers.length),
        ariaSuffix: `${customers.length} pelanggan`,
      };
    }
    return null;
  };

  const renderNavLink = (item: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }) => {
    const Icon = item.icon;
    const isActive = (pendingHref ?? pathname).startsWith(item.href);
    const badge = getBadgeForRoute(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        onClick={() => {
          if (pathname !== item.href) setPendingHref(item.href);
        }}
        title={
          isCollapsed
            ? badge?.ariaSuffix
              ? `${item.label} (${badge.ariaSuffix})`
              : item.label
            : undefined
        }
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex min-h-[44px] items-center rounded-2xl text-xs font-bold transition-colors transition-transform tap-bounce ${
          isCollapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-3.5'
        } ${
          isActive
            ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
            : 'text-slate-700 hover:bg-black/[0.05] hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-white'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </span>

        {!isCollapsed && badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
              isActive
                ? 'bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900'
                : 'bg-slate-900/[0.07] text-slate-700 dark:bg-white/[0.1] dark:text-slate-200'
            }`}
          >
            {badge.text}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      aria-label="Sidebar Navigasi Admin"
      className={`no-print hidden md:sticky md:top-0 md:z-30 md:flex md:h-screen md:shrink-0 md:flex-col border-r border-black/[0.07] bg-white transition-[width] duration-200 dark:border-white/[0.09] dark:bg-[#141416] ${
        isCollapsed ? 'md:w-[80px]' : 'md:w-[272px]'
      }`}
    >
      {/* Top Brand Header + Collapse Control */}
      <div
        className={`flex shrink-0 border-b border-black/[0.06] dark:border-white/[0.08] ${
          isCollapsed
            ? 'flex-col items-center gap-2 px-3 py-3.5'
            : 'h-[72px] items-center justify-between gap-2 px-4'
        }`}
      >
        <Link
          href="/admin/dashboard"
          prefetch={true}
          className="flex min-w-0 items-center gap-2.5 rounded-xl py-1 tap-bounce"
          aria-label="CV Multitech Dashboard Admin"
        >
          <BrandLogo href="" compact />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                CV Multitech
              </p>
              <span className="mt-1 inline-flex rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white dark:bg-white dark:text-slate-900">
                ADMIN
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Perluas sidebar navigasi' : 'Perkecil sidebar navigasi'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 tap-bounce dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.1]"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav
        aria-label="Navigasi Utama Admin"
        className={`flex-1 overflow-y-auto py-4 no-scrollbar ${
          isCollapsed ? 'px-3' : 'px-3.5'
        }`}
      >
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Navigasi
            </p>
          )}
          {ADMIN_PRIMARY_NAV.map(renderNavLink)}
        </div>
      </nav>

      {/* Bottom Utility Dock: Profile, Theme Toggle & Logout */}
      <div
        className={`shrink-0 space-y-2 border-t border-black/[0.06] py-3.5 dark:border-white/[0.08] ${
          isCollapsed ? 'px-3' : 'px-3.5'
        }`}
      >
        {isCollapsed ? (
          <div className="flex justify-center">
            <ThemeToggle className="shrink-0 border border-black/[0.07] bg-slate-50 shadow-none hover:bg-slate-100 dark:border-white/[0.1] dark:bg-white/[0.06] dark:hover:bg-white/[0.12]" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-black/[0.06] bg-slate-50/90 p-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {session?.name || 'Admin'}
                </p>
                <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                  {session?.email || 'Staf Internal'}
                </p>
              </div>
            </div>
            <ThemeToggle className="shrink-0 !border-black/[0.08] !bg-white shadow-none hover:!bg-slate-100 dark:!border-white/[0.12] dark:!bg-white/[0.08] dark:hover:!bg-white/[0.14]" />
          </div>
        )}

        <form action={logoutAdminAction}>
          <button
            type="submit"
            title={isCollapsed ? 'Keluar' : undefined}
            aria-label="Keluar"
            className={`flex min-h-[44px] w-full items-center rounded-2xl text-xs font-bold text-red-700 transition-colors hover:bg-red-50 tap-bounce dark:text-red-400 dark:hover:bg-red-950/40 ${
              isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3.5'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ session }: { session?: { name?: string; email?: string } | null }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setIsMenuOpen(false);
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      <nav
        aria-label="Navigasi Mobile Admin"
        className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-white/85 px-3 py-1.5 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/90 md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5">
          {ADMIN_MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = (pendingHref ?? pathname).startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (pathname !== item.href) setPendingHref(item.href);
                }}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-colors transition-transform tap-bounce ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
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
            aria-label="Buka Menu Laporan dan Keluar"
            aria-expanded={isMenuOpen}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-colors transition-transform tap-bounce ${
              isMenuOpen || (pendingHref ?? pathname).startsWith('/admin/reports')
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
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
            role="dialog"
            aria-modal="true"
            aria-label="Menu Admin"
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
                className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-slate-700 dark:text-zinc-200"
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
                  <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {session.email || 'Staf Internal'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-1">
              <Link
                href="/admin/reports"
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-[46px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Rekap Laporan</span>
              </Link>
            </div>

            <div className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-red-700 py-3 text-xs font-bold text-white shadow-md tap-bounce dark:bg-red-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
