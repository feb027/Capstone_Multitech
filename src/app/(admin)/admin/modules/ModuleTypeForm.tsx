'use client';

import { useState, useEffect } from 'react';
import { createModuleTypeAction } from './actions';
import { Plus, X } from 'lucide-react';

export function ModuleTypeForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await createModuleTypeAction(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Tambah Jenis Modul</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-module-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-t-[36px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
          <h2 id="add-module-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Tambah Jenis Modul Elektronik
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup dialog"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="mod-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Nama Modul *
            </label>
            <input
              id="mod-name"
              name="name"
              required
              placeholder="Contoh: Modul Kontrol Genset / AMF"
              className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label htmlFor="mod-desc" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Deskripsi Singkat
            </label>
            <input
              id="mod-desc"
              name="description"
              placeholder="Fungsi modul pada kendaraan atau genset"
              className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label htmlFor="mod-warranty" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Saran Masa Garansi (Bulan)
            </label>
            <input
              id="mod-warranty"
              name="defaultWarrantyMonths"
              type="number"
              defaultValue={1}
              min={0}
              max={24}
              className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 tap-bounce dark:bg-white/10 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] items-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {loading ? 'Menyimpan...' : 'Simpan Modul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
