'use client';

import { useState, useRef, useActionState } from 'react';
import Link from 'next/link';
import { verifyCustomerAccessAction } from './actions';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function CekProgresPage() {
  const [state, formAction, isPending] = useActionState(
    verifyCustomerAccessAction,
    null
  );

  const [code, setCode] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');

  const codeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    if (val.length === 4) {
      phoneInputRef.current?.focus();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhoneLast4(val);
  };

  return (
    <div className="flex flex-col justify-center pt-2">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Link>
      </div>

      <div className="rounded-[32px] border border-black/[0.04] bg-white p-6 shadow-sm transition-colors dark:border-white/[0.06] dark:bg-[#1C1C1E] sm:p-8">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Cek Status
        </h1>

        <form action={formAction} className="mt-5 space-y-4">
          {state?.error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {state.error}
            </div>
          )}

          {/* Unified Single-Row Input (Satu Baris Dipisah Strip) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner transition-all focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/10 dark:border-white/10 dark:bg-black/50 dark:focus-within:border-white dark:focus-within:ring-white/15">
            <div className="grid grid-cols-2 text-center text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <span>Kode Servis</span>
              <span>4 Digit HP</span>
            </div>

            <div className="mt-1.5 flex items-center justify-center gap-2">
              <input
                ref={codeInputRef}
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={handleCodeChange}
                placeholder="4821"
                required
                className="w-full rounded-xl bg-white py-3 text-center font-mono text-2xl font-black tracking-widest text-slate-900 shadow-sm transition-all focus:outline-none dark:bg-[#2C2C2E] dark:text-white"
              />

              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">—</span>

              <input
                ref={phoneInputRef}
                name="phoneLast4"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneLast4}
                onChange={handlePhoneChange}
                placeholder="5678"
                required
                className="w-full rounded-xl bg-white py-3 text-center font-mono text-2xl font-black tracking-widest text-slate-900 shadow-sm transition-all focus:outline-none dark:bg-[#2C2C2E] dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || code.length !== 4 || phoneLast4.length !== 4}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-lg transition-transform tap-bounce disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <span>{isPending ? 'Memeriksa...' : 'Buka Progres'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
