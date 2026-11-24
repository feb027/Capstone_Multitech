'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CustomerType } from '@prisma/client';
import {
  PARTNER_WORKSHOPS,
  createUniqueId,
  getWorkshopOptions,
  normalizePhone,
  normalizeWorkshopName,
} from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { WorkshopSelectField } from '@/components/admin/WorkshopSelectField';
import { Plus, X } from 'lucide-react';

export function CustomerForm() {
  const { customers, orders, upsertCustomer } = useDataset();
  const workshopOptions = useMemo(
    () => getWorkshopOptions(customers, orders),
    [customers, orders]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [workshopName, setWorkshopName] = useState<string>(PARTNER_WORKSHOPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCustomerId, setDuplicateCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setError(null);
    setDuplicateCustomerId(null);
    setType(CustomerType.PERORANGAN);
    setWorkshopName(workshopOptions[0] || PARTNER_WORKSHOPS[0]);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDuplicateCustomerId(null);

    const formData = new FormData(e.currentTarget);
    formData.set('type', type);

    const name = String(formData.get('name') || '').trim();
    const rawPhone = String(formData.get('phone') || '').trim();
    const cleanPhone = normalizePhone(rawPhone);
    const resolvedWorkshop = normalizeWorkshopName(workshopName, type);
    const address = String(formData.get('address') || '').trim() || null;
    const brand = String(formData.get('brand') || '').trim();
    const model = String(formData.get('model') || '').trim();
    const yearStr = String(formData.get('year') || '').trim();
    const plateNumber = String(formData.get('plateNumber') || '').trim() || null;
    const vin = String(formData.get('vin') || '').trim() || null;

    if (!name || cleanPhone.length < 9) {
      setError('Nama lengkap dan nomor WhatsApp aktif (min. 9 digit) wajib diisi.');
      return;
    }

    if (type === CustomerType.MITRA && !resolvedWorkshop) {
      setError('Nama bengkel mitra wajib diisi.');
      return;
    }

    const duplicate = customers.find((c) => normalizePhone(c.phone) === cleanPhone);
    if (duplicate) {
      setDuplicateCustomerId(duplicate.id);
      setError(`Nomor WA +${cleanPhone} sudah terdaftar atas nama ${duplicate.name}.`);
      return;
    }

    const parsedYear = yearStr ? parseInt(yearStr, 10) : null;
    const hasVehicle = Boolean(brand || model || plateNumber || vin);

    setLoading(true);
    const mutationRes = await upsertCustomer({
      id: createUniqueId('cust'),
      name,
      phone: cleanPhone,
      type,
      workshopName: resolvedWorkshop,
      address,
      vehicle: hasVehicle
        ? {
            brand: brand || 'Unit',
            model: model || plateNumber?.toUpperCase() || 'Kendaraan',
            year: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : null,
            plateNumber: plateNumber ? plateNumber.toUpperCase() : null,
            vin: vin ? vin.toUpperCase() : null,
          }
        : null,
    });
    setLoading(false);

    if (!mutationRes.ok) {
      setError(mutationRes.error || 'Gagal menyimpan data pelanggan ke database.');
      return;
    }

    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Tambah Pelanggan</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-customer-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[36px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
          <h2 id="add-customer-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Tambah Pelanggan & Unit
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup dialog"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
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
              <p>{error}</p>
              {duplicateCustomerId && (
                <Link
                  href={`/admin/customers/${encodeURIComponent(duplicateCustomerId)}`}
                  onClick={() => setIsOpen(false)}
                  className="mt-1.5 inline-block font-bold underline"
                >
                  Buka profil pelanggan tersebut
                </Link>
              )}
            </div>
          )}

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tipe Pelanggan
            </span>
            <div className="mt-1.5 flex rounded-2xl bg-[#F2F2F7] p-1 dark:bg-white/[0.05]">
              <button
                type="button"
                onClick={() => setType(CustomerType.PERORANGAN)}
                className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-all ${
                  type === CustomerType.PERORANGAN
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#2C2C2E] dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Perorangan
              </button>
              <button
                type="button"
                onClick={() => setType(CustomerType.MITRA)}
                className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-all ${
                  type === CustomerType.MITRA
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#2C2C2E] dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bengkel Mitra
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cust-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Nama Lengkap / PIC *
              </label>
              <input
                id="cust-name"
                name="name"
                required
                placeholder="Nama pelanggan atau PIC"
                className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
              />
            </div>
            <div>
              <label htmlFor="cust-phone" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                No. Handphone (WA) *
              </label>
              <input
                id="cust-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                placeholder="08xxxxxxxxxx"
                className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
              />
            </div>
          </div>

          {type === CustomerType.MITRA && (
            <WorkshopSelectField
              id="cust-workshop"
              name="workshopName"
              label="Nama Bengkel Mitra *"
              required
              value={workshopName}
              onChange={setWorkshopName}
              options={workshopOptions}
              labelClassName="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              selectClassName="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
              inputClassName="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm font-semibold text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
            />
          )}

          <div>
            <label htmlFor="cust-address" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Alamat
            </label>
            <input
              id="cust-address"
              name="address"
              placeholder="Kecamatan, kota, atau alamat singkat"
              className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
            />
          </div>

          <div className="rounded-[22px] bg-[#F2F2F7] p-4 dark:bg-white/[0.04]">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Data Kendaraan / Unit Awal (Opsional)
            </span>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                name="brand"
                aria-label="Merek kendaraan"
                placeholder="Merek (mis. Toyota)"
                className="h-10 rounded-xl border border-black/[0.06] bg-white px-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
              />
              <input
                name="model"
                aria-label="Model kendaraan"
                placeholder="Model (mis. Avanza)"
                className="h-10 rounded-xl border border-black/[0.06] bg-white px-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
              />
              <input
                name="year"
                type="number"
                aria-label="Tahun kendaraan"
                placeholder="Tahun (mis. 2018)"
                className="h-10 rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
              />
              <input
                name="plateNumber"
                aria-label="Plat nomor"
                placeholder="Plat Nomor (Privat)"
                className="h-10 rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs uppercase text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
              />
              <input
                name="vin"
                aria-label="Nomor rangka kendaraan"
                placeholder="Nomor Rangka / VIN (Opsional)"
                className="h-10 rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs uppercase text-slate-900 placeholder-slate-500 focus:outline-none sm:col-span-2 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
              />
            </div>
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
              {loading ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
