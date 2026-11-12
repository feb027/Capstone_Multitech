'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { WORKSHOP_PROFILE } from '@/lib/status';

export function PublicHeader() {
  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-white/60 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 transition-colors dark:border-white/[0.08] dark:bg-black/75">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-0 items-center gap-2.5 tap-bounce"
          aria-label={`${WORKSHOP_PROFILE.name} ${WORKSHOP_PROFILE.city} Beranda`}
        >
          <BrandLogo href="" compact />
          <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            {WORKSHOP_PROFILE.name} {WORKSHOP_PROFILE.city}
          </span>
        </Link>

        <div className="flex shrink-0 items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
