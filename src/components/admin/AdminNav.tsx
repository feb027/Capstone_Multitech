'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  Cpu,
  BarChart3,
} from 'lucide-react';

const DESKTOP_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Servis', icon: Wrench },
  { href: '/admin/inventory', label: 'Stok Part', icon: Package },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/modules', label: 'Modul', icon: Cpu },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
];

const MOBILE_NAV = [
  { href: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/admin/services', label: 'Servis', icon: Wrench },
  { href: '/admin/inventory', label: 'Stok', icon: Package },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
];

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi Admin" className="hidden items-center gap-1 md:flex">
      {DESKTOP_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all tap-bounce ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-black/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Mobile Admin"
      className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-[#F2F2F7]/90 px-2 py-1.5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/90 md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-all tap-bounce ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
