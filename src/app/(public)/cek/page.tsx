'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { verifyCustomerAccessAction } from './actions';

export default function CekProgresPage() {
  const [state, formAction, isPending] = useActionState(
    verifyCustomerAccessAction,
    null
  );

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-4 pt-4">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Akses Pelacakan Unit
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Verifikasi Kode Servis
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Masukkan 4 digit kode servis yang tertera pada nota tanda terima dan 4 digit terakhir nomor HP Anda.
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
              htmlFor="code"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Kode Servis (4 Digit)
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Contoh: 4821"
              required
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-slate-900 transition-colors focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-crimson dark:focus:bg-slate-900 dark:focus:ring-crimson/20"
            />
          </div>

          <div>
            <label
              htmlFor="phoneLast4"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              4 Digit Terakhir No. HP
            </label>
            <input
              id="phoneLast4"
              name="phoneLast4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Contoh: 5678"
              required
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-slate-900 transition-colors focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-crimson dark:focus:bg-slate-900 dark:focus:ring-crimson/20"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-60 dark:bg-crimson dark:hover:bg-crimson-hover"
          >
            {isPending ? 'Memeriksa...' : 'Lihat Status Progres'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            &larr; Kembali ke Papan Antrean
          </Link>
        </div>
      </div>
    </div>
  );
}
