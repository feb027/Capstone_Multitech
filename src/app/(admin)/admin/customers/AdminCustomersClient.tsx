'use client';

import { useState, useMemo } from 'react';
import { CustomerType } from '@prisma/client';
import { CustomerForm } from './CustomerForm';
import { Search } from 'lucide-react';

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  workshopName: string | null;
  address: string | null;
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number | null;
    plateNumber: string | null;
  }>;
  _count: { serviceOrders: number };
}

export function AdminCustomersClient({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CustomerType>('ALL');

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchWorkshop = c.workshopName?.toLowerCase().includes(q);
        const matchVehicle = c.vehicles.some(
          (v) =>
            v.brand.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            (v.plateNumber && v.plateNumber.toLowerCase().includes(q))
        );
        if (!matchName && !matchPhone && !matchWorkshop && !matchVehicle) return false;
      }
      return true;
    });
  }, [customers, search, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Data Pelanggan & Unit
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Daftar pelanggan perorangan dan bengkel mitra B2B beserta kendaraan terdaftar.
          </p>
        </div>
        <CustomerForm />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'ALL', label: 'Semua' },
            { key: CustomerType.PERORANGAN, label: 'Perorangan' },
            { key: CustomerType.MITRA, label: 'Mitra B2B' },
          ].map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeFilter(tab.key as 'ALL' | CustomerType)}
                className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-semibold transition-all tap-bounce ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:bg-[#1C1C1E] dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, HP, plat..."
            aria-label="Cari pelanggan"
            className="h-11 w-full rounded-full border border-black/[0.06] bg-white pl-11 pr-4 text-xs text-slate-900 placeholder-slate-500 shadow-sm focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[26px] border border-black/[0.04] bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Pelanggan tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Tidak ada pelanggan yang cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.type === CustomerType.MITRA
                          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300'
                          : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {c.type === CustomerType.MITRA ? 'Mitra B2B' : 'Perorangan'}
                    </span>
                  </div>
                  {c.workshopName && (
                    <p className="mt-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {c.workshopName}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                    +{c.phone}
                  </p>
                  {c.address && (
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {c.address}
                    </p>
                  )}
                </div>

                <span className="shrink-0 rounded-full bg-[#F2F2F7] px-3 py-1 font-mono text-[11px] font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                  {c._count.serviceOrders} Servis
                </span>
              </div>

              {c.vehicles.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                  {c.vehicles.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-xl bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:bg-white/[0.06] dark:text-slate-200"
                    >
                      {v.brand} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
