'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { verifyCustomerAccessAction } from '@/app/(public)/cek/actions';
import { X, ArrowRight } from 'lucide-react';

interface CheckCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function CheckCodeModal({ isOpen, onClose, initialCode = '' }: CheckCodeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

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

  // Two-stage mount/visibility for 100% reliable CSS slide-in and slide-out transitions
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setError(null);
      // Double rAF ensures browser paints initial state before triggering CSS transition
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setVisible(true);
        });
        return () => cancelAnimationFrame(frame2);
      });

      const focusTimer = setTimeout(() => {
        if (!initialCode) {
          codeInputRef.current?.focus();
        } else {
          phoneInputRef.current?.focus();
        }
      }, 160);

      return () => {
        cancelAnimationFrame(frame1);
        clearTimeout(focusTimer);
      };
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialCode]);

  const handleSmoothClose = () => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 280);
  };

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
      setError('Masukkan 4 digit kode servis & 4 digit nomor HP.');
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

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Smooth Apple Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSmoothClose}
      />

      {/* Smooth Apple Bottom Sheet with guaranteed entrance and exit transitions */}
      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-t-[36px] border-t border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-white/10 dark:bg-[#161618]/95 sm:rounded-[36px] sm:border sm:p-8 ${
          visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-8 sm:scale-95'
        }`}
      >
        {/* iOS Drag Handle Pill */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        {/* Clean Modal Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Cek Status
          </h2>

          <button
            onClick={handleSmoothClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form with Combined Single-Row Input */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Unified Input Container */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner transition-all focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-800/10 dark:border-white/10 dark:bg-black/50 dark:focus-within:border-white dark:focus-within:ring-white/15">
            <div className="grid grid-cols-2 text-center text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <span>Kode Servis</span>
              <span>4 Digit HP</span>
            </div>

            <div className="mt-1.5 flex items-center justify-center gap-2">
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

              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">—</span>

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

          {/* Single Apple CTA Button */}
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
