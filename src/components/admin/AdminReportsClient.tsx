'use client';

import { useState, useMemo } from 'react';
import { INITIAL_SERVICE_ORDERS, MockServiceOrder } from '@/lib/frontend-mock';
import { WORKSHOP_PROFILE, getStatusMeta } from '@/lib/status';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { formatDate, formatRupiah } from '@/lib/utils';
import { Printer } from 'lucide-react';

const PERIODS = [
  { id: 'ALL', label: 'Semua Periode' },
  { id: 'THIS_MONTH', label: 'Bulan Ini' },
  { id: 'MITRA_B2B', label: 'Mitra B2B' },
  { id: 'PERORANGAN', label: 'Perorangan' },
];

function calcBilling(order: MockServiceOrder): number {
  return order.charges.reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

function formatVehicleLabel(order: MockServiceOrder): string {
  return [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(' ');
}

export function AdminReportsClient() {
  const [period, setPeriod] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return INITIAL_SERVICE_ORDERS.filter((order) => {
      if (period === 'MITRA_B2B') return order.customerType === 'MITRA';
      if (period === 'PERORANGAN') return order.customerType === 'PERORANGAN';
      return true;
    });
  }, [period]);

  const summary = useMemo(() => {
    let totalBilling = 0;
    let totalPaid = 0;
    const byModule: Record<string, { count: number; revenue: number }> = {};

    for (const order of filteredOrders) {
      const orderBilling = calcBilling(order);
      const orderPaid = order.payments.reduce((s, p) => s + p.amount, 0);
      totalBilling += orderBilling;
      totalPaid += orderPaid;

      const modKey = order.items[0]?.moduleName || 'Lainnya';
      if (!byModule[modKey]) {
        byModule[modKey] = { count: 0, revenue: 0 };
      }
      byModule[modKey].count += 1;
      byModule[modKey].revenue += orderBilling;
    }

    return {
      totalBilling,
      totalPaid,
      outstanding: Math.max(0, totalBilling - totalPaid),
      byModule: Object.entries(byModule),
    };
  }, [filteredOrders]);

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
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Servis & Keuangan
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Rekapitulasi transaksi servis modul, penerimaan pembayaran, dan sisa piutang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          <span>Cetak Laporan / PDF</span>
        </button>
      </div>

      {/* Filter Periode */}
      <div className="no-print no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`min-h-[40px] shrink-0 rounded-full px-4 text-xs font-semibold transition-all tap-bounce ${
              period === p.id
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:bg-[#1C1C1E] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Ringkasan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Tagihan Servis
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-white">
            {formatRupiah(summary.totalBilling)}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Kas Masuk
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatRupiah(summary.totalPaid)}
          </p>
        </div>

        <div className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Sisa Piutang Berjalan
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-amber-700 dark:text-amber-300">
            {formatRupiah(summary.outstanding)}
          </p>
        </div>
      </div>

      {/* Rekap per Jenis Modul */}
      <section className="rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Distribusi per Kategori Modul
        </h2>
        <div className="mt-3.5 space-y-2.5">
          {summary.byModule.map(([modName, data]) => {
            const pct = summary.totalBilling > 0 ? Math.round((data.revenue / summary.totalBilling) * 100) : 0;
            return (
              <div key={modName} className="rounded-2xl bg-[#F2F2F7] p-3.5 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {modName} ({data.count} unit)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(data.revenue)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-slate-900 dark:bg-white"
                    style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabel Detail Transaksi */}
      <section className="overflow-hidden rounded-[24px] border border-black/[0.04] bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="border-b border-black/[0.05] px-5 py-4 dark:border-white/[0.06]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Rincian Transaksi Unit ({filteredOrders.length})
          </h2>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-black/[0.05] md:hidden dark:divide-white/[0.06]">
          {filteredOrders.map((order) => {
            const billing = calcBilling(order);
            const paid = order.payments.reduce((s, p) => s + p.amount, 0);
            const meta = getStatusMeta(order.items[0].status);
            return (
              <div key={order.id} className="space-y-1.5 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {order.code}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}>
                    {meta.shortLabel}
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{formatVehicleLabel(order)}</p>
                <p className="text-slate-600 dark:text-slate-400">
                  {order.customerName} | {formatDate(order.receivedAt)}
                </p>
                <div className="flex items-center justify-between pt-1 font-mono font-bold">
                  <span className="text-slate-900 dark:text-white">Tagihan: {formatRupiah(billing)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400">Masuk: {formatRupiah(paid)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] bg-[#F2F2F7]/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Pelanggan</th>
                <th className="px-5 py-3">Unit / Modul</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Tagihan</th>
                <th className="px-5 py-3 text-right">Terbayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {filteredOrders.map((order) => {
                const billing = calcBilling(order);
                const paid = order.payments.reduce((s, p) => s + p.amount, 0);
                const meta = getStatusMeta(order.items[0].status);
                return (
                  <tr key={order.id} className="hover:bg-[#F2F2F7]/40 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {order.code}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {formatVehicleLabel(order)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}>
                        {meta.shortLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(billing)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(paid)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
