'use client';

import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function PublicHeader() {
  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-black/[0.04] bg-[#F2F2F7]/80 backdrop-blur-xl transition-colors dark:border-white/[0.06] dark:bg-black/80">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:px-5">
        <BrandLogo href="/" compact />

        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
