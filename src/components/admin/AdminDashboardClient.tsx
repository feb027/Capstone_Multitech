'use client';

import Link from 'next/link';
import { ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockServiceOrder, SparepartItem } from '@/lib/frontend-mock';
import { formatRupiah } from '@/lib/utils';
import { Plus, ArrowUpRight } from 'lucide-react';

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
  statusCounts,
  recentOrders,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-5">
      {/* Header & Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Dashboard Operasional
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Ringkasan antrean servis dan tahapan penanganan teknisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/reports"
            className="ios-glass-inner inline-flex min-h-[44px] items-center rounded-full px-4 text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
          >
            Rekap Laporan
          </Link>
          <Link
            href="/admin/services?new=1"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-md transition-transform hover:bg-slate-800 tap-bounce dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Terima Unit Servis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Antrean Aktif
          </p>
          <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900 dark:text-white sm:text-3xl">
            {totalActive}
          </p>
        </div>

        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Siap Diambil
          </p>
          <p className="mt-1.5 text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-3xl">
            {statusCounts[ItemStatus.SIAP_DIAMBIL] || 0}
          </p>
        </div>

        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Pelanggan
          </p>
          <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-900 dark:text-white sm:text-3xl">
            {totalCustomers}
          </p>
        </div>
      </div>

      {/* Pipeline Status */}
      <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
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
                className="ios-glass-inner flex flex-col justify-between rounded-2xl p-3.5 transition-colors hover:bg-black/5 tap-bounce dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {meta.shortLabel}
                  </span>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                </div>
                <p className="mt-3 text-xl font-black tabular-nums text-slate-900 dark:text-white">
                  {count}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Servis Terbaru */}
      <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Penerimaan Unit Terbaru
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              5 unit terakhir yang masuk ke bengkel
            </p>
          </div>
          <Link
            href="/admin/services"
            className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Lihat semua
          </Link>
        </div>

        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          {recentOrders.map((order) => {
            const primaryItem = order.items[0];
            const meta = primaryItem
              ? getStatusMeta(primaryItem.status as ItemStatus)
              : null;
            const total = getOrderTotal(order);

            return (
              <Link
                key={order.id}
                href={`/admin/services?orderId=${order.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{order.code}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {order.vehicleBrand} {order.vehicleModel}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {order.customerName}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatRupiah(total)}
                    </p>
                    {meta && (
                      <span
                        className={`mt-0.5 inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                      >
                        {meta.shortLabel}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
