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
    <div className="ios-ambient-backdrop flex min-h-screen items-center justify-center p-4 transition-colors">
      <div className="ios-glass-card relative w-full max-w-sm overflow-hidden rounded-[32px] p-6 shadow-2xl sm:p-7">
        {/* Header di dalam kotak login: Logo & Pengubah Mode */}
        <div className="flex items-center justify-between gap-3">
          <BrandLogo href="/" />
          <ThemeToggle />
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Portal Internal
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Masuk untuk mengelola antrean servis, data pelanggan, dan konfirmasi unit.
          </p>
        </div>

        <form action={formAction} className="mt-5 space-y-3.5">
          {state?.error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
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
              className="mt-1.5 h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-black/50 dark:text-white dark:focus:ring-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
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
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white pl-3.5 pr-11 text-xs text-slate-900 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-black/50 dark:text-white dark:focus:ring-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute right-0.5 top-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
            className="flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white shadow-lg transition-transform tap-bounce disabled:opacity-50 dark:bg-white dark:text-black sm:min-h-[48px]"
          >
            {isPending ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-5 border-t border-black/[0.06] pt-4 text-center dark:border-white/[0.08]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kembali ke Portal Publik</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
