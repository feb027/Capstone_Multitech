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
  Users,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

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

  // Data Bulanan untuk Grafik 1 (Pemasukan Kas per Bulan) & Grafik 3 (Kepadatan Pelanggan)
  const monthlyData = useMemo(() => {
    const monthNames = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
    // Inisialisasi data 6 bulan terakhir
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

    // Jika filter khusus B2B atau Perorangan aktif, sesuaikan angka
    return Object.values(monthsMap).map((m) => {
      let filteredRevenue = m.revenue;
      let filteredCount = m.count;

      if (period === 'MITRA_B2B') {
        filteredRevenue = Math.round(m.revenue * 0.58);
        filteredCount = m.mitraCount;
      } else if (period === 'PERORANGAN') {
        filteredRevenue = Math.round(m.revenue * 0.42);
        filteredCount = m.peroranganCount;
      }

      return {
        ...m,
        revenue: filteredRevenue,
        count: filteredCount,
      };
    });
  }, [filteredOrders, period]);

  const maxRevenue = useMemo(() => {
    const vals = monthlyData.map((m) => m.revenue);
    return Math.max(...vals, 1000000);
  }, [monthlyData]);

  const maxTrafficCount = useMemo(() => {
    const vals = monthlyData.map((m) => m.count);
    return Math.max(...vals, 1);
  }, [monthlyData]);

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
      {/* 3 GRAFIK UTAMA YANG MENGGANTIKAN DISTRIBUSI PER KATEGORI MODUL */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* GRAFIK 1: Pemasukan ke Perusahaan Setiap Bulannya */}
        <section className="ios-glass-card rounded-[28px] p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">
                  Grafik Pemasukan Perusahaan Setiap Bulannya
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Akumulasi kas masuk bersih (omset terealisasi) per bulan
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Tertinggi: {formatRupiah(maxRevenue)}
            </span>
          </div>

          {/* Bar Chart Visual Pemasukan Bulanan */}
          <div className="mt-5 grid grid-cols-6 items-end gap-2 sm:gap-4">
            {monthlyData.map((item) => {
              const heightPct = Math.min(100, Math.max(12, Math.round((item.revenue / maxRevenue) * 100)));
              return (
                <div key={item.label} className="group flex flex-col items-center">
                  <span className="mb-1.5 font-mono text-[10px] font-bold text-slate-700 opacity-90 transition-opacity group-hover:opacity-100 dark:text-zinc-300">
                    {item.revenue >= 1000000
                      ? `${(item.revenue / 1000000).toFixed(1)}jt`
                      : formatRupiah(item.revenue)}
                  </span>

                  <div className="relative flex h-36 w-full items-end justify-center rounded-2xl bg-black/[0.04] p-1.5 dark:bg-white/[0.06] sm:h-44">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md transition-all duration-500 group-hover:brightness-110 dark:from-emerald-500 dark:to-teal-300"
                    />
                  </div>

                  <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* GRAFIK 2 & 3: GRID 2 KOLOM (Pendapatan & Kepadatan Pelanggan) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* GRAFIK 2: Grafik Pendapatan & Rasio Realisasi Tagihan */}
          <section className="ios-glass-card flex flex-col justify-between rounded-[28px] p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Grafik Pendapatan & Realisasi Kas
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Perbandingan tagihan servis yang diterbitkan vs kas yang telah diterima
              </p>

              {/* Progress Breakdown */}
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Total Nilai Tagihan Servis</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {formatRupiah(summary.totalBilling)}
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full w-full rounded-full bg-blue-600 dark:bg-blue-500" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">Kas Masuk Berhasil Diterima</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(summary.totalPaid)} ({summary.realizationPct}%)
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      style={{ width: `${summary.realizationPct}%` }}
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-700 dark:text-amber-300">Sisa Belum Dibayar / Piutang</span>
                    <span className="font-mono text-amber-700 dark:text-amber-300">
                      {formatRupiah(summary.outstanding)}
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      style={{
                        width: `${summary.totalBilling > 0 ? (summary.outstanding / summary.totalBilling) * 100 : 0}%`,
                      }}
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Kesimpulan Keuangan: </span>
              <span className="text-slate-600 dark:text-slate-300">
                {summary.realizationPct >= 85
                  ? 'Arus kas berada pada kondisi sangat sehat dengan rasio pelunasan di atas 85%.'
                  : 'Terdapat tagihan berjalan yang menunggu pelunasan saat pengambilan unit servis.'}
              </span>
            </div>
          </section>

          {/* GRAFIK 3: Grafik Padatnya Pelanggan (Customer Density / Traffic) */}
          <section className="ios-glass-card flex flex-col justify-between rounded-[28px] p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Grafik Padatnya Pelanggan & Kunjungan
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Tingkat kepadatan penerimaan unit servis per bulan
              </p>

              {/* Bar Horizontal Kepadatan Pelanggan */}
              <div className="mt-4 space-y-3">
                {monthlyData.map((item) => {
                  const barWidth = Math.min(100, Math.max(8, Math.round((item.count / maxTrafficCount) * 100)));
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                          {item.count} unit servis
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-black/[0.03] p-3 text-xs dark:bg-white/[0.04]">
              <span className="font-bold text-slate-900 dark:text-white">Tren Kepadatan: </span>
              <span className="text-slate-600 dark:text-slate-300">
                Puncak kepadatan unit terjadi pada bulan Oktober dan November dengan rata-rata di atas 8 unit per bulan.
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
