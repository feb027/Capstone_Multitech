'use client';

import Link from 'next/link';
import { ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockServiceOrder, SparepartItem } from '@/lib/frontend-mock';
import { formatRupiah } from '@/lib/utils';
import { Plus, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface AdminDashboardClientProps {
  totalActive: number;
  totalCustomers: number;
  totalModules: number;
  statusCounts: Record<string, number>;
  recentOrders: MockServiceOrder[];
  lowStockParts: SparepartItem[];
}

const PIPELINE_KEYS: ItemStatus[] = [
  ItemStatus.DITERIMA,
  ItemStatus.DIAGNOSA,
  ItemStatus.MENUNGGU_SPAREPART,
  ItemStatus.PERBAIKAN,
  ItemStatus.UJI_QC,
  ItemStatus.SIAP_DIAMBIL,
];

function getOrderTotal(order: MockServiceOrder): number {
  return order.charges.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export function AdminDashboardClient({
  totalActive,
  totalCustomers,
  totalModules,
  statusCounts,
  recentOrders,
  lowStockParts,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Operasional
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Ringkasan antrean servis, tahapan teknisi, dan ketersediaan suku cadang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/reports"
            className="inline-flex min-h-[44px] items-center rounded-full border border-black/[0.06] bg-white px-4 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-[#2C2C2E]"
          >
            Rekap Laporan
          </Link>
          <Link
            href="/admin/services?new=1"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Terima Unit Servis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Antrean Aktif
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalActive}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Siap Diambil
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {statusCounts[ItemStatus.SIAP_DIAMBIL] || 0}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Pelanggan
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalCustomers}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Jenis Modul
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalModules}
          </p>
        </div>
      </div>

      {/* Pipeline Status */}
      <section className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Alur Status Unit
          </h2>
          <Link
            href="/admin/services"
            className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Buka semua unit
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
          {PIPELINE_KEYS.map((status) => {
            const meta = getStatusMeta(status);
            const count = statusCounts[status] || 0;
            return (
              <Link
                key={status}
                href={`/admin/services?status=${status}`}
                className="flex flex-col justify-between rounded-2xl bg-[#F2F2F7] p-3.5 transition-colors hover:bg-slate-200/70 tap-bounce dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {meta.shortLabel}
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {count}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Antrean Terbaru & Stok Kritis */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E] lg:col-span-2">
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Unit Masuk Terbaru
            </h2>
            <Link
              href="/admin/services"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              <span>Kelola servis</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentOrders.slice(0, 5).map((order) => {
              const primaryItem = order.items[0];
              const meta = getStatusMeta(primaryItem.status);
              const total = getOrderTotal(order);
              return (
                <Link
                  key={order.id}
                  href={`/admin/services?order=${order.id}`}
                  className="flex flex-col justify-between gap-2 rounded-2xl bg-[#F2F2F7] p-3.5 transition-colors hover:bg-slate-200/70 sm:flex-row sm:items-center dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {order.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {order.vehicleBrand} {order.vehicleModel}
                      </span>
                      {order.plateNumber && (
                        <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                          {order.plateNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400">
                      {order.customerName} | {primaryItem.moduleName} ({primaryItem.complaint})
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatRupiah(total)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                      {meta.shortLabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Peringatan Stok Kritis */}
        <section className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Stok Menipis</span>
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Cek gudang
            </Link>
          </div>

          {lowStockParts.length === 0 ? (
            <div className="rounded-2xl bg-[#F2F2F7] p-4 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
              Semua stok suku cadang dalam batas aman.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockParts.map((part) => (
                <div
                  key={part.id}
                  className="rounded-2xl bg-amber-500/10 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {part.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {part.sku}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      Sisa {part.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
