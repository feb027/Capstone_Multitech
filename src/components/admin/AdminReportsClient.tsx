'use client';

import { useState, useMemo } from 'react';
import { INITIAL_SERVICE_ORDERS, MockServiceOrder } from '@/lib/frontend-mock';
import { WORKSHOP_PROFILE, getStatusMeta } from '@/lib/status';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Printer,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { GroupedBarChart } from './GroupedBarChart';

const PERIODS = [
  { id: 'ALL', label: 'Semua Periode' },
  { id: 'THIS_MONTH', label: 'Bulan Ini' },
  { id: 'LAST_3_MONTHS', label: '3 Bulan Terakhir' },
  { id: 'MITRA_B2B', label: 'Mitra B2B' },
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

export function AdminReportsClient() {
  const [period, setPeriod] = useState('ALL');

  // Filter order sesuai pilihan tab
  const filteredOrders = useMemo(() => {
    return INITIAL_SERVICE_ORDERS.filter((order) => {
      const orderDate = new Date(order.receivedAt);
      const now = new Date();

      if (period === 'THIS_MONTH') {
        const isCurrentMonth =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
        return isCurrentMonth;
      }
      if (period === 'LAST_3_MONTHS') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return orderDate >= threeMonthsAgo;
      }
      if (period === 'MITRA_B2B') return order.customerType === 'MITRA';
      if (period === 'PERORANGAN') return order.customerType === 'PERORANGAN';
      return true;
    });
  }, [period]);

  // Kalkulasi agregat keuangan
  const summary = useMemo(() => {
    let totalBilling = 0;
    let totalPaid = 0;

    for (const order of filteredOrders) {
      totalBilling += calcBilling(order);
      totalPaid += calcPaid(order);
    }

    const realizationPct =
      totalBilling > 0 ? Math.min(100, Math.round((totalPaid / totalBilling) * 100)) : 100;

    return {
      totalBilling,
      totalPaid,
      outstanding: Math.max(0, totalBilling - totalPaid),
      realizationPct,
      count: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Data Bulanan untuk Grafik 1 (Pemasukan & Tagihan) & Grafik 3 (Kepadatan Pelanggan)
  const monthlyData = useMemo(() => {
    const monthsMap: Record<
      string,
      { label: string; revenue: number; billed: number; count: number; mitraCount: number; peroranganCount: number }
    > = {
      '5': { label: 'Jun', revenue: 6500000, billed: 7200000, count: 5, mitraCount: 2, peroranganCount: 3 },
      '6': { label: 'Jul', revenue: 8400000, billed: 9100000, count: 7, mitraCount: 3, peroranganCount: 4 },
      '7': { label: 'Agu', revenue: 7800000, billed: 8500000, count: 6, mitraCount: 2, peroranganCount: 4 },
      '8': { label: 'Sep', revenue: 9900000, billed: 11200000, count: 8, mitraCount: 4, peroranganCount: 4 },
      '9': { label: 'Okt', revenue: 11500000, billed: 12800000, count: 9, mitraCount: 4, peroranganCount: 5 },
      '10': { label: 'Nov', revenue: 0, billed: 0, count: 0, mitraCount: 0, peroranganCount: 0 },
    };

    // Tambahkan data dari filteredOrders untuk bulan berjalan (Nov)
    for (const order of filteredOrders) {
      const d = new Date(order.receivedAt);
      const mKey = String(d.getMonth());
      if (monthsMap[mKey]) {
        const paid = calcPaid(order);
        const billed = calcBilling(order);
        monthsMap[mKey].revenue += paid;
        monthsMap[mKey].billed += billed;
        monthsMap[mKey].count += 1;
        if (order.customerType === 'MITRA') {
          monthsMap[mKey].mitraCount += 1;
        } else {
          monthsMap[mKey].peroranganCount += 1;
        }
      }
    }

    const mapped = Object.entries(monthsMap).map(([key, m]) => {
      let filteredRevenue = m.revenue;
      let filteredBilled = m.billed;
      let filteredCount = m.count;
      let mitraVal = m.mitraCount;
      let peroranganVal = m.peroranganCount;

      if (period === 'MITRA_B2B') {
        filteredRevenue = Math.round(m.revenue * 0.58);
        filteredBilled = Math.round(m.billed * 0.58);
        filteredCount = m.mitraCount;
        peroranganVal = 0;
      } else if (period === 'PERORANGAN') {
        filteredRevenue = Math.round(m.revenue * 0.42);
        filteredBilled = Math.round(m.billed * 0.42);
        filteredCount = m.peroranganCount;
        mitraVal = 0;
      }

      return {
        key,
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
      return mapped.filter((m) => m.key === '10');
    }
    if (period === 'LAST_3_MONTHS') {
      return mapped.filter((m) => m.key === '8' || m.key === '9' || m.key === '10');
    }
    return mapped;
  }, [filteredOrders, period]);

  const financeTicks = useMemo(() => {
    const maxValM = Math.max(
      ...monthlyData.map((m) => Math.max(m.billed, m.revenue, m.outstanding) / 1_000_000),
      15
    );
    const topTick = Math.ceil(maxValM / 5) * 5;
    return [0, 1, 2, 3, 4, 5].map((i) => Math.round((topTick / 5) * i));
  }, [monthlyData]);

  const trafficTicks = useMemo(() => {
    const maxCount = Math.max(...monthlyData.map((m) => m.count), 10);
    const topTick = Math.ceil(maxCount / 5) * 5;
    return [0, 1, 2, 3, 4, 5].map((i) => Math.round((topTick / 5) * i));
  }, [monthlyData]);

  const categoryRevenueData = useMemo(() => {
    const baseScale =
      period === 'THIS_MONTH'
        ? 0.22
        : period === 'LAST_3_MONTHS'
          ? 0.55
          : period === 'MITRA_B2B'
            ? 0.58
            : period === 'PERORANGAN'
              ? 0.42
              : 1;

    const buckets: Record<string, { jasa: number; part: number; diagnosa: number }> = {
      ECU: { jasa: 3_400_000 * baseScale, part: 2_600_000 * baseScale, diagnosa: 900_000 * baseScale },
      EPS: { jasa: 2_200_000 * baseScale, part: 1_500_000 * baseScale, diagnosa: 750_000 * baseScale },
      Cluster: { jasa: 1_850_000 * baseScale, part: 950_000 * baseScale, diagnosa: 500_000 * baseScale },
      Genset: { jasa: 2_500_000 * baseScale, part: 1_750_000 * baseScale, diagnosa: 800_000 * baseScale },
    };

    for (const order of filteredOrders) {
      const mod = (order.items[0]?.moduleName || '').toLowerCase();
      const target =
        order.unitCategory === 'GENSET_INDUSTRI' || mod.includes('genset') || mod.includes('amf')
          ? 'Genset'
          : mod.includes('speedo') || mod.includes('cluster')
            ? 'Cluster'
            : mod.includes('eps') || mod.includes('bcm')
              ? 'EPS'
              : 'ECU';

      for (const c of order.charges) {
        const amt = c.qty * c.unitPrice;
        if (c.kind === 'JASA') buckets[target].jasa += amt;
        else if (c.kind === 'SPAREPART') buckets[target].part += amt;
        else buckets[target].diagnosa += amt;
      }
    }

    return [
      { label: 'ECU Mesin', ...buckets.ECU },
      { label: 'EPS & BCM', ...buckets.EPS },
      { label: 'Cluster', ...buckets.Cluster },
      { label: 'Genset', ...buckets.Genset },
    ];
  }, [filteredOrders, period]);

  const categoryTicks = useMemo(() => {
    const maxValM = Math.max(
      ...categoryRevenueData.map((c) => Math.max(c.jasa, c.part, c.diagnosa) / 1_000_000),
      5
    );
    const topTick = Math.ceil(maxValM);
    return [0, 1, 2, 3, 4, 5].map((i) => Number(((topTick / 5) * i).toFixed(1)));
  }, [categoryRevenueData]);

  return (
    <div className="space-y-6">
      {/* Print Kop Surat Resmi CV Multitech */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo href="" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{WORKSHOP_PROFILE.name}</h2>
              <p className="text-xs text-slate-600">{WORKSHOP_PROFILE.focus}</p>
              <p className="text-xs text-slate-600">{WORKSHOP_PROFILE.address}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">REKAP LAPORAN SERVIS & KEUANGAN</p>
            <p>Periode: {PERIODS.find((p) => p.id === period)?.label}</p>
            <p>Tanggal Cetak: {formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Header Halaman Laporan */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Laporan Keuangan & Kepadatan Unit
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Visualisasi grafik pemasukan bulanan, pendapatan realisasi, dan kepadatan antrean pelanggan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md transition-transform hover:bg-slate-800 tap-bounce dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          <span>Cetak Laporan / PDF</span>
        </button>
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
              className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition-all tap-bounce ${
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
      {/* 3 GRAFIK BATANG BERKELOMPOK (TERHUBUNG DENGAN FILTER PERIODE)  */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* GRAFIK 1: Pemasukan & Tagihan Bulanan */}
        <section className="ios-glass-card rounded-[28px] p-5 shadow-sm sm:p-6">
          <GroupedBarChart
            title="Diagram Pemasukan & Tagihan Bulanan"
            yAxisLabel="Juta Rupiah"
            xAxisLabel="Periode Bulan"
            ticks={financeTicks}
            formatTick={(v) => (v === 0 ? '0' : `${v}jt`)}
            heightClass="h-48 sm:h-56"
            series={[
              { key: 'billed', label: 'Total Tagihan', colorClass: 'bg-[#4285F4]' },
              { key: 'revenue', label: 'Kas Masuk', colorClass: 'bg-[#EA4335]' },
              { key: 'outstanding', label: 'Sisa Piutang', colorClass: 'bg-[#FBBC04]' },
            ]}
            categories={monthlyData.map((m) => ({
              label: m.label,
              values: [
                Number((m.billed / 1_000_000).toFixed(2)),
                Number((m.revenue / 1_000_000).toFixed(2)),
                Number((m.outstanding / 1_000_000).toFixed(2)),
              ],
              tooltips: [
                `${m.label} - Tagihan: ${formatRupiah(m.billed)}`,
                `${m.label} - Kas Masuk: ${formatRupiah(m.revenue)}`,
                `${m.label} - Sisa Piutang: ${formatRupiah(m.outstanding)}`,
              ],
            }))}
          />
        </section>

        {/* GRAFIK 2 & 3: GRID 2 KOLOM (Pendapatan Kategori & Kepadatan Pelanggan) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* GRAFIK 2: Pendapatan per Kategori Modul */}
          <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
            <GroupedBarChart
              title="Diagram Pendapatan per Kategori"
              yAxisLabel="Juta Rupiah"
              xAxisLabel="Kategori Layanan"
              ticks={categoryTicks}
              formatTick={(v) => (v === 0 ? '0' : `${v}jt`)}
              heightClass="h-44 sm:h-48"
              series={[
                { key: 'jasa', label: 'Jasa Servis', colorClass: 'bg-[#4285F4]' },
                { key: 'part', label: 'Sparepart IC', colorClass: 'bg-[#EA4335]' },
                { key: 'diagnosa', label: 'Diagnosa', colorClass: 'bg-[#FBBC04]' },
              ]}
              categories={categoryRevenueData.map((c) => ({
                label: c.label,
                values: [
                  Number((c.jasa / 1_000_000).toFixed(2)),
                  Number((c.part / 1_000_000).toFixed(2)),
                  Number((c.diagnosa / 1_000_000).toFixed(2)),
                ],
                tooltips: [
                  `${c.label} - Jasa Servis: ${formatRupiah(c.jasa)}`,
                  `${c.label} - Sparepart IC: ${formatRupiah(c.part)}`,
                  `${c.label} - Diagnosa: ${formatRupiah(c.diagnosa)}`,
                ],
              }))}
            />

            <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Ringkasan Kas: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Realisasi pembayaran mencapai {summary.realizationPct}% ({formatRupiah(summary.totalPaid)} dari {formatRupiah(summary.totalBilling)}).
              </span>
            </div>
          </section>

          {/* GRAFIK 3: Kepadatan Pelanggan Bulanan */}
          <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
            <GroupedBarChart
              title="Diagram Kepadatan Pelanggan"
              yAxisLabel="Jumlah Unit"
              xAxisLabel="Bulan Kunjungan"
              ticks={trafficTicks}
              heightClass="h-44 sm:h-48"
              series={[
                { key: 'perorangan', label: 'Perorangan', colorClass: 'bg-[#4285F4]' },
                { key: 'mitra', label: 'Bengkel Mitra', colorClass: 'bg-[#EA4335]' },
                { key: 'total', label: 'Total Unit', colorClass: 'bg-[#FBBC04]' },
              ]}
              categories={monthlyData.map((m) => ({
                label: m.label,
                values: [m.peroranganCount, m.mitraCount, m.count],
                tooltips: [
                  `${m.label} - Perorangan: ${m.peroranganCount} unit`,
                  `${m.label} - Bengkel Mitra: ${m.mitraCount} unit`,
                  `${m.label} - Total Unit: ${m.count} unit`,
                ],
              }))}
            />

            <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Tren Kunjungan: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Menampilkan distribusi kunjungan pelanggan Perorangan, Bengkel Mitra, dan total unit masuk per bulan.
              </span>
            </div>
          </section>
        </div>
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
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                <th className="px-5 py-3.5">Kode & Tgl</th>
                <th className="px-5 py-3.5">Pelanggan</th>
                <th className="px-5 py-3.5">Unit / Kendaraan</th>
                <th className="px-5 py-3.5 text-right">Tagihan</th>
                <th className="px-5 py-3.5 text-right">Kas Masuk</th>
                <th className="px-5 py-3.5 text-right">Sisa</th>
                <th className="px-5 py-3.5 text-center">Status</th>
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
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        #{order.code}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDate(order.receivedAt)}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.customerName}
                      </p>
                      {order.workshopName && (
                        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                          {order.workshopName}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {formatVehicleLabel(order)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(billing)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(paid)}
                    </td>

                    <td
                      className={`px-5 py-3.5 text-right font-mono font-bold ${
                        outstanding === 0
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {outstanding === 0 ? 'Lunas' : formatRupiah(outstanding)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
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

        {/* Mobile Cards List */}
        <div className="divide-y divide-black/[0.05] md:hidden dark:divide-white/[0.06]">
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
                      outstanding === 0 ? 'text-slate-400' : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {outstanding === 0 ? 'Lunas' : `Sisa ${formatRupiah(outstanding)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
