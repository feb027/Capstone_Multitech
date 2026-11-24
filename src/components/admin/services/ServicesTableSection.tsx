'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';
import { ItemStatus } from '@prisma/client';
import { MockServiceOrder } from '@/lib/frontend-mock';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Search,
  X,
  Check,
  Copy,
  SlidersHorizontal,
  Eye,
  Pencil,
} from 'lucide-react';
import {
  STATUS_FILTER_OPTIONS,
  calcTotalPaid,
  calcTotalCharges,
  getActiveWorkInfo,
} from './service-utils';

export interface ServicesTableSectionProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  statusFilter: 'ALL' | ItemStatus;
  setStatusFilter: Dispatch<SetStateAction<'ALL' | ItemStatus>>;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  filterDropdownRef: RefObject<HTMLDivElement | null>;
  filteredOrders: MockServiceOrder[];
  copiedId: string | null;
  copyCode: (code: string) => void;
  handleOpenDetail: (order: MockServiceOrder, mode?: 'DETAIL' | 'EDIT') => void;
}

export function ServicesTableSection({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  isFilterOpen,
  setIsFilterOpen,
  filterDropdownRef,
  filteredOrders,
  copiedId,
  copyCode,
  handleOpenDetail,
}: ServicesTableSectionProps) {
  return (
    <>
      {/* Unified Search Bar dengan Icon Filter di Sisi Kanan */}
      <div ref={filterDropdownRef} className="relative z-30">
        <div className="ios-glass-card flex h-12 items-center rounded-2xl pl-3.5 pr-1.5 transition-shadow focus-within:ring-2 focus-within:ring-black/15 dark:focus-within:ring-white/25">
          <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-300" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              statusFilter === 'ALL'
                ? 'Cari kode servis, pelanggan, mobil, genset, plat, atau keluhan...'
                : `Cari di status ${STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter)?.label || ''}...`
            }
            aria-label="Cari antrean servis"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:text-white dark:placeholder-zinc-400"
          />
  
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
  
          <div className="mx-1 h-5 w-px shrink-0 bg-black/[0.08] dark:bg-white/[0.12]" aria-hidden="true" />
  
          {/* Tombol Filter di Sisi Kanan Search Bar */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-label={`Filter status (${STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua'})`}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors transition-transform tap-bounce ${
              statusFilter !== 'ALL' || isFilterOpen
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {statusFilter !== 'ALL' && (
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C9182B] dark:bg-[#EF4444]"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
  
        {/* Dropdown Menu Filter Status */}
        {isFilterOpen && (
          <div
            role="listbox"
            aria-label="Pilih filter status servis"
            className="ios-glass-card absolute right-0 top-[calc(100%+6px)] z-40 w-56 space-y-1 rounded-2xl p-1.5 shadow-2xl animate-popover-in"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setIsFilterOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
  
      {/* Tabel Data Servis */}
      {filteredOrders.length === 0 ? (
        <div className="ios-glass-card rounded-[28px] p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Tidak ada unit servis yang sesuai
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Coba ubah kata kunci pencarian atau reset filter status.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-4 inline-flex min-h-[42px] items-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-black"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="ios-glass-card overflow-hidden rounded-[26px] shadow-sm">
          {/* Tampilan Tabel Desktop (Ringkas, Rapih, Tidak Menumpuk) */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-4 py-3.5">Kode &amp; Masuk</th>
                  <th className="px-4 py-3.5">Unit Servis</th>
                  <th className="px-4 py-3.5">Pelanggan</th>
                  <th className="px-4 py-3.5">Tahap Pengerjaan</th>
                  <th className="px-4 py-3.5 text-right">Tagihan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filteredOrders.map((order) => {
                  const { activeItem, workText } = getActiveWorkInfo(order);
                  const totalCharges = calcTotalCharges(order);
                  const totalPaid = calcTotalPaid(order);
                  const isPaidFull = totalCharges > 0 && totalPaid >= totalCharges;
                  const isPartial = totalCharges > 0 && totalPaid > 0 && totalPaid < totalCharges;
  
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order, 'DETAIL')}
                      className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      {/* Col 1: Kode & Tanggal */}
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                            #{order.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCode(order.code);
                            }}
                            title="Salin Kode Nota"
                            aria-label={`Salin kode #${order.code}`}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            {copiedId === order.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(order.receivedAt)}
                        </p>
                      </td>
  
                      {/* Col 2: Unit Servis (Tanpa info bertumpuk) */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.vehicleBrand} {order.vehicleModel}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {order.plateNumber ||
                            (order.unitCategory === 'GENSET_INDUSTRI'
                              ? 'Unit Genset'
                              : 'Modul Lepasan')}
                        </p>
                      </td>
  
                      {/* Col 3: Pelanggan */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.customerName}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            order.workshopName
                              ? 'font-semibold text-blue-700 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {order.workshopName || 'Perorangan'}
                        </p>
                      </td>
  
                      {/* Col 4: Tahap Pengerjaan (Hanya pengerjaan teknisi yang sedang dilakukan tanpa status/badge) */}
                      <td className="max-w-[340px] px-4 py-3.5 align-middle">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {activeItem?.moduleName || 'Modul Servis'}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                          {workText}
                        </p>
                      </td>
  
                      {/* Col 5: Tagihan Ringkas */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {totalCharges > 0 ? formatRupiah(totalCharges) : '-'}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] font-bold ${
                            totalCharges === 0
                              ? 'text-slate-400'
                              : isPaidFull
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isPartial
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {totalCharges === 0
                            ? 'Belum ditagih'
                            : isPaidFull
                            ? 'Lunas'
                            : isPartial
                            ? 'DP Masuk'
                            : 'Belum Bayar'}
                        </p>
                      </td>
  
                      {/* Col 6: 2 Tombol Aksi Icon Only (Detail & Edit) */}
                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(order, 'DETAIL');
                            }}
                            title="Lihat Detail"
                            aria-label={`Lihat detail #${order.code}`}
                            className="ios-glass-inner inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(order, 'EDIT');
                            }}
                            title="Edit Servis"
                            aria-label={`Edit servis #${order.code}`}
                            className="ios-glass-inner inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tampilan Kartu List Mobile & Tablet */}
          <div className="divide-y divide-black/[0.05] lg:hidden dark:divide-white/[0.06]">
            {filteredOrders.map((order) => {
              const { activeItem, workText } = getActiveWorkInfo(order);
              const totalCharges = calcTotalCharges(order);

              return (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order, 'DETAIL')}
                  className="cursor-pointer space-y-2.5 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                          #{order.code}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {order.vehicleBrand} {order.vehicleModel}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
                        {order.customerName} · {order.workshopName || 'Perorangan'}
                      </p>
                    </div>
                  </div>

                  {/* Pengerjaan yang sedang dilakukan */}
                  <div className="rounded-xl bg-black/[0.02] p-2.5 dark:bg-white/[0.03]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {activeItem?.moduleName || 'Modul Servis'}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                      {workText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black/[0.05] pt-2.5 dark:border-white/[0.06]">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tagihan
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {totalCharges > 0 ? formatRupiah(totalCharges) : '-'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order, 'DETAIL');
                        }}
                        title="Lihat Detail"
                        aria-label={`Lihat detail #${order.code}`}
                        className="ios-glass-inner inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 dark:text-white"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order, 'EDIT');
                        }}
                        title="Edit Servis"
                        aria-label={`Edit servis #${order.code}`}
                        className="ios-glass-inner inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 dark:text-white"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
