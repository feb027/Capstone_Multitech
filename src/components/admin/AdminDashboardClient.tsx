'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CustomerType, EntryMethod, IntakeType, ItemStatus } from '@prisma/client';
import { getStatusMeta } from '@/lib/status';
import { MockCustomerRow, MockServiceOrder } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Check,
  X,
  Clock,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { GroupedBarChart } from './GroupedBarChart';
import { ServicePreviewModal } from './services/ServicePreviewModal';
import { calcTotalCharges, calcTotalPaid } from './services/service-utils';

interface AdminDashboardClientProps {
  totalActive: number;
  totalCustomers: number;
  statusCounts: Record<string, number>;
  recentOrders: MockServiceOrder[];
  initialCustomers?: MockCustomerRow[];
}

function getPaymentStatusInfo(order: MockServiceOrder): {
  label: string;
  textClass: string;
} {
  const total = calcTotalCharges(order);
  const paid = calcTotalPaid(order);
  if (total === 0) {
    return { label: 'Belum ditagih', textClass: 'text-slate-600 dark:text-slate-400' };
  }
  if (paid >= total) {
    return { label: 'Lunas', textClass: 'text-emerald-700 dark:text-emerald-400' };
  }
  if (paid > 0) {
    return { label: 'DP', textClass: 'text-blue-700 dark:text-blue-400' };
  }
  return { label: 'Belum bayar', textClass: 'text-amber-800 dark:text-amber-300' };
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

function getDeadlineUrgency(estimatedDoneAt?: string | null): {
  label: string;
  badgeClass: string;
  isOverdue: boolean;
} | null {
  if (!estimatedDoneAt) return null;
  const due = new Date(estimatedDoneAt);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((dueDay - todayDay) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Lewat ${Math.abs(diffDays)} hari`,
      badgeClass: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300',
      isOverdue: true,
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Hari Ini',
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200',
      isOverdue: false,
    };
  }
  return {
    label: diffDays === 1 ? 'Besok' : `${diffDays} hari lagi`,
    badgeClass: 'bg-slate-900/[0.06] text-slate-700 dark:bg-white/[0.1] dark:text-slate-300',
    isOverdue: false,
  };
}

const STAGE_CHART_ORDER: Array<{ status: ItemStatus; label: string }> = [
  { status: ItemStatus.DITERIMA, label: 'Diterima' },
  { status: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { status: ItemStatus.MENUNGGU_SPAREPART, label: 'Komponen' },
  { status: ItemStatus.PERBAIKAN, label: 'Pengerjaan' },
  { status: ItemStatus.UJI_QC, label: 'Uji & QC' },
  { status: ItemStatus.SIAP_DIAMBIL, label: 'Siap' },
  { status: ItemStatus.SELESAI, label: 'Selesai' },
];

const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function AdminDashboardClient({
  totalActive: initialTotalActive,
  totalCustomers: initialTotalCustomers,
  statusCounts: initialStatusCounts,
  recentOrders: initialOrders,
  initialCustomers = [],
}: AdminDashboardClientProps) {
  const { orders, customers, isLoaded, upsertOrder } = useDataset(
    initialOrders,
    initialCustomers
  );
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editReminderText, setEditReminderText] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [chartMode, setChartMode] = useState<'stages' | 'monthly'>('stages');
  const [selectedOrder, setSelectedOrder] = useState<MockServiceOrder | null>(null);

  const allOrders = orders.length > 0 ? orders : initialOrders;
  const activeOrders = allOrders.filter((o) =>
    o.items.some((i) => i.status !== ItemStatus.SELESAI && i.status !== ItemStatus.BATAL)
  );
  const displayedActiveOrders = activeOrders.slice(0, 5);

  const customerList = customers.length > 0 ? customers : initialCustomers;
  const totalActive = isLoaded ? activeOrders.length : initialTotalActive || activeOrders.length;
  const totalCustomers = isLoaded
    ? customerList.length
    : initialTotalCustomers || customerList.length;

  const statusCounts: Record<string, number> = isLoaded ? {} : { ...initialStatusCounts };
  if (isLoaded) {
    for (const order of allOrders) {
      for (const item of order.items) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      }
    }
  }

  const allItems = allOrders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
    }))
  );

  const totalActiveModules =
    allItems.filter(
      ({ item }) => item.status !== ItemStatus.SELESAI && item.status !== ItemStatus.BATAL
    ).length || Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  const mobilUtuhCount = activeOrders.filter(
    (o) => o.unitCategory !== 'GENSET_INDUSTRI' && o.intakeType === IntakeType.MOBIL_UTUH
  ).length;
  const modulSajaCount = activeOrders.filter(
    (o) => o.unitCategory !== 'GENSET_INDUSTRI' && o.intakeType === IntakeType.MODUL_SAJA
  ).length;
  const gensetCount = activeOrders.filter((o) => o.unitCategory === 'GENSET_INDUSTRI').length;

  const siapCount = statusCounts[ItemStatus.SIAP_DIAMBIL] || 0;
  const qcCount = statusCounts[ItemStatus.UJI_QC] || 0;
  const siapOrders = activeOrders.filter((o) =>
    o.items.some((item) => item.status === ItemStatus.SIAP_DIAMBIL)
  );
  const siapBengkelCount = siapOrders.filter((o) => o.entryMethod !== EntryMethod.EKSPEDISI).length;
  const siapEkspedisiCount = siapOrders.filter((o) => o.entryMethod === EntryMethod.EKSPEDISI).length;

  const billableOrders = allOrders.filter((o) =>
    o.items.some((item) => item.status !== ItemStatus.BATAL)
  );
  const totalEstimatedRevenue = billableOrders.reduce((sum, order) => sum + calcTotalCharges(order), 0);
  const totalPaidAmount = billableOrders.reduce((sum, order) => sum + calcTotalPaid(order), 0);
  const paidPercentage =
    totalEstimatedRevenue > 0 ? Math.round((totalPaidAmount / totalEstimatedRevenue) * 100) : 0;

  const lunasCount = billableOrders.filter((o) => {
    const total = calcTotalCharges(o);
    const paid = calcTotalPaid(o);
    return total > 0 && paid >= total;
  }).length;
  const dpCount = billableOrders.filter((o) => {
    const total = calcTotalCharges(o);
    const paid = calcTotalPaid(o);
    return paid > 0 && paid < total;
  }).length;
  const belumBayarCount = billableOrders.filter((o) => calcTotalPaid(o) === 0).length;

  const peroranganCount = customerList.filter((c) => c.type === CustomerType.PERORANGAN).length;
  const mitraCount = customerList.filter((c) => c.type === CustomerType.MITRA).length;

  // Top 3 paling urgent berdasarkan estimasi tanggal selesai terdekat
  const urgentPriorityOrders = [...activeOrders]
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

  const overdueCount = urgentPriorityOrders.filter(
    (o) => getDeadlineUrgency(o.estimatedDoneAt)?.isOverdue
  ).length;

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

  // Data grafik murni dari data aktual: Distribusi Tahap Modul vs Unit Masuk 6 Bulan Terakhir
  const stageChartData = STAGE_CHART_ORDER.map((stage) => ({
    label: stage.label,
    count: statusCounts[stage.status] || 0,
  }));
  const stageTotal = stageChartData.reduce((sum, item) => sum + item.count, 0);
  const stagePeak = stageChartData.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    stageChartData[0]
  );

  const latestOrderDate = allOrders.reduce((latest, ord) => {
    const d = new Date(ord.receivedAt);
    return !Number.isNaN(d.getTime()) && d.getTime() > latest.getTime() ? d : latest;
  }, new Date());

  const sixMonthBuckets: Array<{ year: number; month: number; label: string; count: number }> = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(latestOrderDate.getFullYear(), latestOrderDate.getMonth() - offset, 1);
    sixMonthBuckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_NAMES_ID[d.getMonth()],
      count: 0,
    });
  }
  for (const ord of allOrders) {
    const d = new Date(ord.receivedAt);
    if (Number.isNaN(d.getTime())) continue;
    const bucket = sixMonthBuckets.find(
      (b) => b.year === d.getFullYear() && b.month === d.getMonth()
    );
    if (bucket) bucket.count += 1;
  }
  const sixMonthTotal = sixMonthBuckets.reduce((sum, b) => sum + b.count, 0);
  const sixMonthPeak = sixMonthBuckets.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    sixMonthBuckets[0]
  );

  const activeChartSeries =
    chartMode === 'stages'
      ? stageChartData.map((d) => ({
          label: d.label,
          values: [d.count],
          tooltips: [`${d.label}: ${d.count} modul`],
        }))
      : sixMonthBuckets.map((b) => ({
          label: b.label,
          values: [b.count],
          tooltips: [`${b.label} ${b.year}: ${b.count} unit masuk`],
        }));

  const maxChartVal = Math.max(
    ...(chartMode === 'stages'
      ? stageChartData.map((d) => d.count)
      : sixMonthBuckets.map((b) => b.count)),
    4
  );
  const chartTopTick = Math.ceil(maxChartVal / 4) * 4;
  const chartTicks = [0, 1, 2, 3, 4].map((i) => Math.round((chartTopTick / 4) * i));

  return (
    <div className="space-y-3.5 lg:space-y-4">
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Link
          href="/admin/services"
          className="ios-glass-card group flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md dark:hover:border-white/[0.18] sm:rounded-[22px] sm:p-4"
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
          <div className="mt-1 flex items-center justify-between gap-1.5">
            <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
              {mobilUtuhCount} Mobil · {modulSajaCount} Modul · {gensetCount} Genset
            </p>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          href="/admin/services?status=SIAP_DIAMBIL"
          className="ios-glass-card group flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md dark:hover:border-white/[0.18] sm:rounded-[22px] sm:p-4"
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
          <div className="mt-1 flex items-center justify-between gap-1.5">
            <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
              {siapBengkelCount} Ambil Bengkel · {siapEkspedisiCount} Kirim Paket
            </p>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="ios-glass-card group flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md dark:hover:border-white/[0.18] sm:rounded-[22px] sm:p-4"
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
          <div className="mt-1 flex items-center justify-between gap-1.5">
            <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
              {lunasCount} Lunas · {dpCount} DP · {belumBayarCount} Belum Bayar
            </p>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
              aria-hidden="true"
            />
          </div>
        </Link>

        <Link
          href="/admin/customers"
          className="ios-glass-card group flex min-w-0 flex-col justify-between rounded-[20px] p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-md dark:hover:border-white/[0.18] sm:rounded-[22px] sm:p-4"
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
          <div className="mt-1 flex items-center justify-between gap-1.5">
            <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
              {peroranganCount} Perorangan · {mitraCount} Bengkel Mitra
            </p>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
              aria-hidden="true"
            />
          </div>
        </Link>
      </div>

      {/* Two-Column Operational Workspace */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Compact Active Orders Table (Active units only, max 5) */}
        <section className="ios-glass-card flex h-full flex-col rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Unit Dalam Penanganan
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Antrean aktif terbaru, klik baris untuk lihat detail
              </p>
            </div>
            <Link
              href="/admin/services"
              className="shrink-0 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Semua ({activeOrders.length})
            </Link>
          </div>

          <div className="grid grid-cols-12 items-center gap-2 border-b border-black/[0.06] pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:text-slate-400">
            <span className="col-span-5">Unit</span>
            <span className="col-span-3">Pelanggan &amp; Bayar</span>
            <span className="col-span-4 text-right">Modul &amp; Penanganan</span>
          </div>

          {displayedActiveOrders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tidak ada unit aktif dalam antrean saat ini.
              </p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {displayedActiveOrders.map((order) => {
                const paymentInfo = getPaymentStatusInfo(order);
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    aria-label={`Lihat detail servis #${order.code} ${order.vehicleBrand} ${order.vehicleModel}`}
                    className="grid w-full grid-cols-12 items-center gap-2 py-2.5 text-left transition-colors first:pt-2 last:pb-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
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
                        <p className="mt-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          {order.plateNumber}
                        </p>
                      )}
                    </div>

                    {/* Col 2: Pelanggan + Status Bayar */}
                    <div className="col-span-3 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-400">
                        <span className={`font-bold ${paymentInfo.textClass}`}>
                          {paymentInfo.label}
                        </span>
                        {order.customerType === CustomerType.MITRA && order.workshopName
                          ? ` · ${order.workshopName}`
                          : ''}
                      </p>
                    </div>

                    {/* Col 3: Modul & Penanganan (Teks center di dalam setiap pill) */}
                    <div className="col-span-4 flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                      {order.items.map((item) => {
                        const meta = getStatusMeta(item.status);
                        return (
                          <span
                            key={item.id}
                            className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-center text-[10px] font-bold leading-none ${meta.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                            <span className="truncate">
                              {getShortModuleName(item.moduleName)}: {meta.shortLabel}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Top 3 Prioritas Tindak Lanjut */}
        <section className="ios-glass-card flex h-full flex-col rounded-[24px] p-4 shadow-sm sm:p-5 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Prioritas Tindak Lanjut
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Top 3 deadline terdekat, klik edit untuk catat pengingat
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                overdueCount > 0
                  ? 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              }`}
            >
              {overdueCount > 0 ? `${overdueCount} Lewat Batas` : `Top ${urgentPriorityOrders.length} Urgent`}
            </span>
          </div>

          {urgentPriorityOrders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Semua unit sudah selesai atau belum memiliki target estimasi.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between gap-2.5">
              {urgentPriorityOrders.map((order) => {
                const primaryItem = order.items[0];
                const primaryMeta = primaryItem ? getStatusMeta(primaryItem.status) : null;
                const deadline = getDeadlineUrgency(order.estimatedDoneAt);
                const defaultReminder =
                  order.priorityNote ||
                  (primaryItem
                    ? `${getShortModuleName(primaryItem.moduleName)}: ${getStatusMeta(primaryItem.status).shortLabel} (${order.customerName})`
                    : order.conditionNotes || 'Perlu tindak lanjut');
                const isEditing = editingPriorityId === order.id;

                return (
                  <div
                    key={order.id}
                    className={`ios-glass-inner rounded-2xl p-3 transition-colors ${
                      deadline?.isOverdue
                        ? '!border-red-500/25 dark:!border-red-400/25'
                        : ''
                    }`}
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
                          {deadline && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${deadline.badgeClass}`}
                            >
                              {deadline.label}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span>
                            {order.estimatedDoneAt
                              ? formatDate(order.estimatedDoneAt)
                              : 'Estimasi belum diisi'}
                          </span>
                          <span>·</span>
                          <span className="truncate">{order.customerName}</span>
                          {primaryMeta && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {primaryMeta.shortLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditPriority(order)}
                            title="Edit pengingat & estimasi"
                            aria-label={`Edit pengingat #${order.code}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-slate-700 transition-colors hover:bg-black/10 tap-bounce dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/15"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          title="Lihat detail unit"
                          aria-label={`Lihat detail unit #${order.code}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-slate-700 transition-colors hover:bg-black/10 tap-bounce dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/15"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
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
                          className="h-9 w-full rounded-xl border border-black/10 bg-white px-2.5 text-[11px] font-medium text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            <span>Est. Selesai:</span>
                            <input
                              type="date"
                              value={editTargetDate}
                              onChange={(e) => setEditTargetDate(e.target.value)}
                              className="h-8 rounded-lg border border-black/10 bg-white px-2 font-mono text-[10px] text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                            />
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingPriorityId(null)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-[11px] font-bold text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Batal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePriorityReminder(order)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-slate-900 px-3.5 text-[11px] font-bold text-white tap-bounce dark:bg-white dark:text-black"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
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

      {/* Full-Width Bar Chart Section (100% real data, zero static baseline) */}
      <section className="ios-glass-card rounded-[24px] p-4 shadow-sm sm:px-6 sm:pt-4 sm:pb-5">
        <GroupedBarChart
          title={
            chartMode === 'stages'
              ? 'Distribusi Tahapan Modul Saat Ini'
              : 'Unit Servis Masuk (6 Bulan Terakhir)'
          }
          yAxisLabel={chartMode === 'stages' ? 'Jumlah Modul' : 'Jumlah Unit'}
          xAxisLabel={chartMode === 'stages' ? 'Tahap Pengerjaan' : 'Bulan'}
          heightClass="h-36 sm:h-40"
          wideBars
          ticks={chartTicks}
          series={[
            {
              key: 'count',
              label: chartMode === 'stages' ? 'Total Modul' : 'Unit Masuk',
              colorClass: 'bg-[#4285F4]',
            },
          ]}
          categories={activeChartSeries}
          headerRight={
            <div
              role="tablist"
              aria-label="Mode tampilan grafik dashboard"
              className="inline-flex rounded-full bg-black/[0.05] p-1 dark:bg-white/[0.08]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'stages'}
                onClick={() => setChartMode('stages')}
                className={`min-h-[40px] rounded-full px-3.5 text-[11px] font-bold transition-colors ${
                  chartMode === 'stages'
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Tahap Modul
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'monthly'}
                onClick={() => setChartMode('monthly')}
                className={`min-h-[40px] rounded-full px-3.5 text-[11px] font-bold transition-colors ${
                  chartMode === 'monthly'
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Unit 6 Bulan
              </button>
            </div>
          }
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] px-4 py-2 text-[11px] dark:bg-white/[0.04]">
          {chartMode === 'stages' ? (
            <>
              <span className="text-slate-600 dark:text-slate-300">
                Total Modul Tercatat:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {stageTotal} modul
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Tahap Terbanyak:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {stagePeak.label} ({stagePeak.count} modul)
                </strong>
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-600 dark:text-slate-300">
                Total 6 Bulan Terakhir:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {sixMonthTotal} unit
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Puncak:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {sixMonthPeak.label} {sixMonthPeak.year} ({sixMonthPeak.count} unit)
                </strong>
              </span>
            </>
          )}
          <Link
            href="/admin/reports"
            className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Buka rekap laporan
          </Link>
        </div>
      </section>

      <ServicePreviewModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  );
}
