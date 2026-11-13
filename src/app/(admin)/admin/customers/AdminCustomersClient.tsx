'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CustomerType } from '@prisma/client';
import { CustomerForm } from './CustomerForm';
import {
  PARTNER_WORKSHOPS,
  normalizePhone,
  normalizeWorkshopName,
} from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { getStatusMeta } from '@/lib/status';
import { formatRupiah } from '@/lib/utils';
import {
  Search,
  ExternalLink,
  Eye,
  X,
  MessageCircle,
  Car,
  Wrench,
  Building2,
  Check,
  Save,
} from 'lucide-react';

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

export function AdminCustomersClient({ customers: initialCustomers }: { customers: CustomerRow[] }) {
  const { orders, customers, upsertCustomer } = useDataset(undefined, initialCustomers);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CustomerType>('ALL');
  const [workshopFilter, setWorkshopFilter] = useState<'ALL' | string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [editWorkshop, setEditWorkshop] = useState<string>(PARTNER_WORKSHOPS[0]);
  const [editAddress, setEditAddress] = useState('');
  const [customerSaved, setCustomerSaved] = useState(false);

  const openCustomerDetail = (c: CustomerRow) => {
    setSelectedCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditType(c.type);
    setEditWorkshop(normalizeWorkshopName(c.workshopName, CustomerType.MITRA) || PARTNER_WORKSHOPS[0]);
    setEditAddress(c.address || '');
    setCustomerSaved(false);
  };

  useEffect(() => {
    if (!selectedCustomer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCustomer(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCustomer]);

  // Pastikan setiap unit/pelanggan masuk dengan nama berbeda otomatis terdaftar di tabel pelanggan
  const allCustomers = useMemo(() => {
    const map = new Map<string, CustomerRow>();

    for (const c of customers) {
      const k = c.name.trim().toLowerCase() || c.id;
      map.set(k, { ...c, vehicles: [...c.vehicles] });
    }

    for (const ord of orders) {
      const cleanName = (ord.customerName || '').trim();
      const nKey = cleanName.toLowerCase();
      if (!nKey) continue;

      const existing = map.get(nKey);
      if (existing) {
        if (ord.vehicleBrand || ord.vehicleModel) {
          const hasVeh = existing.vehicles.some((v) => {
            const samePlate =
              ord.plateNumber &&
              v.plateNumber &&
              ord.plateNumber.trim().toUpperCase() === v.plateNumber.trim().toUpperCase();
            const sameModel =
              v.brand.toLowerCase() === ord.vehicleBrand.toLowerCase() &&
              v.model.toLowerCase() === ord.vehicleModel.toLowerCase();
            return samePlate || sameModel;
          });
          if (!hasVeh) {
            existing.vehicles.push({
              id: `veh-${ord.id}`,
              brand: ord.vehicleBrand,
              model: ord.vehicleModel,
              year: ord.vehicleYear,
              plateNumber: ord.plateNumber || null,
            });
          }
        }
      } else {
        map.set(nKey, {
          id: `cust-${ord.id}`,
          name: cleanName,
          phone: ord.customerPhone || '',
          type: ord.customerType || CustomerType.PERORANGAN,
          workshopName: ord.workshopName || null,
          address: null,
          vehicles:
            ord.vehicleBrand || ord.vehicleModel
              ? [
                  {
                    id: `veh-${ord.id}`,
                    brand: ord.vehicleBrand,
                    model: ord.vehicleModel,
                    year: ord.vehicleYear,
                    plateNumber: ord.plateNumber || null,
                  },
                ]
              : [],
          _count: { serviceOrders: 1 },
        });
      }
    }

    // Hitung riwayat servis real-time berdasarkan pesanan aktif
    return Array.from(map.values()).map((cust) => {
      const custName = cust.name.trim().toLowerCase();
      const custPhone = normalizePhone(cust.phone);
      const count = orders.filter((ord) => {
        const ordName = (ord.customerName || '').trim().toLowerCase();
        if (ordName === custName) return true;
        const ordPhone = normalizePhone(ord.customerPhone);
        return Boolean(custPhone && ordPhone && ordPhone === custPhone);
      }).length;

      return {
        ...cust,
        _count: { serviceOrders: Math.max(cust._count?.serviceOrders || 0, count) },
      };
    });
  }, [customers, orders]);

  const filtered = useMemo(() => {
    return allCustomers.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (workshopFilter !== 'ALL' && c.workshopName !== workshopFilter) return false;
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

  // Cari servis yang berelasi dengan pelanggan yang dipilih
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const targetPhone = normalizePhone(selectedCustomer.phone);
    const targetName = selectedCustomer.name.trim().toLowerCase();
    return orders.filter((ord) => {
      const ordName = (ord.customerName || '').trim().toLowerCase();
      if (ordName === targetName) return true;
      const ordPhone = normalizePhone(ord.customerPhone);
      return Boolean(targetPhone && ordPhone && ordPhone === targetPhone);
    });
  }, [orders, selectedCustomer]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const updated = await upsertCustomer({
      id: selectedCustomer.id,
      previousPhone: selectedCustomer.phone,
      name: editName.trim() || selectedCustomer.name,
      phone: editPhone.trim() || selectedCustomer.phone,
      type: editType,
      workshopName: editType === CustomerType.MITRA ? editWorkshop : null,
      address: editAddress.trim() || null,
    });

    const cleanTargetPhone = normalizePhone(editPhone.trim() || selectedCustomer.phone);
    const refreshed =
      updated.customers.find((c) => normalizePhone(c.phone) === cleanTargetPhone) ||
      updated.customers.find((c) => c.id === selectedCustomer.id) ||
      null;
    if (refreshed) {
      setSelectedCustomer(refreshed);
    }
    setCustomerSaved(true);
    setTimeout(() => setCustomerSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Data Pelanggan & Unit
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Daftar pelanggan dan unit kendaraan/modul terdaftar.
          </p>
        </div>
        <CustomerForm />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 'ALL', label: 'Semua' },
            { key: CustomerType.PERORANGAN, label: 'Perorangan' },
            { key: CustomerType.MITRA, label: 'Bengkel Mitra' },
          ].map((tab) => {
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

          <select
            aria-label="Filter bengkel mitra"
            value={workshopFilter}
            onChange={(e) => {
              const val = e.target.value;
              setWorkshopFilter(val);
              if (val !== 'ALL') setTypeFilter(CustomerType.MITRA);
            }}
            className="h-10 shrink-0 rounded-full border border-black/[0.06] bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200"
          >
            <option value="ALL">Semua Bengkel Mitra</option>
            {PARTNER_WORKSHOPS.map((w) => (
              <option key={w} value={w}>
                Mitra: {w}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
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
            className="mt-4 inline-flex min-h-[40px] items-center rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        /* Tabel Pelanggan (Desktop & Mobile) */
        <div className="ios-glass-card overflow-hidden rounded-[26px] shadow-sm">
          {/* Mobile Card List */}
          <div className="divide-y divide-black/[0.05] md:hidden dark:divide-white/[0.06]">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => openCustomerDetail(c)}
                className="cursor-pointer space-y-2.5 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h2>
                    {c.workshopName ? (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        <Building2 className="h-3 w-3" />
                        <span>{c.workshopName}</span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {c.address || 'Pelanggan Perorangan'}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCustomerDetail(c);
                    }}
                    title={`Lihat detail & riwayat ${c._count.serviceOrders} servis`}
                    className="ios-glass-inner inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold text-slate-800 dark:text-white"
                  >
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    <span>{c._count.serviceOrders}x Servis</span>
                  </button>
                </div>

                {c.phone && (
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    +{normalizePhone(c.phone)}
                  </p>
                )}

                {c.vehicles.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {c.vehicles.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-300"
                      >
                        <Car className="h-3 w-3 text-slate-400" />
                        <span>{v.brand} {v.model}</span>
                        {v.plateNumber && <span>({v.plateNumber})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Structured Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-5 py-3.5">Pelanggan</th>
                  <th className="px-5 py-3.5">Kontak</th>
                  <th className="px-5 py-3.5">Bengkel / Mitra</th>
                  <th className="px-5 py-3.5">Kendaraan Terdaftar</th>
                  <th className="px-5 py-3.5 text-right">Riwayat Servis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCustomerDetail(c)}
                    className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    {/* Pelanggan */}
                    <td className="px-5 py-3.5 align-middle">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </p>
                      {c.address ? (
                        <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {c.address}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {c.workshopName ? `Mitra ${c.workshopName}` : 'Pelanggan Terdaftar'}
                        </p>
                      )}
                    </td>

                    {/* Kontak */}
                    <td className="whitespace-nowrap px-5 py-3.5 align-middle font-mono text-slate-700 dark:text-slate-300">
                      {c.phone ? (
                        <a
                          href={`https://wa.me/${normalizePhone(c.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Chat via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+{normalizePhone(c.phone)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Bengkel / Mitra */}
                    <td className="px-5 py-3.5 align-middle">
                      {c.workshopName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                          <Building2 className="h-3 w-3" />
                          <span>{c.workshopName}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">-</span>
                      )}
                    </td>

                    {/* Unit Kendaraan */}
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {c.vehicles.length > 0 ? (
                          c.vehicles.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-white/[0.08] dark:text-slate-200"
                            >
                              <Car className="h-3 w-3 text-slate-400" />
                              <span>{v.brand} {v.model}</span>
                              {v.plateNumber && (
                                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                  ({v.plateNumber})
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Riwayat Servis (Icon mata dengan angka servis, klik untuk buka detail) */}
                    <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomerDetail(c);
                        }}
                        title={`Buka detail riwayat servis ${c.name}`}
                        aria-label={`Buka detail riwayat servis ${c.name}`}
                        className="ios-glass-inner inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                        <span>{c._count.serviceOrders}x Servis</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Sheet Detail Pelanggan */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-detail-title"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[32px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[28px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Bar (Mobile) */}
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="customer-detail-title"
                    className="text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedCustomer.type === CustomerType.MITRA
                        ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300'
                        : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {selectedCustomer.type === CustomerType.MITRA ? 'Bengkel Mitra' : 'Perorangan'}
                  </span>
                </div>
                {selectedCustomer.workshopName && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{selectedCustomer.workshopName}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Tutup detail pelanggan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Contact & Editable Info Form (Sinkron ke Servis & Dataset) */}
            <div className="mt-4 space-y-3.5">
              {customerSaved && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Data pelanggan &amp; mitra berhasil disimpan serta disinkronkan!</span>
                </div>
              )}

              <form
                onSubmit={handleSaveCustomer}
                className="rounded-2xl bg-[#F2F2F7] p-4 text-xs dark:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Edit &amp; Sinkronkan Profil Pelanggan
                  </p>
                  <a
                    href={`https://wa.me/${selectedCustomer.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Chat WA</span>
                  </a>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tipe Pelanggan
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as CustomerType)}
                      className="mt-1 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                    >
                      <option value={CustomerType.PERORANGAN}>Perorangan</option>
                      <option value={CustomerType.MITRA}>Bengkel Mitra</option>
                    </select>
                  </div>

                  {editType === CustomerType.MITRA && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Bengkel Mitra (Dropdown)
                      </label>
                      <select
                        value={editWorkshop}
                        onChange={(e) => setEditWorkshop(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                      >
                        {PARTNER_WORKSHOPS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={editType === CustomerType.MITRA ? 'sm:col-span-2' : ''}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Alamat
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Alamat singkat pelanggan / mitra"
                      className="mt-1 h-9 w-full rounded-xl border border-black/[0.06] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[11px] font-bold text-white tap-bounce dark:bg-white dark:text-black"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>

              {/* Registered Vehicles */}
              <div className="rounded-2xl bg-[#F2F2F7] p-4 text-xs dark:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kendaraan & Unit ({selectedCustomer.vehicles.length})
                  </p>
                </div>
                <div className="mt-2.5 space-y-2">
                  {selectedCustomer.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs dark:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {v.brand} {v.model}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {v.year ? `Tahun ${v.year}` : 'Unit Terdaftar'}
                          </p>
                        </div>
                      </div>
                      {v.plateNumber && (
                        <span className="rounded-lg bg-[#F2F2F7] px-2.5 py-1 font-mono font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                          {v.plateNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Orders History */}
              <div className="rounded-2xl bg-[#F2F2F7] p-4 text-xs dark:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Riwayat Servis Unit ({selectedCustomer._count.serviceOrders}x)
                  </p>
                  <Link
                    href={`/admin/services?search=${encodeURIComponent(selectedCustomer.name)}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <span>Buka di Servis</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-2.5 space-y-2">
                  {customerOrders.length > 0 ? (
                    customerOrders.map((ord) => {
                      const primary = ord.items[0];
                      const meta = primary ? getStatusMeta(primary.status) : null;
                      const totalBilling = ord.charges.reduce((s, c) => s + c.qty * c.unitPrice, 0);

                      return (
                        <Link
                          key={ord.id}
                          href={`/admin/services?order=${ord.id}`}
                          className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs transition-colors hover:bg-slate-50 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                #{ord.code}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {ord.vehicleBrand} {ord.vehicleModel}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {primary?.moduleName || 'Servis Modul'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatRupiah(totalBilling)}
                            </span>
                            {meta && (
                              <div className="mt-0.5">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                                >
                                  {meta.shortLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="rounded-xl bg-white p-3 text-center text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                      Terdapat {selectedCustomer._count.serviceOrders} transaksi servis tercatat.
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Link to Servis Page Filtered */}
              <Link
                href={`/admin/services?search=${encodeURIComponent(selectedCustomer.name)}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Wrench className="h-4 w-4" />
                <span>Lihat Semua Servis {selectedCustomer.name} di Halaman Servis</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
