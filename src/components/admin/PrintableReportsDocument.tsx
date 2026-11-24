'use client';

import { WORKSHOP_PROFILE, getStatusMeta } from '@/lib/status';
import { MockServiceOrder } from '@/lib/frontend-mock';
import { formatDate, formatRupiah } from '@/lib/utils';

export interface ReportMonthlyRow {
  key: string;
  label: string;
  revenue: number;
  billed: number;
  outstanding: number;
  count: number;
  mitraCount: number;
  peroranganCount: number;
}

export interface PrintableReportsDocumentProps {
  periodLabel: string;
  currentYear: number;
  summary: {
    totalBilling: number;
    totalPaid: number;
    outstanding: number;
    realizationPct: number;
    count: number;
  };
  monthlyData: ReportMonthlyRow[];
  filteredOrders: MockServiceOrder[];
}

function calcOrderBilling(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

function calcOrderPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

export function PrintableReportsDocument({
  periodLabel,
  currentYear,
  summary,
  monthlyData,
  filteredOrders,
}: PrintableReportsDocumentProps) {
  const mitraTotal = filteredOrders.filter((o) => o.customerType === 'MITRA').length;
  const peroranganTotal = filteredOrders.filter((o) => o.customerType !== 'MITRA').length;
  const activeMonths = monthlyData.filter((m) => m.count > 0 || m.billed > 0 || m.revenue > 0);
  const displayedMonths = activeMonths.length > 0 ? activeMonths : monthlyData;
  const maxMonthMoney = Math.max(
    ...displayedMonths.map((m) => Math.max(m.billed, m.revenue)),
    1
  );
  const printDate = formatDate(new Date());

  return (
    <div className="print-only bg-white text-slate-900">
      <div className="mx-auto max-w-[820px] space-y-3.5 text-[10px] leading-snug text-slate-900">
        {/* KOP SURAT RESMI — DATAR, LOGO SEJAJAR TENGAH, TANPA KOTAK */}
        <header className="flex items-center justify-between gap-6 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-3.5">
            <img
              src="/images/multitech-logo.png"
              alt="Logo CV Multitech"
              className="h-[52px] w-auto shrink-0 object-contain"
            />
            <div className="space-y-0.5">
              <h1 className="text-[16px] font-extrabold leading-tight tracking-tight text-slate-900">
                {WORKSHOP_PROFILE.name.toUpperCase()}
              </h1>
              <p className="max-w-sm text-[9px] font-semibold text-slate-700">
                {WORKSHOP_PROFILE.focus}
              </p>
              <p className="max-w-sm text-[9px] text-slate-600">{WORKSHOP_PROFILE.address}</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-black tracking-tight text-slate-900">
              LAPORAN KEUANGAN &amp; SERVIS
            </p>
            <div className="mt-1 space-y-0.5 text-[9.5px] text-slate-600">
              <p>
                Periode:{' '}
                <span className="font-bold text-slate-900">
                  {periodLabel} ({currentYear})
                </span>
              </p>
              <p>
                Dicetak: <span className="font-semibold text-slate-900">{printDate}</span>
              </p>
            </div>
          </div>
        </header>

        {/* STRIP METRIK EKSEKUTIF 4 KOLOM (PENGGANTI 4 KARTU KPI) */}
        <section className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 pb-3 pt-0.5 text-center break-inside-avoid">
          <div className="px-2">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Volume Unit Servis
            </p>
            <p className="mt-0.5 font-mono text-sm font-black tabular-nums text-slate-900">
              {summary.count} Unit
            </p>
            <p className="mt-0.5 text-[8.5px] text-slate-600">
              {peroranganTotal} Perorangan · {mitraTotal} Mitra
            </p>
          </div>

          <div className="px-2">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Total Tagihan
            </p>
            <p className="mt-0.5 font-mono text-sm font-black tabular-nums text-slate-900">
              {formatRupiah(summary.totalBilling)}
            </p>
            <p className="mt-0.5 text-[8.5px] text-slate-600">Akumulasi nota aktif</p>
          </div>

          <div className="px-2">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Kas Masuk (Realisasi)
            </p>
            <p className="mt-0.5 font-mono text-sm font-black tabular-nums text-emerald-700">
              {formatRupiah(summary.totalPaid)}
            </p>
            <p className="mt-0.5 text-[8.5px] font-semibold text-emerald-700">
              {summary.realizationPct}% terbayar
            </p>
          </div>

          <div className="px-2">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
              Sisa Piutang
            </p>
            <p className="mt-0.5 font-mono text-sm font-black tabular-nums text-slate-900">
              {formatRupiah(summary.outstanding)}
            </p>
            <p className="mt-0.5 text-[8.5px] font-semibold text-slate-600">
              Status: {summary.outstanding === 0 ? 'LUNAS' : 'PENDING'}
            </p>
          </div>
        </section>

        {/* I. REKAPITULASI BULANAN & REALISASI KAS — TABEL TERBUKA */}
        <section className="break-inside-avoid space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-800">
              I. Rekapitulasi Bulanan &amp; Realisasi Kas ({currentYear})
            </h2>
            <span className="text-[8.5px] text-slate-500">Periode: {periodLabel}</span>
          </div>

          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr className="border-b border-slate-900 text-left text-[8.5px] font-bold uppercase tracking-wider text-slate-600">
                <th className="w-14 py-1.5 pr-2">Bulan</th>
                <th className="w-12 py-1.5 pr-2 text-center">Unit</th>
                <th className="w-24 py-1.5 pr-2 text-center">Perorangan / Mitra</th>
                <th className="py-1.5 pr-3">Proporsi Kas Masuk</th>
                <th className="w-24 py-1.5 pr-2 text-right">Tagihan</th>
                <th className="w-24 py-1.5 pr-2 text-right">Kas Masuk</th>
                <th className="w-24 py-1.5 text-right">Piutang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {displayedMonths.map((row) => {
                const barWidthPct = Math.round((row.revenue / maxMonthMoney) * 100);
                return (
                  <tr key={row.key}>
                    <td className="py-1.5 pr-2 font-bold text-slate-900">{row.label}</td>
                    <td className="py-1.5 pr-2 text-center font-mono font-bold tabular-nums">
                      {row.count}
                    </td>
                    <td className="py-1.5 pr-2 text-center font-mono text-[9px] tabular-nums text-slate-600">
                      {row.peroranganCount} / {row.mitraCount}
                    </td>
                    <td className="py-1.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.max(row.revenue > 0 ? 4 : 0, barWidthPct)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[8.5px] font-bold tabular-nums text-slate-700">
                          {row.billed > 0 ? `${Math.round((row.revenue / row.billed) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-right font-mono tabular-nums">
                      {formatRupiah(row.billed)}
                    </td>
                    <td className="py-1.5 pr-2 text-right font-mono font-bold tabular-nums text-emerald-700">
                      {formatRupiah(row.revenue)}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-slate-800">
                      {formatRupiah(row.outstanding)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* II. RINCIAN TRANSAKSI UNIT SERVIS — TABEL TERBUKA GARIS HORIZONTAL (PADAT 1 HALAMAN A4) */}
        <section className="space-y-1.5">
          <h2 className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-800">
            II. Rincian Transaksi Unit Servis ({filteredOrders.length} Transaksi)
          </h2>

          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr className="border-b border-slate-900 text-left text-[8.5px] font-bold uppercase tracking-wider text-slate-600">
                <th className="w-7 py-1.5 pr-1.5 text-center">No</th>
                <th className="w-24 py-1.5 pr-2">Kode &amp; Tgl</th>
                <th className="py-1.5 pr-2">Pelanggan / Mitra</th>
                <th className="py-1.5 pr-2">Unit / Kendaraan</th>
                <th className="w-24 py-1.5 pr-2 text-right">Tagihan</th>
                <th className="w-24 py-1.5 pr-2 text-right">Kas Masuk</th>
                <th className="w-24 py-1.5 pr-2 text-right">Sisa</th>
                <th className="w-20 py-1.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-900">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-3 text-center italic text-slate-600">
                    Tidak ada transaksi unit servis pada filter periode ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const billing = calcOrderBilling(order);
                  const paid = calcOrderPaid(order);
                  const outstanding = Math.max(0, billing - paid);
                  const meta = getStatusMeta(order.items[0]?.status);
                  const vehicleLabel = [order.vehicleBrand, order.vehicleModel]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr key={order.id} className="break-inside-avoid">
                      <td className="py-1.5 pr-1.5 text-center font-mono text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 pr-2">
                        <p className="font-mono font-bold text-slate-900">#{order.code}</p>
                        <p className="text-[8px] text-slate-500">{formatDate(order.receivedAt)}</p>
                      </td>
                      <td className="py-1.5 pr-2">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="text-[8px] text-slate-500">
                          {order.workshopName || 'Perorangan'}
                        </p>
                      </td>
                      <td className="py-1.5 pr-2 font-medium text-slate-800">
                        <p>{vehicleLabel}</p>
                        {order.plateNumber && (
                          <p className="font-mono text-[8px] text-slate-500">{order.plateNumber}</p>
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono tabular-nums">
                        {formatRupiah(billing)}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono font-bold tabular-nums text-emerald-700">
                        {formatRupiah(paid)}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono font-bold tabular-nums text-slate-800">
                        {billing === 0
                          ? 'Belum ditagih'
                          : outstanding === 0
                          ? 'Lunas'
                          : formatRupiah(outstanding)}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-800">
                        {meta.shortLabel}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-b border-slate-300 font-bold text-slate-900">
                <td colSpan={4} className="py-2 pr-2 text-right text-[9px] uppercase tracking-wider">
                  Total Keseluruhan ({summary.count} Unit)
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums">
                  {formatRupiah(summary.totalBilling)}
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums text-emerald-700">
                  {formatRupiah(summary.totalPaid)}
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums">
                  {summary.totalBilling === 0
                    ? 'Belum ditagih'
                    : summary.outstanding === 0
                    ? 'Lunas'
                    : formatRupiah(summary.outstanding)}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">{summary.realizationPct}%</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* PENGESAHAN */}
        <footer className="mt-5 grid grid-cols-2 gap-12 break-inside-avoid pt-2 text-center text-[9.5px]">
          <div className="flex flex-col items-center">
            <p className="text-slate-600">Disusun Oleh, Admin &amp; Kasir Operasional</p>
            <div className="h-10" />
            <p className="min-w-[175px] border-t border-slate-800 pt-1 font-bold text-slate-900">
              Admin CV Multitech
            </p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-slate-600">
              {WORKSHOP_PROFILE.city}, {printDate} · Mengetahui, Pimpinan Bengkel
            </p>
            <div className="h-10" />
            <p className="min-w-[175px] border-t border-slate-800 pt-1 font-bold text-slate-900">
              Pimpinan {WORKSHOP_PROFILE.name}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
