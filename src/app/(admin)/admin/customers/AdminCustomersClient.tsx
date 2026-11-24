'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerType } from '@prisma/client';
import { CustomerForm } from './CustomerForm';
import { MockServiceOrder, getWorkshopOptions, normalizePhone } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import {
  Search,
  Eye,
  Building2,
  Car,
  MessageCircle,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react';
import {
  type CustomerRow,
  buildAllCustomers,
  getCustomerInitials,
} from './customer-utils';

export type { CustomerRow } from './customer-utils';

export function AdminCustomersClient({
  customers: initialCustomers,
  initialOrders,
}: {
  customers: CustomerRow[];
  initialOrders?: MockServiceOrder[];
}) {
  const router = useRouter();
  const { orders, customers } = useDataset(initialOrders, initialCustomers);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CustomerType>('ALL');
  const [workshopFilter, setWorkshopFilter] = useState<'ALL' | string>('ALL');
  const [isWorkshopMenuOpen, setIsWorkshopMenuOpen] = useState(false);
  const [alignMenuRight, setAlignMenuRight] = useState(false);
  const workshopDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isWorkshopMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (workshopDropdownRef.current && !workshopDropdownRef.current.contains(e.target as Node)) {
        setIsWorkshopMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsWorkshopMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isWorkshopMenuOpen]);

  const allCustomers = useMemo(
    () => buildAllCustomers(customers, orders),
    [customers, orders]
  );

  const workshopOptions = useMemo(
    () => getWorkshopOptions(allCustomers, orders),
    [allCustomers, orders]
  );

  const peroranganCount = useMemo(
    () => allCustomers.filter((c) => c.type === CustomerType.PERORANGAN).length,
    [allCustomers]
  );

  const mitraCount = useMemo(
    () => allCustomers.filter((c) => c.type === CustomerType.MITRA).length,
    [allCustomers]
  );

  const filtered = useMemo(() => {
    return allCustomers.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (
        workshopFilter !== 'ALL' &&
        (c.workshopName || '').trim().toLowerCase() !== workshopFilter.trim().toLowerCase()
      ) {
        return false;
      }
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
  }, [allCustomers, search, typeFilter, workshopFilter]);

  const navigateToCustomer = (c: CustomerRow) => {
    router.push(`/admin/customers/${encodeURIComponent(c.id)}`);
  };

  const filterTabs = [
    { key: 'ALL', label: 'Semua', count: allCustomers.length },
    { key: CustomerType.PERORANGAN, label: 'Perorangan', count: peroranganCount },
    { key: CustomerType.MITRA, label: 'Bengkel Mitra', count: mitraCount },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Data Pelanggan &amp; Unit
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Daftar pelanggan dan unit kendaraan/modul terdaftar.
          </p>
        </div>
        <CustomerForm />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  const nextType = tab.key as 'ALL' | CustomerType;
                  setTypeFilter(nextType);
                  if (nextType === CustomerType.PERORANGAN) setWorkshopFilter('ALL');
                }}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors transition-transform tap-bounce ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-700 shadow-sm hover:text-slate-900 dark:bg-[#1C1C1E] dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    active
                      ? 'bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900'
                      : 'bg-slate-900/[0.06] text-slate-700 dark:bg-white/[0.1] dark:text-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <div ref={workshopDropdownRef} className="relative z-30 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsWorkshopMenuOpen((prev) => {
                  const next = !prev;
                  if (next && workshopDropdownRef.current && typeof window !== 'undefined') {
                    const rect = workshopDropdownRef.current.getBoundingClientRect();
                    setAlignMenuRight(rect.left + 224 > window.innerWidth - 12);
                  }
                  return next;
                });
              }}
              aria-label="Filter bengkel mitra"
              aria-expanded={isWorkshopMenuOpen}
              aria-haspopup="listbox"
              className={`inline-flex min-h-[44px] items-center justify-between gap-2.5 whitespace-nowrap rounded-full border px-4 text-xs font-semibold shadow-sm transition-colors transition-transform tap-bounce ${
                workshopFilter !== 'ALL' || isWorkshopMenuOpen
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-black/[0.06] bg-white text-slate-700 hover:text-slate-900 dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200 dark:hover:text-white'
              }`}
            >
              <span>
                {workshopFilter === 'ALL' ? 'Semua Bengkel Mitra' : `Mitra: ${workshopFilter}`}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                  isWorkshopMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isWorkshopMenuOpen && (
              <div
                role="listbox"
                aria-label="Pilih bengkel mitra"
                className={`ios-glass-card absolute top-[calc(100%+6px)] z-40 max-h-72 min-w-[220px] max-w-[calc(100vw-2rem)] space-y-1 overflow-y-auto rounded-2xl p-1.5 shadow-2xl ${
                  alignMenuRight ? 'right-0 animate-popover-in' : 'left-0 animate-popover-in-left'
                }`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={workshopFilter === 'ALL'}
                  onClick={() => {
                    setWorkshopFilter('ALL');
                    setIsWorkshopMenuOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    workshopFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">Semua Bengkel Mitra</span>
                  {workshopFilter === 'ALL' && (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {workshopOptions.map((w) => {
                  const selected =
                    workshopFilter !== 'ALL' &&
                    workshopFilter.trim().toLowerCase() === w.trim().toLowerCase();
                  return (
                    <button
                      key={w}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setWorkshopFilter(w);
                        setTypeFilter(CustomerType.MITRA);
                        setIsWorkshopMenuOpen(false);
                      }}
                      className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        selected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">Mitra: {w}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, HP, plat, kendaraan..."
            aria-label="Cari pelanggan"
            className="h-11 w-full rounded-full border border-black/[0.06] bg-white pl-11 pr-4 text-xs text-slate-900 placeholder-slate-500 shadow-sm focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-400"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-[26px] border border-black/[0.04] bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Pelanggan tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Tidak ada pelanggan yang cocok dengan kata kunci pencarian Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setTypeFilter('ALL');
              setWorkshopFilter('ALL');
            }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-5 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        /* Tabel Pelanggan (Desktop >= lg & Card List < lg) */
        <div className="ios-glass-card overflow-hidden rounded-[26px] shadow-sm">
          {/* Mobile & Tablet Card List */}
          <div className="divide-y divide-black/[0.05] lg:hidden dark:divide-white/[0.06]">
            {filtered.map((c) => {
              const detailHref = `/admin/customers/${encodeURIComponent(c.id)}`;
              const newServiceHref = `/admin/services?new=1&customerId=${encodeURIComponent(c.id)}`;
              const cleanPhone = normalizePhone(c.phone);

              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigateToCustomer(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigateToCustomer(c);
                    }
                  }}
                  className="cursor-pointer space-y-2.5 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/[0.07] text-xs font-extrabold text-slate-800 dark:bg-white/[0.1] dark:text-slate-100">
                        {getCustomerInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </h2>
                        {c.workshopName ? (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                            <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{c.workshopName}</span>
                          </p>
                        ) : (
                          <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                            {c.address || 'Pelanggan Perorangan'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        href={newServiceHref}
                        prefetch={true}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Buat unit servis baru untuk ${c.name}`}
                        title={`Buat servis baru untuk ${c.name}`}
                        className="ios-glass-inner inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href={detailHref}
                        prefetch={true}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Lihat profil dan ${c._count.serviceOrders} riwayat ${c.name}`}
                        title={`Buka profil ${c.name}`}
                        className="ios-glass-inner inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-xs font-bold text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                      >
                        <span className="font-mono tabular-nums">{c._count.serviceOrders}</span>
                        <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {cleanPhone && (
                    <div>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-1 font-mono text-xs text-slate-700 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                        title="Chat via WhatsApp"
                      >
                        <MessageCircle
                          className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>+{cleanPhone}</span>
                      </a>
                    </div>
                  )}

                  {c.vehicles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {c.vehicles.slice(0, 2).map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-300"
                        >
                          <Car className="h-3 w-3 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                          <span>
                            {v.brand} {v.model}
                          </span>
                          {v.plateNumber && <span>({v.plateNumber})</span>}
                        </span>
                      ))}
                      {c.vehicles.length > 2 && (
                        <span className="inline-flex items-center rounded-lg bg-black/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                          +{c.vehicles.length - 2} unit lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Structured Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-2.5 py-3.5 xl:px-4">Pelanggan</th>
                  <th className="px-2.5 py-3.5 xl:px-4">Kontak</th>
                  <th className="px-2.5 py-3.5 xl:px-4">Bengkel / Mitra</th>
                  <th className="px-2.5 py-3.5 xl:px-4">Kendaraan Terdaftar</th>
                  <th className="px-2.5 py-3.5 text-right xl:px-4">Riwayat Servis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filtered.map((c) => {
                  const detailHref = `/admin/customers/${encodeURIComponent(c.id)}`;
                  const newServiceHref = `/admin/services?new=1&customerId=${encodeURIComponent(c.id)}`;
                  const cleanPhone = normalizePhone(c.phone);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigateToCustomer(c)}
                      className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      {/* Pelanggan */}
                      <td className="px-2.5 py-3.5 align-middle xl:px-4">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900/[0.07] text-[10px] font-extrabold text-slate-800 dark:bg-white/[0.1] dark:text-slate-100 xl:h-9 xl:w-9 xl:text-[11px]">
                            {getCustomerInitials(c.name)}
                          </div>
                          <div className="min-w-0 max-w-[118px] xl:max-w-[200px]">
                            <p className="truncate text-[12px] font-bold text-slate-900 dark:text-white xl:text-[13px]">
                              {c.name}
                            </p>
                            {c.address ? (
                              <p className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-400 xl:text-[11px]">
                                {c.address}
                              </p>
                            ) : (
                              <p className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-400 xl:text-[11px]">
                                {c.workshopName ? `Mitra ${c.workshopName}` : 'Pelanggan Terdaftar'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="whitespace-nowrap px-2.5 py-3.5 align-middle font-mono text-[11px] text-slate-700 dark:text-slate-300 xl:px-4 xl:text-xs">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 xl:gap-1.5 xl:px-1.5"
                            title="Chat via WhatsApp"
                          >
                            <MessageCircle
                              className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>+{cleanPhone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400">-</span>
                        )}
                      </td>

                      {/* Bengkel / Mitra */}
                      <td className="px-2.5 py-3.5 align-middle xl:px-4">
                        {c.workshopName ? (
                          <span className="inline-flex max-w-[130px] items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 xl:max-w-none xl:gap-1.5 xl:px-2.5 xl:text-[11px]">
                            <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{c.workshopName}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 xl:text-xs">
                            Perorangan
                          </span>
                        )}
                      </td>

                      {/* Unit Kendaraan */}
                      <td className="px-2.5 py-3.5 align-middle xl:px-4">
                        <div className="flex max-w-[165px] flex-wrap gap-1 xl:max-w-[230px] xl:gap-1.5">
                          {c.vehicles.length > 0 ? (
                            <>
                              {c.vehicles.slice(0, 2).map((v) => (
                                <span
                                  key={v.id}
                                  className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-0.5 text-[10px] font-semibold leading-snug text-slate-800 dark:bg-white/[0.08] dark:text-slate-200 xl:text-[11px]"
                                >
                                  <Car
                                    className="h-3 w-3 shrink-0 text-slate-600 dark:text-slate-400"
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {v.brand} {v.model}
                                  </span>
                                  {v.plateNumber && (
                                    <span className="shrink-0 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                                      ({v.plateNumber})
                                    </span>
                                  )}
                                </span>
                              ))}
                              {c.vehicles.length > 2 && (
                                <span className="inline-flex items-center rounded-lg bg-black/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/[0.08] dark:text-slate-300 xl:text-[11px]">
                                  +{c.vehicles.length - 2} unit
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 dark:text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Riwayat Servis & Aksi Cepat */}
                      <td className="whitespace-nowrap px-2.5 py-3.5 text-right align-middle xl:px-4">
                        <div className="inline-flex items-center justify-end gap-1 xl:gap-1.5">
                          <Link
                            href={newServiceHref}
                            prefetch={true}
                            onClick={(e) => e.stopPropagation()}
                            title={`Tambah unit servis baru untuk ${c.name}`}
                            aria-label={`Tambah unit servis baru untuk ${c.name}`}
                            className="ios-glass-inner inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10 xl:h-11 xl:w-11"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            href={detailHref}
                            prefetch={true}
                            onClick={(e) => e.stopPropagation()}
                            title={`Lihat profil & riwayat ${c.name}`}
                            aria-label={`Lihat profil dan ${c._count.serviceOrders} riwayat ${c.name}`}
                            className="ios-glass-inner inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2.5 text-xs font-bold text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10 xl:min-h-[44px] xl:gap-2 xl:px-3.5"
                          >
                            <span className="font-mono tabular-nums">
                              {c._count.serviceOrders}
                            </span>
                            <Eye
                              className="h-4 w-4 text-slate-600 dark:text-slate-300"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
