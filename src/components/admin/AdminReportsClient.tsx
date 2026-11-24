'use client';

import { useState, useMemo } from 'react';
import { MockCustomerRow, MockServiceOrder } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { getStatusMeta } from '@/lib/status';
import { escapeCsvCell } from '@/lib/business-rules';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Printer,
  Download,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { GroupedBarChart } from './GroupedBarChart';
import { PrintableReportsDocument } from './PrintableReportsDocument';

const PERIODS = [
  { id: 'ALL', label: 'Semua Periode' },
  { id: 'THIS_MONTH', label: 'Bulan Ini' },
  { id: 'LAST_3_MONTHS', label: '3 Bulan Terakhir' },
  { id: 'MITRA_B2B', label: 'Bengkel Mitra' },
  { id: 'PERORANGAN', label: 'Perorangan' },
];

function calcBilling(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

function calcPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

function formatVehicleLabel(order: MockServiceOrder): string {
  return [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(' ');
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function AdminReportsClient({
  initialOrders,
  initialCustomers,
}: {
  initialOrders?: MockServiceOrder[];
  initialCustomers?: MockCustomerRow[];
}) {
  const { orders } = useDataset(initialOrders, initialCustomers);
  const [period, setPeriod] = useState('ALL');

  const referenceDate = useMemo(() => {
    let latest = new Date();
    let hasValid = false;
    for (const o of orders) {
      const d = new Date(o.receivedAt);
      if (Number.isNaN(d.getTime())) continue;
      if (!hasValid || d.getTime() > latest.getTime()) {
        latest = d;
        hasValid = true;
      }
    }
    return latest;
  }, [orders]);

  const currentYear = referenceDate.getFullYear();
  const currentMonthIdx = referenceDate.getMonth();

  const lastThreeMonthSet = useMemo(() => {
    const keys = new Set<string>();
    for (let offset = 0; offset < 3; offset += 1) {
      const d = new Date(currentYear, currentMonthIdx - offset, 1);
      keys.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    return keys;
  }, [currentYear, currentMonthIdx]);

  // Filter order sesuai pilihan tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.receivedAt);
      if (Number.isNaN(orderDate.getTime())) return period === 'ALL';

      if (period === 'THIS_MONTH') {
        return (
          orderDate.getFullYear() === currentYear &&
          orderDate.getMonth() === currentMonthIdx
        );
      }
      if (period === 'LAST_3_MONTHS') {
        return lastThreeMonthSet.has(`${orderDate.getFullYear()}-${orderDate.getMonth()}`);
      }
      if (period === 'MITRA_B2B') return order.customerType === 'MITRA';
      if (period === 'PERORANGAN') return order.customerType === 'PERORANGAN';
      return true;
    });
  }, [orders, period, currentYear, currentMonthIdx, lastThreeMonthSet]);

  // Kalkulasi agregat keuangan
  const summary = useMemo(() => {
    let totalBilling = 0;
    let totalPaid = 0;

    for (const order of filteredOrders) {
      totalBilling += calcBilling(order);
      totalPaid += calcPaid(order);
    }

    const realizationPct =
      totalBilling > 0 ? Math.min(100, Math.round((totalPaid / totalBilling) * 100)) : 0;

    return {
      totalBilling,
      totalPaid,
      outstanding: Math.max(0, totalBilling - totalPaid),
      realizationPct,
      count: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Statistik Modul & Merek Terbanyak (FR-D04)
  const topModuleStats = useMemo(() => {
    const modMap = new Map<string, number>();
    const brandMap = new Map<string, number>();

    for (const order of filteredOrders) {
      const brand = (order.vehicleBrand || '').trim();
      if (brand) {
        brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
      }
      for (const item of order.items) {
        const modName = (item.moduleName || 'Lainnya').trim();
        modMap.set(modName, (modMap.get(modName) || 0) + 1);
      }
    }

    return {
      modules: Array.from(modMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      brands: Array.from(brandMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    };
  }, [filteredOrders]);

  // Statistik Bengkel Mitra Teraktif (FR-D05)
  const topPartnerStats = useMemo(() => {
    const map = new Map<string, { orders: number; billing: number; paid: number }>();
    for (const order of filteredOrders) {
      if (order.customerType !== 'MITRA') continue;
      const key = (order.workshopName || order.customerName || 'Bengkel Mitra').trim();
      const prev = map.get(key) || { orders: 0, billing: 0, paid: 0 };
      map.set(key, {
        orders: prev.orders + 1,
        billing: prev.billing + calcBilling(order),
        paid: prev.paid + calcPaid(order),
      });
    }
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.orders - a.orders || b.billing - a.billing)
      .slice(0, 5);
  }, [filteredOrders]);

  // Ekspor CSV Laporan Periode Aktif (FR-D07)
  const handleExportCsv = () => {
    const header = [
      'Kode Nota',
      'Tanggal Masuk',
      'Pelanggan',
      'Kategori',
      'Bengkel Mitra',
      'Unit / Kendaraan',
      'Plat Nomor',
      'Metode Masuk',
      'No. Resi',
      'Modul',
      'Status Utama',
      'Total Tagihan (Rp)',
      'Kas Masuk (Rp)',
      'Sisa Piutang (Rp)',
    ];

    const rows = filteredOrders.map((order) => {
      const billing = calcBilling(order);
      const paid = calcPaid(order);
      const remaining = Math.max(0, billing - paid);
      const primary = order.items[0];
      const statusLabel = primary ? getStatusMeta(primary.status).label : '-';
      const modulesText = order.items.map((it) => it.moduleName).join('; ');

      return [
        `#${order.code}`,
        formatDate(order.receivedAt),
        order.customerName,
        order.customerType === 'MITRA' ? 'Bengkel Mitra' : 'Perorangan',
        order.workshopName || '-',
        formatVehicleLabel(order) || '-',
        order.plateNumber || '-',
        order.entryMethod === 'EKSPEDISI' ? 'Ekspedisi' : 'Datang Langsung',
        order.trackingNumber || '-',
        modulesText || '-',
        statusLabel,
        billing,
        paid,
        remaining,
      ];
    });

    const csvLines = [header, ...rows].map((row) => row.map(escapeCsvCell).join(','));
    const csvContent = `\uFEFF${csvLines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.download = `laporan-multitech-${period.toLowerCase()}-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Data Bulanan aktual dari seluruh order (selaras dengan tabel dan ringkasan KPI)
  const monthlyData = useMemo(() => {
    const buckets = MONTH_LABELS.map((label, idx) => ({
      key: String(idx),
      label,
      revenue: 0,
      billed: 0,
      mitraRevenue: 0,
      mitraBilled: 0,
      peroranganRevenue: 0,
      peroranganBilled: 0,
      count: 0,
      mitraCount: 0,
      peroranganCount: 0,
    }));

    for (const order of orders) {
      const d = new Date(order.receivedAt);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== currentYear) continue;
      const bucket = buckets[d.getMonth()];
      if (!bucket) continue;

      const paid = calcPaid(order);
      const billed = calcBilling(order);
      bucket.revenue += paid;
      bucket.billed += billed;
      bucket.count += 1;
      if (order.customerType === 'MITRA') {
        bucket.mitraCount += 1;
        bucket.mitraRevenue += paid;
        bucket.mitraBilled += billed;
      } else {
        bucket.peroranganCount += 1;
        bucket.peroranganRevenue += paid;
        bucket.peroranganBilled += billed;
      }
    }

    const mapped = buckets.map((m) => {
      let filteredRevenue = m.revenue;
      let filteredBilled = m.billed;
      let filteredCount = m.count;
      let mitraVal = m.mitraCount;
      let peroranganVal = m.peroranganCount;

      if (period === 'MITRA_B2B') {
        filteredRevenue = m.mitraRevenue;
        filteredBilled = m.mitraBilled;
        filteredCount = m.mitraCount;
        peroranganVal = 0;
      } else if (period === 'PERORANGAN') {
        filteredRevenue = m.peroranganRevenue;
        filteredBilled = m.peroranganBilled;
        filteredCount = m.peroranganCount;
        mitraVal = 0;
      }

      return {
        ...m,
        revenue: filteredRevenue,
        billed: filteredBilled,
        outstanding: Math.max(0, filteredBilled - filteredRevenue),
        count: filteredCount,
        mitraCount: mitraVal,
        peroranganCount: peroranganVal,
      };
    });

    if (period === 'THIS_MONTH') {
      return mapped.filter((m) => m.key === String(currentMonthIdx));
    }
    if (period === 'LAST_3_MONTHS') {
      const activeMonths = new Set([
        String((currentMonthIdx + 10) % 12),
        String((currentMonthIdx + 11) % 12),
        String(currentMonthIdx),
      ]);
      return mapped.filter((m) => activeMonths.has(m.key));
    }
    return mapped;
  }, [orders, period, currentYear, currentMonthIdx]);

  const financeTicks = useMemo(() => {
    const maxValM = Math.max(
      ...monthlyData.map((m) => m.revenue / 1_000_000),
      2
    );
    const topTick = Math.ceil(maxValM);
    return [0, 1, 2, 3, 4, 5].map((i) => Number(((topTick / 5) * i).toFixed(1)));
  }, [monthlyData]);

  const billingSummaryTicks = useMemo(() => {
    const maxValM = Math.max(summary.totalBilling / 1_000_000, 2);
    const topTick = Math.ceil(maxValM);
    return [0, 1, 2, 3, 4, 5].map((i) => Number(((topTick / 5) * i).toFixed(1)));
  }, [summary.totalBilling]);

  const trafficTicks = useMemo(() => {
    const maxCount = Math.max(...monthlyData.map((m) => m.count), 5);
    const topTick = Math.ceil(maxCount / 5) * 5;
    return [0, 1, 2, 3, 4, 5].map((i) => Math.round((topTick / 5) * i));
  }, [monthlyData]);

  const periodLabel = PERIODS.find((p) => p.id === period)?.label || 'Semua Periode';

  return (
    <>
      <PrintableReportsDocument
        periodLabel={periodLabel}
        currentYear={currentYear}
        summary={summary}
        monthlyData={monthlyData}
        filteredOrders={filteredOrders}
      />

      <div className="no-print space-y-6">
        {/* Header Halaman Laporan */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Laporan Keuangan & Kepadatan Unit
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Visualisasi grafik pemasukan bulanan, pendapatan realisasi, dan kepadatan antrean pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-xs font-bold text-slate-900 shadow-xs transition-colors hover:bg-slate-50 tap-bounce disabled:opacity-40 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.08]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md transition-transform hover:bg-slate-800 tap-bounce dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Cetak Laporan / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Periode Terhubung Dinamis */}
      <div className="no-print no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {PERIODS.map((p) => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition-colors transition-transform tap-bounce ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-black'
                  : 'ios-glass-card text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Ringkasan Angka KPI Utama */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Tagihan Servis
            </p>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
            {formatRupiah(summary.totalBilling)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {summary.count} total unit pada periode ini
          </p>
        </div>

        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Kas Masuk (Pemasukan)
            </p>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 font-mono text-xl font-black text-emerald-700 dark:text-emerald-400 sm:text-2xl">
            {formatRupiah(summary.totalPaid)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {summary.realizationPct}% realisasi pembayaran
          </p>
        </div>

        <div className="ios-glass-card rounded-[24px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Sisa Piutang Berjalan
            </p>
            <span className="font-mono text-xs font-bold text-amber-600">
              {summary.outstanding === 0 ? 'LUNAS' : 'PENDING'}
            </span>
          </div>
          <p className="mt-1 font-mono text-xl font-black text-amber-700 dark:text-amber-300 sm:text-2xl">
            {formatRupiah(summary.outstanding)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Tagihan menunggu pelunasan unit
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3 GRAFIK BATANG UTAMA (TERHUBUNG DENGAN FILTER PERIODE)        */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* GRAFIK 1: Pemasukan Perusahaan Bulanan */}
        <section className="ios-glass-card rounded-[28px] p-5 shadow-sm sm:p-6">
          <GroupedBarChart
            title="Diagram Pemasukan Perusahaan Bulanan"
            yAxisLabel="Juta Rupiah"
            xAxisLabel="Bulan"
            ticks={financeTicks}
            formatTick={(v) => (v === 0 ? '0' : `${v}jt`)}
            heightClass="h-48 sm:h-56"
            series={[
              { key: 'revenue', label: 'Kas Masuk', colorClass: 'bg-[#4285F4]' },
            ]}
            categories={monthlyData.map((m) => ({
              label: m.label,
              values: [Number((m.revenue / 1_000_000).toFixed(2))],
              tooltips: [`${m.label} - Kas Masuk: ${formatRupiah(m.revenue)}`],
            }))}
          />
        </section>

        {/* GRAFIK 2 & 3: GRID 2 KOLOM (Pendapatan & Kepadatan Pengunjung) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* GRAFIK 2: Pendapatan & Tagihan */}
          <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
            <GroupedBarChart
              title="Diagram Pendapatan & Tagihan"
              yAxisLabel="Juta Rupiah"
              xAxisLabel="Komponen Tagihan"
              ticks={billingSummaryTicks}
              formatTick={(v) => (v === 0 ? '0' : `${v}jt`)}
              heightClass="h-44 sm:h-48"
              series={[
                { key: 'amount', label: 'Nominal', colorClass: 'bg-[#4285F4]' },
              ]}
              categories={[
                {
                  label: 'Total Tagihan',
                  values: [Number((summary.totalBilling / 1_000_000).toFixed(2))],
                  tooltips: [`Total Tagihan: ${formatRupiah(summary.totalBilling)}`],
                },
                {
                  label: 'Kas Masuk',
                  values: [Number((summary.totalPaid / 1_000_000).toFixed(2))],
                  tooltips: [`Kas Masuk: ${formatRupiah(summary.totalPaid)}`],
                },
                {
                  label: 'Sisa Piutang',
                  values: [Number((summary.outstanding / 1_000_000).toFixed(2))],
                  tooltips: [`Sisa Piutang: ${formatRupiah(summary.outstanding)}`],
                },
              ]}
            />

            <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Ringkasan Kas: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Realisasi pembayaran mencapai {summary.realizationPct}% ({formatRupiah(summary.totalPaid)} dari {formatRupiah(summary.totalBilling)}).
              </span>
            </div>
          </section>

          {/* GRAFIK 3: Kepadatan Pengunjung Bulanan */}
          <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
            <GroupedBarChart
              title="Diagram Kepadatan Pengunjung Bulanan"
              yAxisLabel="Jumlah Pengunjung"
              xAxisLabel="Bulan"
              ticks={trafficTicks}
              heightClass="h-44 sm:h-48"
              series={[
                { key: 'total', label: 'Total Pengunjung', colorClass: 'bg-[#4285F4]' },
              ]}
              categories={monthlyData.map((m) => ({
                label: m.label,
                values: [m.count],
                tooltips: [`${m.label}: ${m.count} pengunjung`],
              }))}
            />

            <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Tren Kunjungan: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Menampilkan total banyaknya pengunjung / unit servis yang masuk di setiap bulan.
              </span>
            </div>
          </section>
        </div>

        {/* Statistik Modul/Merek & Bengkel Mitra Teraktif (Unified Hairline Panel) */}
        <section className="ios-glass-card overflow-hidden rounded-[28px] shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-black/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-white/[0.08]">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Modul &amp; Merek Terbanyak
                  </h2>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Distribusi kerusakan komponen pada periode aktif
                  </p>
                </div>
                {topModuleStats.brands.length > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Top Merek: {topModuleStats.brands.map((b) => `${b.name} (${b.count})`).join(', ')}
                  </span>
                )}
              </div>

              {topModuleStats.modules.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Belum ada data modul pada periode ini.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-black/[0.05] border-t border-black/[0.05] dark:divide-white/[0.06] dark:border-white/[0.06]">
                  {topModuleStats.modules.map((mod) => (
                    <div
                      key={mod.name}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <span className="truncate pr-3 font-semibold text-slate-800 dark:text-slate-200">
                        {mod.name}
                      </span>
                      <span className="shrink-0 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {mod.count} modul
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Bengkel Mitra Teraktif (B2B)
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Volume order dan nilai tagihan per mitra bengkel
                </p>
              </div>

              {topPartnerStats.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Tidak ada transaksi bengkel mitra pada periode ini.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-black/[0.05] border-t border-black/[0.05] dark:divide-white/[0.06] dark:border-white/[0.06]">
                  {topPartnerStats.map((partner) => (
                    <div
                      key={partner.name}
                      className="flex items-center justify-between gap-3 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {partner.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {partner.orders} unit servis
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatRupiah(partner.billing)}
                        </p>
                        <p className="font-mono text-[10px] tabular-nums text-emerald-700 dark:text-emerald-400">
                          Kas: {formatRupiah(partner.paid)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* TABEL DETAIL TRANSAKSI UNIT (DIPERTAHANKAN SESUAI PERMINTAAN)  */}
      {/* ============================================================== */}
      <section className="ios-glass-card overflow-hidden rounded-[28px] shadow-sm">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-4 dark:border-white/[0.06]">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
              Rincian Transaksi Unit Servis ({filteredOrders.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Riwayat transaksi keuangan unit servis pada periode ini
            </p>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                <th className="px-3 py-3.5 xl:px-5">Kode & Tgl</th>
                <th className="px-3 py-3.5 xl:px-5">Pelanggan</th>
                <th className="px-3 py-3.5 xl:px-5">Unit / Kendaraan</th>
                <th className="px-3 py-3.5 text-right xl:px-5">Tagihan</th>
                <th className="px-3 py-3.5 text-right xl:px-5">Kas Masuk</th>
                <th className="px-3 py-3.5 text-right xl:px-5">Sisa</th>
                <th className="px-3 py-3.5 text-center xl:px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {filteredOrders.map((order) => {
                const billing = calcBilling(order);
                const paid = calcPaid(order);
                const outstanding = Math.max(0, billing - paid);
                const meta = getStatusMeta(order.items[0]?.status);

                return (
                  <tr key={order.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-3 py-3.5 xl:px-5">
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        #{order.code}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDate(order.receivedAt)}
                      </p>
                    </td>

                    <td className="px-3 py-3.5 xl:px-5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.customerName}
                      </p>
                      {order.workshopName && (
                        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                          {order.workshopName}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3.5 font-semibold text-slate-800 dark:text-slate-200 xl:px-5">
                      {formatVehicleLabel(order)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white xl:px-5">
                      {formatRupiah(billing)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 xl:px-5">
                      {formatRupiah(paid)}
                    </td>

                    <td
                      className={`whitespace-nowrap px-3 py-3.5 text-right font-mono font-bold xl:px-5 ${
                        billing === 0
                          ? 'text-slate-500 dark:text-slate-400'
                          : outstanding === 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {billing === 0
                        ? 'Belum ditagih'
                        : outstanding === 0
                        ? 'Lunas'
                        : formatRupiah(outstanding)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3.5 text-center xl:px-5">
                      <span
                        className={`inline-flex min-w-[76px] items-center justify-center rounded-full border px-2.5 py-0.5 text-center text-[10px] font-bold leading-none ${meta.badgeClass}`}
                      >
                        {meta.shortLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Cards List */}
        <div className="divide-y divide-black/[0.05] lg:hidden dark:divide-white/[0.06]">
          {filteredOrders.map((order) => {
            const billing = calcBilling(order);
            const paid = calcPaid(order);
            const outstanding = Math.max(0, billing - paid);
            const meta = getStatusMeta(order.items[0]?.status);

            return (
              <div key={order.id} className="space-y-1.5 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    #{order.code} · {formatDate(order.receivedAt)}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                  >
                    {meta.shortLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {order.customerName} ({formatVehicleLabel(order)})
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-black/[0.04] pt-2 font-mono text-[11px] dark:border-white/[0.06]">
                  <span className="text-slate-600 dark:text-slate-400">
                    Masuk: <strong className="text-emerald-700 dark:text-emerald-400">{formatRupiah(paid)}</strong>
                  </span>
                  <span
                    className={`font-bold ${
                      billing === 0
                        ? 'text-slate-500 dark:text-slate-400'
                        : outstanding === 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {billing === 0
                      ? 'Belum ditagih'
                      : outstanding === 0
                      ? 'Lunas'
                      : `Sisa ${formatRupiah(outstanding)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </>
  );
}
