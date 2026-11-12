'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={`ios-glass-inner h-11 w-11 rounded-full ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`ios-glass-inner relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 transition-all hover:bg-white/75 tap-bounce dark:text-zinc-100 dark:hover:bg-white/15 ${className}`}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-zinc-100 transition-transform duration-200" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-slate-800 transition-transform duration-200" aria-hidden="true" />
      )}
    </button>
  );
}
