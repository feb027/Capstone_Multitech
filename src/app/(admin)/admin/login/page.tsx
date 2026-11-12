'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { loginAdminAction } from '../actions';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F2F2F7] px-5 py-10 transition-colors dark:bg-black">
      <div className="absolute left-5 top-5">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:text-slate-900 tap-bounce dark:bg-[#1C1C1E] dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Portal Publik</span>
        </Link>
      </div>

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-[32px] border border-black/[0.04] bg-white p-7 shadow-xl dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="flex flex-col items-center text-center">
          <BrandLogo href="/" />
          <h1 className="mt-5 text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Portal Internal
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Masuk untuk mengelola penerimaan unit, rekam medis modul, stok suku cadang, dan laporan.
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300"
            >
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
            >
              Email Staf / Admin
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@multitech.com"
              required
              className="mt-1.5 h-12 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-4 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400 dark:focus:border-white/40"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Masukkan password"
                className="h-12 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] pl-4 pr-12 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400 dark:focus:border-white/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute right-0.5 top-0.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 tap-bounce disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {isPending ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
