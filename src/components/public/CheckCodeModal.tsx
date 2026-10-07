'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyCustomerAccessAction } from '@/app/(public)/cek/actions';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface CheckCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function CheckCodeModal({ isOpen, onClose, initialCode = '' }: CheckCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [phoneLast4, setPhoneLast4] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const codeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Auto-focus first input when modal opens
      setTimeout(() => {
        if (!initialCode) {
          codeInputRef.current?.focus();
        } else {
          phoneInputRef.current?.focus();
        }
      }, 150);
    }
  }, [isOpen, initialCode]);

  // Handle auto-advance when 4 digits typed
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    setError(null);
    if (val.length === 4) {
      phoneInputRef.current?.focus();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhoneLast4(val);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4 || phoneLast4.length !== 4) {
      setError('Masukkan 4 digit kode servis dan 4 digit terakhir No. HP.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('code', code);
      formData.set('phoneLast4', phoneLast4);

      try {
        const res = await verifyCustomerAccessAction(null, formData);
        if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        // Handle Next.js redirect
        if (
          err &&
          typeof err === 'object' &&
          'digest' in err &&
          typeof (err as { digest: string }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
          throw err;
        }
        setError('Kode atau nomor HP tidak cocok.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Smooth Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Apple-style Bottom Sheet (Mobile) / Centered Card (Desktop) */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-[36px] border-t border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#161618]/95 sm:rounded-[36px] sm:border sm:p-8">
        {/* iOS Drag Handle Pill */}
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E63946]/10 px-3 py-1 text-[11px] font-bold text-[#E63946] dark:bg-[#E63946]/20">
              <Sparkles className="h-3 w-3" />
              <span>Akses Cepat Progres</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Cek Status Servis
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ketik 4 digit kode nota & 4 digit nomor HP Anda
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form with Combined Single-Row Input */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Unified Input Container (Satu Baris Terpadu) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-inner transition-all focus-within:border-[#0B2545] focus-within:ring-2 focus-within:ring-[#0B2545]/15 dark:border-white/10 dark:bg-black/50 dark:focus-within:border-white dark:focus-within:ring-white/15">
            <div className="grid grid-cols-2 text-center text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <span>Kode Nota (4 Digit)</span>
              <span>4 Digit Akhir HP</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              {/* Box 1: Kode Servis */}
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={handleCodeChange}
                placeholder="4821"
                className="w-full rounded-xl bg-white py-3 text-center font-mono text-2xl font-black tracking-widest text-slate-900 shadow-sm transition-all focus:outline-none dark:bg-[#2C2C2E] dark:text-white"
              />

              {/* Separator Strip */}
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">—</span>

              {/* Box 2: 4 Digit HP */}
              <input
                ref={phoneInputRef}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneLast4}
                onChange={handlePhoneChange}
                placeholder="5678"
                className="w-full rounded-xl bg-white py-3 text-center font-mono text-2xl font-black tracking-widest text-slate-900 shadow-sm transition-all focus:outline-none dark:bg-[#2C2C2E] dark:text-white"
              />
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
            Contoh: Jika nota <strong className="text-slate-600 dark:text-slate-300">4821</strong> dan no HP berakhir <strong className="text-slate-600 dark:text-slate-300">5678</strong>, ketik <strong className="font-mono text-slate-700 dark:text-slate-200">4821 — 5678</strong>
          </p>

          {/* Action CTA Button */}
          <button
            type="submit"
            disabled={isPending || code.length !== 4 || phoneLast4.length !== 4}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2545] py-4 text-xs font-bold text-white shadow-lg transition-transform tap-bounce disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <span>{isPending ? 'Memeriksa Progres...' : 'Lihat Progres Unit'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
