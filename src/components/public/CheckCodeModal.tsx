'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { verifyCustomerAccessAction } from '@/app/(public)/cek/actions';
import { X, ArrowRight } from 'lucide-react';

interface CheckCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  unitLabel?: string;
}

export function CheckCodeModal({
  isOpen,
  onClose,
  initialCode = '',
  unitLabel = '',
}: CheckCodeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const [code, setCode] = useState(initialCode);
  const [phoneLast4, setPhoneLast4] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const codeInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(initialCode || '');
      setPhoneLast4('');
    }
  }, [isOpen, initialCode]);

  const handleSmoothClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setError(null);
      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });

      const focusTimer = setTimeout(() => {
        if (!initialCode) {
          codeInputRef.current?.focus({ preventScroll: true });
        } else {
          phoneInputRef.current?.focus({ preventScroll: true });
        }
      }, 160);

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleSmoothClose();
        }
      };
      window.addEventListener('keydown', onKeyDown);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(focusTimer);
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialCode, handleSmoothClose]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    setError(null);
    if (val.length === 4) {
      requestAnimationFrame(() => {
        phoneInputRef.current?.focus({ preventScroll: true });
      });
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

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cek-status-title"
    >
      {/* Full-bleed Backdrop covering whole screen including navbar */}
      <div
        className={`fixed inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-200 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSmoothClose}
        aria-hidden="true"
      />

      {/* Modal Sheet / Card */}
      <div
        className={`ios-glass-card relative z-10 w-full max-w-md overflow-hidden rounded-t-[32px] p-5 shadow-2xl transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-[32px] sm:p-7 ${
          visible
            ? 'translate-y-0 sm:scale-100 sm:opacity-100'
            : 'translate-y-full sm:translate-y-4 sm:scale-95 sm:opacity-0'
        }`}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20 sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="modal-cek-status-title"
              className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl"
            >
              Cek Status
            </h2>
            {unitLabel && (
              <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                {unitLabel}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSmoothClose}
            aria-label="Tutup dialog"
            className="ios-glass-inner flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/15"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200/80 bg-red-50/80 p-2.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-inner dark:border-white/10 dark:bg-black/50 sm:p-3">
            <div className="grid grid-cols-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <label htmlFor="modal-code-input">Kode Servis</label>
              <label htmlFor="modal-phone-input">4 Digit HP</label>
            </div>

            <div className="mt-1.5 flex items-center justify-center gap-2">
              <input
                ref={codeInputRef}
                id="modal-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={4}
                value={code}
                onChange={handleCodeChange}
                placeholder="••••"
                className="w-full rounded-xl bg-white py-2.5 text-center font-mono text-xl font-black tracking-widest text-slate-900 shadow-sm focus:outline-none dark:bg-[#2C2C2E] dark:text-white sm:py-3 sm:text-2xl"
              />

              <span className="text-lg font-bold text-slate-400 dark:text-slate-600 sm:text-xl" aria-hidden="true">
                /
              </span>

              <input
                ref={phoneInputRef}
                id="modal-phone-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={4}
                value={phoneLast4}
                onChange={handlePhoneChange}
                placeholder="••••"
                className="w-full rounded-xl bg-white py-2.5 text-center font-mono text-xl font-black tracking-widest text-slate-900 shadow-sm focus:outline-none dark:bg-[#2C2C2E] dark:text-white sm:py-3 sm:text-2xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || code.length !== 4 || phoneLast4.length !== 4}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-lg transition-transform tap-bounce disabled:opacity-40 dark:bg-white dark:text-black sm:min-h-[48px] sm:py-3.5"
          >
            <span>{isPending ? 'Memeriksa...' : 'Buka Progres'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
