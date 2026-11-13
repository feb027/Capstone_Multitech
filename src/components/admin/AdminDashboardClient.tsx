'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CustomerType, EntryMethod, IntakeType, ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockServiceOrder, SparepartItem } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Check,
  X,
  Clock,
  ArrowUpRight,
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

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function AdminDashboardClient({
  totalActive: initialTotalActive,
  totalCustomers: initialTotalCustomers,
  statusCounts: initialStatusCounts,
  recentOrders: initialOrders,
}: AdminDashboardClientProps) {
  const { orders, customers, isLoaded, upsertOrder } = useDataset(initialOrders);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editReminderText, setEditReminderText] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

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

  // Top 3 paling urgent berdasarkan estimasi tanggal selesai (estimatedDoneAt terdekat)
  const urgentPriorityOrders = [...recentOrders]
    .filter((order) =>
      order.items.some(
        (item) => item.status !== ItemStatus.SELESAI && item.status !== ItemStatus.BATAL
      )
    )
    .sort((a, b) => {
      const timeA = a.estimatedDoneAt
        ? new Date(a.estimatedDoneAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const timeB = b.estimatedDoneAt
        ? new Date(b.estimatedDoneAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 3);

  const startEditPriority = (order: MockServiceOrder) => {
    const primaryItem = order.items[0];
    const defaultNote =
      order.priorityNote ||
      (primaryItem
        ? `${getShortModuleName(primaryItem.moduleName)}: ${getStatusMeta(primaryItem.status).shortLabel} (${order.customerName})`
        : order.conditionNotes || 'Perlu tindak lanjut');
    setEditingPriorityId(order.id);
    setEditReminderText(defaultNote);
    setEditTargetDate(toDateInputValue(order.estimatedDoneAt));
  };

  const handleSavePriorityReminder = async (order: MockServiceOrder) => {
    const nextEstimated = editTargetDate
      ? new Date(`${editTargetDate}T16:00:00.000Z`).toISOString()
      : order.estimatedDoneAt;
    await upsertOrder({
      ...order,
      priorityNote: editReminderText.trim() || null,
      estimatedDoneAt: nextEstimated,
    });
    setEditingPriorityId(null);
  };

  const novOrderCount = recentOrders.filter(
    (o) => new Date(o.receivedAt).getMonth() === 10
  ).length;
  const decOrderCount = recentOrders.filter(
    (o) => new Date(o.receivedAt).getMonth() === 11
  ).length;

  const monthlyVisitors = [
    { label: 'Jan', visitors: 4 },
    { label: 'Feb', visitors: 6 },
    { label: 'Mar', visitors: 5 },
    { label: 'Apr', visitors: 7 },
    { label: 'Mei', visitors: 6 },
    { label: 'Jun', visitors: 5 },
    { label: 'Jul', visitors: 7 },
    { label: 'Agu', visitors: 6 },
    { label: 'Sep', visitors: 8 },
    { label: 'Okt', visitors: 9 },
    { label: 'Nov', visitors: Math.max(novOrderCount, recentOrders.length, 5) },
    { label: 'Des', visitors: 4 + decOrderCount },
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
    <div className="space-y-3.5">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Compact Active Orders Table */}
        <section className="ios-glass-card flex h-full flex-col rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-7">
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

          <div className="grid grid-cols-12 items-center gap-2 border-b border-black/[0.06] pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
            <span className="col-span-5">Unit</span>
            <span className="col-span-3">Pelanggan</span>
            <span className="col-span-4 text-right">Modul &amp; Penanganan</span>
          </div>

          <div className="flex-1 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/services?orderId=${order.id}`}
                className="grid grid-cols-12 items-center gap-2 py-2 transition-colors first:pt-1.5 last:pb-0.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                {/* Col 1: Unit */}
                <div className="col-span-5 min-w-0">
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
                <div className="col-span-3 min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {order.customerName}
                  </p>
                  {order.customerType === CustomerType.MITRA && order.workshopName && (
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {order.workshopName}
                    </p>
                  )}
                </div>

                {/* Col 3: Modul & Penanganan (Right-aligned) */}
                <div className="col-span-4 flex min-w-0 flex-wrap items-center justify-end gap-1 text-right">
                  {order.items.map((item) => {
                    const meta = getStatusMeta(item.status);
                    return (
                      <span
                        key={item.id}
                        className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                        <span className="truncate">
                          {getShortModuleName(item.moduleName)}: {meta.shortLabel}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Right: Top 3 Prioritas Tindak Lanjut (Editable Reminder berdasarkan Estimasi Selesai) */}
        <section className="ios-glass-card flex h-full flex-col rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Prioritas Tindak Lanjut
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Top 3 deadline terdekat · klik edit untuk catat reminder
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
              Top {urgentPriorityOrders.length} Urgent
            </span>
          </div>

          {urgentPriorityOrders.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Semua unit sudah selesai atau belum memiliki target estimasi.
            </p>
          ) : (
            <div className="flex flex-1 flex-col justify-between gap-2.5">
              {urgentPriorityOrders.map((order) => {
                const primaryItem = order.items[0];
                const defaultReminder =
                  order.priorityNote ||
                  (primaryItem
                    ? `${getShortModuleName(primaryItem.moduleName)}: ${getStatusMeta(primaryItem.status).shortLabel} (${order.customerName})`
                    : order.conditionNotes || 'Perlu tindak lanjut');
                const isEditing = editingPriorityId === order.id;

                return (
                  <div
                    key={order.id}
                    className="ios-glass-inner rounded-2xl p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                            #{order.code}
                          </span>
                          <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {order.vehicleBrand} {order.vehicleModel}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span>
                            {order.estimatedDoneAt
                              ? `Estimasi selesai ${formatDate(order.estimatedDoneAt)}`
                              : 'Estimasi belum diisi'}
                          </span>
                          <span>·</span>
                          <span className="truncate">{order.customerName}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditPriority(order)}
                            title="Edit reminder & estimasi"
                            aria-label={`Edit pengingat #${order.code}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05] text-slate-700 hover:bg-black/10 dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/15"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/admin/services?orderId=${order.id}`}
                          title="Buka detail unit"
                          aria-label={`Buka detail unit #${order.code}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05] text-slate-700 hover:bg-black/10 dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/15"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2.5 space-y-2 border-t border-black/[0.06] pt-2.5 dark:border-white/[0.08]">
                        <input
                          type="text"
                          value={editReminderText}
                          onChange={(e) => setEditReminderText(e.target.value)}
                          placeholder="Tulis catatan pengingat untuk tim..."
                          aria-label="Catatan pengingat"
                          className="h-8 w-full rounded-xl border border-black/10 bg-white px-2.5 text-[11px] font-medium text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            <span>Est. Selesai:</span>
                            <input
                              type="date"
                              value={editTargetDate}
                              onChange={(e) => setEditTargetDate(e.target.value)}
                              className="h-7 rounded-lg border border-black/10 bg-white px-2 font-mono text-[10px] text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                            />
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingPriorityId(null)}
                              className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
                            >
                              <X className="h-3 w-3" />
                              <span>Batal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePriorityReminder(order)}
                              className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-900 px-3 text-[10px] font-bold text-white tap-bounce dark:bg-white dark:text-black"
                            >
                              <Check className="h-3 w-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                        {defaultReminder}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Full-Width Bar Chart Section: Diagram Kepadatan Pengunjung */}
      <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:px-6 sm:pt-3.5 sm:pb-6">
        <GroupedBarChart
          title="Diagram Kepadatan Pengunjung"
          yAxisLabel="Jumlah Pengunjung"
          xAxisLabel="Bulan"
          heightClass="h-48 sm:h-56"
          wideBars
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] px-4 py-2.5 text-[11px] dark:bg-white/[0.04]">
          <span className="text-slate-600 dark:text-slate-300">
            Total Jan-Des:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {totalSixMonthVisitors} unit
            </strong>
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            Puncak:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {peakMonth.label} ({peakMonth.visitors} pengunjung)
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
    </div>
  );
}
