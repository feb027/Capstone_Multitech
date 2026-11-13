'use client';

import Link from 'next/link';
import { CustomerType, EntryMethod, IntakeType, ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockServiceOrder, SparepartItem } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { formatRupiah } from '@/lib/utils';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { GroupedBarChart } from './GroupedBarChart';

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

function getShortModuleName(moduleName: string): string {
  const firstPart = moduleName.split(/[\s/(]+/)[0];
  return firstPart || moduleName;
}

export function AdminDashboardClient({
  totalActive: initialTotalActive,
  totalCustomers: initialTotalCustomers,
  statusCounts: initialStatusCounts,
  recentOrders: initialOrders,
}: AdminDashboardClientProps) {
  const { orders, customers, isLoaded } = useDataset(initialOrders);
  const recentOrders = orders.length > 0 ? orders : initialOrders;
  const totalActive = isLoaded ? recentOrders.length : initialTotalActive || recentOrders.length;
  const totalCustomers = isLoaded ? customers.length : initialTotalCustomers || customers.length;

  const statusCounts: Record<string, number> = isLoaded ? {} : { ...initialStatusCounts };
  if (isLoaded) {
    for (const order of recentOrders) {
      for (const item of order.items) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      }
    }
  }

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
  const siapOrders = recentOrders.filter((o) =>
    o.items.some((item) => item.status === ItemStatus.SIAP_DIAMBIL)
  );
  const siapBengkelCount = siapOrders.filter((o) => o.entryMethod !== EntryMethod.EKSPEDISI).length;
  const siapEkspedisiCount = siapOrders.filter((o) => o.entryMethod === EntryMethod.EKSPEDISI).length;

  const totalEstimatedRevenue = recentOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalPaidAmount = recentOrders.reduce((sum, order) => sum + getOrderPaid(order), 0);
  const paidPercentage =
    totalEstimatedRevenue > 0 ? Math.round((totalPaidAmount / totalEstimatedRevenue) * 100) : 0;

  const lunasCount = recentOrders.filter((o) => {
    const total = getOrderTotal(o);
    const paid = getOrderPaid(o);
    return total > 0 && paid >= total;
  }).length;
  const dpCount = recentOrders.filter((o) => {
    const total = getOrderTotal(o);
    const paid = getOrderPaid(o);
    return paid > 0 && paid < total;
  }).length;
  const belumBayarCount = recentOrders.filter((o) => getOrderPaid(o) === 0).length;

  const peroranganCount = recentOrders.filter(
    (o) => o.customerType === CustomerType.PERORANGAN
  ).length;
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
    { label: 'Jun', visitors: 5 },
    { label: 'Jul', visitors: 7 },
    { label: 'Agu', visitors: 6 },
    { label: 'Sep', visitors: 8 },
    { label: 'Okt', visitors: 9 },
    { label: 'Nov', visitors: Math.max(recentOrders.length, 5) },
  ];
  const maxVisitors = Math.max(...monthlyVisitors.map((m) => m.visitors), 10);
  const visitorTopTick = Math.ceil(maxVisitors / 5) * 5;
  const visitorTicks = [0, 1, 2, 3, 4, 5].map((i) => Math.round((visitorTopTick / 5) * i));
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
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {qcCount} Uji &amp; QC
            </span>
          </div>
          <p className="mt-1.5 text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">
            {siapCount} Siap
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
            {siapBengkelCount} Ambil Bengkel · {siapEkspedisiCount} Kirim Paket
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
            <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              {paidPercentage}% Masuk
            </span>
          </div>
          <p className="mt-1.5 truncate text-lg font-black tabular-nums text-slate-900 dark:text-white sm:text-xl">
            {formatRupiah(totalEstimatedRevenue)}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
            {lunasCount} Lunas · {dpCount} DP · {belumBayarCount} Belum Bayar
          </p>
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
        {/* Left: Compact Active Orders Table */}
        <section className="ios-glass-card self-start rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Unit Dalam Penanganan
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Ringkasan antrean aktif, klik baris untuk detail &amp; edit
              </p>
            </div>
            <Link
              href="/admin/services"
              className="shrink-0 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Semua ({recentOrders.length})
            </Link>
          </div>

          <div className="hidden grid-cols-12 gap-2 border-b border-black/[0.06] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/[0.08] dark:text-slate-400 sm:grid">
            <span className="col-span-4">Unit</span>
            <span className="col-span-3">Pelanggan</span>
            <span className="col-span-3">Modul &amp; Status</span>
            <span className="col-span-2 text-right">Tagihan</span>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {recentOrders.map((order) => {
              const total = getOrderTotal(order);
              const paid = getOrderPaid(order);
              const isPaidFull = total > 0 && paid >= total;
              const isPartial = total > 0 && paid > 0 && paid < total;
              const primaryItem = order.items[0];
              const primaryMeta = primaryItem ? getStatusMeta(primaryItem.status) : null;
              const extraModuleCount = Math.max(0, order.items.length - 1);

              return (
                <Link
                  key={order.id}
                  href={`/admin/services?orderId=${order.id}`}
                  className="grid grid-cols-1 items-center gap-1.5 py-2.5 transition-colors first:pt-2 last:pb-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:grid-cols-12 sm:gap-2"
                >
                  {/* Col 1: Unit */}
                  <div className="min-w-0 sm:col-span-4">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                        #{order.code}
                      </span>
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {order.vehicleBrand} {order.vehicleModel}
                      </span>
                    </div>
                    {order.plateNumber && (
                      <p className="mt-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {order.plateNumber}
                      </p>
                    )}
                  </div>

                  {/* Col 2: Pelanggan */}
                  <div className="flex min-w-0 items-center justify-between gap-2 sm:col-span-3 sm:block">
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {order.customerName}
                    </p>
                    {order.customerType === CustomerType.MITRA && order.workshopName && (
                      <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                        {order.workshopName}
                      </p>
                    )}
                  </div>

                  {/* Col 3: Modul & Status */}
                  <div className="flex min-w-0 items-center gap-1 sm:col-span-3">
                    {primaryItem && primaryMeta && (
                      <span
                        className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-bold ${primaryMeta.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${primaryMeta.dotClass}`} />
                        <span className="truncate">
                          {getShortModuleName(primaryItem.moduleName)}: {primaryMeta.shortLabel}
                        </span>
                      </span>
                    )}
                    {extraModuleCount > 0 && (
                      <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/[0.1] dark:text-slate-300">
                        +{extraModuleCount}
                      </span>
                    )}
                  </div>

                  {/* Col 4: Tagihan */}
                  <div className="flex items-center justify-between sm:col-span-2 sm:flex-col sm:items-end sm:justify-center">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {total > 0 ? formatRupiah(total) : '-'}
                    </span>
                    {isPaidFull && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Lunas
                      </span>
                    )}
                    {isPartial && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        DP
                      </span>
                    )}
                    {total > 0 && paid === 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Belum Bayar
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Right: Monthly Visitor Chart (Top) & Priority Action Queue (Bottom) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Panel A (Top): Diagram Batang Kepadatan Pengunjung */}
          <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:p-5">
            <GroupedBarChart
              title="Diagram Kepadatan Pengunjung"
              yAxisLabel="Jumlah Pengunjung"
              xAxisLabel="Bulan"
              ticks={visitorTicks}
              series={[
                { key: 'visitors', label: 'Total Pengunjung', colorClass: 'bg-[#4285F4]' },
              ]}
              categories={monthlyVisitors.map((m) => ({
                label: m.label,
                values: [m.visitors],
                tooltips: [`${m.label}: ${m.visitors} pengunjung`],
              }))}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] px-3 py-2 text-[11px] dark:bg-white/[0.04]">
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
              <Link
                href="/admin/reports"
                className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Detail laporan ({avgMonthlyVisitors}/bln)
              </Link>
            </div>
          </section>

          {/* Panel B (Bottom): Prioritas Tindak Lanjut */}
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
        </div>
      </div>
    </div>
  );
}
