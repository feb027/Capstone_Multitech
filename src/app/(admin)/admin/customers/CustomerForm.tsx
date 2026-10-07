'use client';

import { useState } from 'react';
import { createCustomerAction } from './actions';
import { CustomerType } from '@prisma/client';
import { Plus, X } from 'lucide-react';

export function CustomerForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('type', type);

    const res = await createCustomerAction(formData);
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
        Tambah Pelanggan Baru
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Tambah Pelanggan & Kendaraan
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

          {/* Segmented Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tipe Pelanggan
            </label>
            <div className="mt-1.5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setType(CustomerType.PERORANGAN)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  type === CustomerType.PERORANGAN
                    ? 'bg-white text-navy shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Perorangan (Pemilik Mobil)
              </button>
              <button
                type="button"
                onClick={() => setType(CustomerType.MITRA)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  type === CustomerType.MITRA
                    ? 'bg-white text-navy shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Bengkel Mitra (B2B)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nama Lengkap / PIC *
              </label>
              <input
                name="name"
                required
                placeholder="Contoh: Budi Santoso"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                No. Handphone (WhatsApp) *
              </label>
              <input
                name="phone"
                required
                placeholder="081234567890"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
          </div>

          {type === CustomerType.MITRA && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nama Bengkel Mitra *
              </label>
              <input
                name="workshopName"
                required
                placeholder="Contoh: Bengkel Maju Motor"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Alamat
            </label>
            <input
              name="address"
              placeholder="Kota / Alamat singkat"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-navy focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          {/* Optional Vehicle Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/60 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Data Kendaraan Awal (Opsional)
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <input
                name="brand"
                placeholder="Merek (e.g. Toyota)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                name="model"
                placeholder="Model (e.g. Avanza)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                name="year"
                type="number"
                placeholder="Tahun (e.g. 2015)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <input
                name="plateNumber"
                placeholder="Plat Polisi (Privat)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
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
              {loading ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
