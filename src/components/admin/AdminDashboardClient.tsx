'use client';

import Link from 'next/link';
import { CustomerType, EntryMethod, IntakeType, ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockServiceOrder, SparepartItem } from '@/lib/frontend-mock';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Plus,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Package,
} from 'lucide-react';

interface AdminDashboardClientProps {
  totalActive: number;
  totalCustomers: number;
  totalModules: number;
  statusCounts: Record<string, number>;
  recentOrders: MockServiceOrder[];
  lowStockParts: SparepartItem[];
}

function getOrderTotal(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

function getOrderPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, pay) => sum + pay.amount, 0);
}

function getIntakeLabel(order: MockServiceOrder): string {
  if (order.unitCategory === 'GENSET_INDUSTRI') return 'Genset';
  if (order.entryMethod === EntryMethod.EKSPEDISI) return 'Ekspedisi';
  return order.intakeType === IntakeType.MOBIL_UTUH ? 'Mobil Utuh' : 'Modul Saja';
}

function getShortModuleName(moduleName: string): string {
  const firstPart = moduleName.split(/[\s/(]+/)[0];
  return firstPart || moduleName;
}

export function AdminDashboardClient({
  totalActive,
  totalCustomers,
  statusCounts,
  recentOrders,
}: AdminDashboardClientProps) {
  const allItems = recentOrders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
    }))
  );

  const totalActiveModules =
    allItems.filter(
      ({ item }) => item.status !== ItemStatus.SELESAI && item.status !== ItemStatus.BATAL
    ).length || Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  const mobilUtuhCount = recentOrders.filter(
    (o) => o.unitCategory !== 'GENSET_INDUSTRI' && o.intakeType === IntakeType.MOBIL_UTUH
  ).length;
  const modulSajaCount = recentOrders.filter(
    (o) => o.unitCategory !== 'GENSET_INDUSTRI' && o.intakeType === IntakeType.MODUL_SAJA
  ).length;
  const gensetCount = recentOrders.filter((o) => o.unitCategory === 'GENSET_INDUSTRI').length;

  const siapCount = statusCounts[ItemStatus.SIAP_DIAMBIL] || 0;
  const qcCount = statusCounts[ItemStatus.UJI_QC] || 0;

  const readyOrQcUnits = allItems
    .filter(
      ({ item }) => item.status === ItemStatus.SIAP_DIAMBIL || item.status === ItemStatus.UJI_QC
    )
    .slice(0, 2)
    .map(({ order, item }) => `#${order.code} ${getStatusMeta(item.status).shortLabel}`);

  const totalEstimatedRevenue = recentOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalPaid = recentOrders.reduce((sum, order) => sum + getOrderPaid(order), 0);
  const totalUnpaid = Math.max(0, totalEstimatedRevenue - totalPaid);
  const paidPercentage =
    totalEstimatedRevenue > 0 ? Math.min(100, Math.round((totalPaid / totalEstimatedRevenue) * 100)) : 0;

  const peroranganCount = recentOrders.filter((o) => o.customerType === CustomerType.PERORANGAN).length;
  const mitraCount = recentOrders.filter((o) => o.customerType === CustomerType.MITRA).length;

  const readyAlerts = allItems
    .filter(({ item }) => item.status === ItemStatus.SIAP_DIAMBIL)
    .map(({ order, item }) => ({
      id: `ready-${item.id}`,
      orderId: order.id,
      code: order.code,
      title: `${order.vehicleBrand} ${order.vehicleModel}`,
      detail: `${getShortModuleName(item.moduleName)} siap diambil / dikirim (${order.customerName})`,
      tone: 'emerald' as const,
    }));

  const sparepartAlerts = allItems
    .filter(({ item }) => item.status === ItemStatus.MENUNGGU_SPAREPART)
    .map(({ order, item }) => ({
      id: `part-${item.id}`,
      orderId: order.id,
      code: order.code,
      title: `${order.vehicleBrand} ${order.vehicleModel}`,
      detail: `Tunggu komponen: ${item.moduleName}`,
      tone: 'amber' as const,
    }));

  const billingAlerts = recentOrders
    .filter((order) => {
      const total = getOrderTotal(order);
      const paid = getOrderPaid(order);
      return total > 0 && total - paid > 0;
    })
    .slice(0, 2)
    .map((order) => {
      const remaining = getOrderTotal(order) - getOrderPaid(order);
      return {
        id: `bill-${order.id}`,
        orderId: order.id,
        code: order.code,
        title: `${order.customerName} (${order.vehicleModel})`,
        detail: `Sisa tagihan berjalan ${formatRupiah(remaining)}`,
        tone: 'blue' as const,
      };
    });

  const priorityActions = [...readyAlerts, ...sparepartAlerts, ...billingAlerts].slice(0, 4);

  const monthlyVisitors = [
    { label: 'Jun', visitors: 5, perorangan: 3, mitra: 2 },
    { label: 'Jul', visitors: 7, perorangan: 4, mitra: 3 },
    { label: 'Agu', visitors: 6, perorangan: 4, mitra: 2 },
    { label: 'Sep', visitors: 8, perorangan: 4, mitra: 4 },
    { label: 'Okt', visitors: 9, perorangan: 5, mitra: 4 },
    {
      label: 'Nov',
      visitors: Math.max(recentOrders.length, 5),
      perorangan: peroranganCount,
      mitra: mitraCount,
    },
  ];
  const maxVisitors = Math.max(...monthlyVisitors.map((m) => m.visitors), 1);
  const totalSixMonthVisitors = monthlyVisitors.reduce((sum, m) => sum + m.visitors, 0);
  const avgMonthlyVisitors = Math.round(totalSixMonthVisitors / monthlyVisitors.length);
  const peakMonth = monthlyVisitors.reduce(
    (best, cur) => (cur.visitors > best.visitors ? cur : best),
    monthlyVisitors[0]
  );

  return (
    <div className="space-y-4">
      {/* Header & Primary Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Dashboard Operasional
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Ringkasan antrean unit, tahapan modul di meja teknisi, dan status tagihan berjalan.
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <Link
            href="/admin/services?new=1"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-md transition-transform hover:bg-slate-800 tap-bounce dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Unit Servis</span>
          </Link>
        </div>
      </div>

      {/* Compact 4-Card KPI Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Link
          href="/admin/services"
          className="ios-glass-card flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Antrean Aktif
            </span>
            <span className="shrink-0 rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {totalActiveModules} Modul
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black tabular-nums text-slate-900 dark:text-white sm:text-2xl">
            {totalActive} Unit
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
            {mobilUtuhCount} Mobil · {modulSajaCount} Modul · {gensetCount} Genset
          </p>
        </Link>

        <Link
          href="/admin/services?status=SIAP_DIAMBIL"
          className="ios-glass-card flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Siap Diambil
            </span>
            <span className="shrink-0 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              {qcCount} Uji &amp; QC
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">
            {siapCount} Siap
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
            {readyOrQcUnits.length > 0 ? readyOrQcUnits.join(' · ') : 'Belum ada unit siap'}
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="ios-glass-card flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tagihan Berjalan
            </span>
            <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-blue-700 dark:text-blue-300">
              {paidPercentage}% Masuk
            </span>
          </div>
          <p className="mt-1.5 truncate text-lg font-black tabular-nums text-slate-900 dark:text-white sm:text-xl">
            {formatRupiah(totalEstimatedRevenue)}
          </p>
          <div className="mt-1.5 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.1]">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-400"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <p className="truncate text-[10px] text-slate-600 dark:text-slate-400">
              DP/Lunas {formatRupiah(totalPaid)} · Sisa {formatRupiah(totalUnpaid)}
            </p>
          </div>
        </Link>

        <Link
          href="/admin/customers"
          className="ios-glass-card flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Pelanggan Aktif
            </span>
            <span className="shrink-0 rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {mitraCount} Mitra
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black tabular-nums text-slate-900 dark:text-white sm:text-2xl">
            {totalCustomers} Data
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
            {peroranganCount} Perorangan · {mitraCount} Bengkel Mitra
          </p>
        </Link>
      </div>

      {/* Two-Column Operational Workspace */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Detailed Active Orders */}
        <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Unit Dalam Penanganan
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Klik unit untuk edit progres teknisi, modul, dan tagihan
              </p>
            </div>
            <Link
              href="/admin/services"
              className="shrink-0 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Semua ({recentOrders.length})
            </Link>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {recentOrders.map((order) => {
              const total = getOrderTotal(order);
              const paid = getOrderPaid(order);
              const isPaidFull = total > 0 && paid >= total;
              const isPartial = total > 0 && paid > 0 && paid < total;
              const primaryComplaint =
                order.items[0]?.complaint || order.conditionNotes || 'Pemeriksaan modul';

              return (
                <Link
                  key={order.id}
                  href={`/admin/services?orderId=${order.id}`}
                  className="block py-3 transition-colors first:pt-1 last:pb-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  {/* Top Row: Code, Unit Name, Plate, Intake Type */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                        #{order.code}
                      </span>
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {order.vehicleBrand} {order.vehicleModel}
                        {order.vehicleYear ? ` (${order.vehicleYear})` : ''}
                      </span>
                      {order.plateNumber && (
                        <span className="rounded-md border border-black/[0.08] bg-black/[0.03] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-slate-300">
                          {order.plateNumber}
                        </span>
                      )}
                      <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                        {getIntakeLabel(order)}
                      </span>
                    </div>

                    <ArrowUpRight
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Middle Row: Modules + Status Badges & Complaint */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {order.items.map((item) => {
                      const meta = getStatusMeta(item.status);
                      return (
                        <span
                          key={item.id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                          <span>
                            {getShortModuleName(item.moduleName)}: {meta.shortLabel}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-1.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {primaryComplaint}
                  </p>

                  {/* Bottom Row: Customer, Target Date, Billing Progress */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {order.customerName}
                      </span>
                      {order.customerType === CustomerType.MITRA && order.workshopName && (
                        <span className="hidden truncate rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] dark:bg-white/[0.08] sm:inline">
                          {order.workshopName}
                        </span>
                      )}
                      {order.estimatedDoneAt && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Target {formatDate(order.estimatedDoneAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {total > 0 ? formatRupiah(total) : 'Estimasi -'}
                      </span>
                      {isPaidFull && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Lunas
                        </span>
                      )}
                      {isPartial && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          DP {formatRupiah(paid)}
                        </span>
                      )}
                      {total > 0 && paid === 0 && (
                        <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Right: Priority Action Queue & Technician Log Feed */}
        <div className="space-y-4 lg:col-span-5">
          {/* Panel A: Prioritas Tindak Lanjut */}
          <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Prioritas Tindak Lanjut
              </h2>
              <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {priorityActions.length} Item
              </span>
            </div>

            {priorityActions.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semua unit berjalan normal tanpa antrean tertunda.
              </p>
            ) : (
              <div className="space-y-2">
                {priorityActions.map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/admin/services?orderId=${alert.orderId}`}
                    className="ios-glass-inner flex items-start gap-2.5 rounded-2xl p-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <div className="mt-0.5 shrink-0">
                      {alert.tone === 'emerald' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      )}
                      {alert.tone === 'amber' && (
                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      )}
                      {alert.tone === 'blue' && (
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">
                          #{alert.code}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                          {alert.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {alert.detail}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Panel B: Diagram Batang Kepadatan Pengunjung Bulanan */}
          <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kepadatan Pengunjung Bulanan
                  </h2>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  Tren jumlah kedatangan unit &amp; pelanggan dari bulan ke bulan
                </p>
              </div>
              <Link
                href="/admin/reports"
                className="shrink-0 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Detail laporan
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-6 items-end gap-2">
              {monthlyVisitors.map((m, idx) => {
                const heightPct = Math.max(14, Math.round((m.visitors / maxVisitors) * 100));
                const isLatest = idx === monthlyVisitors.length - 1;
                return (
                  <div key={m.label} className="flex min-w-0 flex-col items-center">
                    <span className="mb-1 font-mono text-[11px] font-black tabular-nums text-slate-900 dark:text-white">
                      {m.visitors}
                    </span>
                    <div className="flex h-32 w-full items-end justify-center rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06] sm:h-36">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isLatest
                            ? 'bg-emerald-600 dark:bg-emerald-400'
                            : 'bg-slate-900/80 dark:bg-white/80'
                        }`}
                        title={`${m.label}: ${m.visitors} kunjungan (${m.mitra} Mitra, ${m.perorangan} Perorangan)`}
                      />
                    </div>
                    <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {m.label}
                    </span>
                    <span className="truncate font-mono text-[9px] text-slate-500 dark:text-slate-400">
                      {m.mitra}M·{m.perorangan}P
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] px-3 py-2 text-[11px] dark:bg-white/[0.04]">
              <span className="text-slate-600 dark:text-slate-300">
                Total 6 bln:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {totalSixMonthVisitors} unit
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Puncak:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {peakMonth.label} ({peakMonth.visitors})
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Rata-rata:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {avgMonthlyVisitors}/bln
                </strong>
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
