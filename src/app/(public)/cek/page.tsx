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
    <div className="flex flex-col justify-center pt-2">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <span>&larr;</span>
          <span>Kembali</span>
        </Link>
      </div>

      <div className="rounded-[32px] border border-black/[0.04] bg-white p-6 shadow-sm transition-colors dark:border-white/[0.06] dark:bg-[#1C1C1E] sm:p-8">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Cek Status Unit
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Kombinasi kode nota dan 4 digit nomor HP Anda
          </p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div className="rounded-2xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="code"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
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
              className="mt-1.5 block w-full rounded-2xl border-0 bg-[#F2F2F7] px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-slate-900 placeholder-slate-300 transition-colors focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-600 dark:focus:ring-white"
            />
          </div>

          <div>
            <label
              htmlFor="phoneLast4"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >
              4 Digit Akhir No. HP
            </label>
            <input
              id="phoneLast4"
              name="phoneLast4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Contoh: 5678"
              required
              className="mt-1.5 block w-full rounded-2xl border-0 bg-[#F2F2F7] px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-slate-900 placeholder-slate-300 transition-colors focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-600 dark:focus:ring-white"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white transition-all tap-bounce disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isPending ? 'Memeriksa...' : 'Buka Progres'}
          </button>
        </form>
      </div>
    </div>
  );
}
