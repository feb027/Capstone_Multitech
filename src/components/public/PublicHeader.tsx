'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.04] bg-[#F2F2F7]/80 backdrop-blur-xl transition-colors dark:border-white/[0.06] dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 tap-bounce">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2545] text-white dark:bg-white dark:text-black">
            <span className="text-xs font-black tracking-tight">M</span>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            MULTI<span className="text-[#E63946]">TECH</span>
          </span>
        </Link>

        {/* Right Action: Status Pill & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Aktif</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
