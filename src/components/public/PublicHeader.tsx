'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      {/* Top Brand Accent Line */}
      <div className="h-1 w-full bg-crimson" />

      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-navy dark:text-white">
              MULTI<span className="text-crimson">TECH</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Auto Electronics Tasikmalaya
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/cek"
            className="inline-flex items-center justify-center rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-light dark:bg-crimson dark:hover:bg-crimson-hover"
          >
            Cek Kode Servis
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
