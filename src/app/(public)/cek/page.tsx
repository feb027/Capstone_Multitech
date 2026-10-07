'use client';

import { useState, useRef, useActionState } from 'react';
import Link from 'next/link';
import { verifyCustomerAccessAction } from './actions';
import { ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';

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
          <span>Kembali ke Antrean</span>
        </Link>
      </div>

      <div className="rounded-[32px] border border-black/[0.04] bg-white p-6 shadow-sm transition-colors dark:border-white/[0.06] dark:bg-[#1C1C1E] sm:p-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E63946]/10 px-3 py-1 text-[11px] font-bold text-[#E63946] dark:bg-[#E63946]/20">
          <Sparkles className="h-3 w-3" />
          <span>Verifikasi Pelanggan</span>
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Cek Status Unit
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Kombinasi 4 digit kode nota dan 4 digit terakhir nomor HP Anda
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          {state?.error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {state.error}
            </div>
          )}

          {/* Unified Single-Row Input (Satu Baris Dipisah Strip) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner transition-all focus-within:border-[#0B2545] focus-within:ring-2 focus-within:ring-[#0B2545]/15 dark:border-white/10 dark:bg-black/50 dark:focus-within:border-white dark:focus-within:ring-white/15">
            <div className="grid grid-cols-2 text-center text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <span>Kode Nota (4 Digit)</span>
              <span>4 Digit Akhir HP</span>
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-2">
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

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
            Ketik 8 angka berurutan di atas keyboard nomor HP Anda
          </p>

          <button
            type="submit"
            disabled={isPending || code.length !== 4 || phoneLast4.length !== 4}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2545] py-4 text-xs font-bold text-white shadow-lg transition-transform tap-bounce disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <span>{isPending ? 'Memeriksa Progres...' : 'Buka Progres Unit'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
