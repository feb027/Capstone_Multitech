'use client';

import { useActionState } from 'react';
import { loginAdminAction } from '../actions';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, null);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-light px-4 transition-colors dark:bg-surface-dark">
      {/* Top Right Theme Toggle */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-navy p-3 text-white dark:bg-slate-800">
            <span className="text-base font-black tracking-wider">MT</span>
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Portal Admin Multitech
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Masuk untuk mengelola penerimaan servis, teknisi, dan laporan.
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Email Admin
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="admin@multitech.com"
              required
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-crimson dark:focus:bg-slate-900 dark:focus:ring-crimson/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-crimson dark:focus:bg-slate-900 dark:focus:ring-crimson/20"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-navy py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-60 dark:bg-crimson dark:hover:bg-crimson-hover"
          >
            {isPending ? 'Memproses Masuk...' : 'Masuk Dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Akses terbatas hanya untuk staf & teknisi Multitech
        </p>
      </div>
    </div>
  );
}
