'use client';

import { useState } from 'react';
import { createModuleTypeAction } from './actions';
import { Plus, X } from 'lucide-react';

export function ModuleTypeForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-light active:scale-[0.98] dark:bg-crimson dark:hover:bg-crimson-hover"
      >
        <Plus className="h-4 w-4" />
        Tambah Jenis Modul
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Tambah Jenis Modul Elektronik
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nama Modul *
            </label>
            <input
              name="name"
              required
              placeholder="Contoh: TCU / Transmisi Otomatis"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Deskripsi Singkat
            </label>
            <input
              name="description"
              placeholder="Fungsi modul pada kendaraan"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Saran Masa Garansi (Bulan)
            </label>
            <input
              name="defaultWarrantyMonths"
              type="number"
              defaultValue={1}
              min={0}
              max={24}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50 dark:bg-crimson dark:hover:bg-crimson-hover"
            >
              {loading ? 'Menyimpan...' : 'Simpan Modul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
