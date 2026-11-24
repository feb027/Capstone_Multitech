'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WORKSHOP_PROFILE, getStatusMeta } from '@/lib/status';
import { formatDate, formatRupiah } from '@/lib/utils';

export interface PrintableReceiptOrder {
  code: string;
  publicId: string;
  customerName: string;
  customerPhone: string;
  customerType: string;
  workshopName?: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: number | null;
  plateNumber?: string | null;
  intakeType: string;
  entryMethod?: string;
  trackingNumber?: string | null;
  unitCategory?: string;
  isWarrantyClaim?: boolean;
  warrantySourceCode?: string | null;
  conditionNotes?: string | null;
  receivedAt: string | Date;
  estimatedDoneAt?: string | Date | null;
  items: Array<{
    id: string;
    moduleName: string;
    moduleDetail?: string | null;
    complaint: string;
    status: string;
    warrantyMonths: number | null;
    warrantyUntil?: string | Date | null;
  }>;
  charges: Array<{
    id: string;
    kind?: string;
    description: string;
    qty: number;
    unitPrice: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    paidAt: string | Date;
    note?: string | null;
  }>;
}

const CHARGE_KIND_LABEL: Record<string, string> = {
  JASA: 'Jasa',
  SPAREPART: 'Komponen',
  DIAGNOSA: 'Diagnosa',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  TUNAI: 'Tunai',
  CASH: 'Tunai',
  TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
};

function formatPhoneDisplay(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '-';
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  return `+${digits}`;
}

function getServiceTypeLabel(order: PrintableReceiptOrder): string {
  const base =
    order.unitCategory === 'GENSET_INDUSTRI'
      ? 'Modul Genset / Industri'
      : order.intakeType === 'MOBIL_UTUH'
      ? 'Kendaraan / Mobil Utuh'
      : 'Modul Elektronik Lepasan';
  if (order.entryMethod === 'EKSPEDISI') {
    return order.trackingNumber
      ? `${base} (Ekspedisi · Resi: ${order.trackingNumber})`
      : `${base} (Kirim Ekspedisi)`;
  }
  if (order.entryMethod === 'DATANG') return `${base} (Datang Langsung)`;
  return base;
}

export function PrintableServiceReceipt({
  order,
  isCustomerCopy = false,
}: {
  order: PrintableReceiptOrder;
  isCustomerCopy?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  const totalCharges = (order.charges || []).reduce(
    (sum, chg) => sum + chg.unitPrice * (chg.qty || 1),
    0
  );
  const totalPaid = (order.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const remaining = Math.max(0, totalCharges - totalPaid);

  const statusText =
    totalCharges === 0
      ? { text: 'BELUM DITAGIH', cls: 'text-slate-600' }
      : remaining === 0
      ? { text: 'LUNAS', cls: 'text-emerald-700' }
      : { text: 'BELUM LUNAS', cls: 'text-amber-700' };

  const printDateText = formatDate(new Date());
  const vehicleTitle = [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(' ') || '-';

  return createPortal(
    <div className="print-only print-nota-portal bg-white text-slate-900">
      <div className="mx-auto max-w-[780px] text-[10.5px] leading-relaxed text-slate-900">
        {/* KOP NOTA DATAR — LOGO SEJAJAR TENGAH, TANPA KOTAK */}
        <header className="flex items-center justify-between gap-6 border-b-2 border-slate-900 pb-3.5">
          <div className="flex items-center gap-4">
            <img
              src="/images/multitech-logo.png"
              alt="Logo CV Multitech"
              className="h-[58px] w-auto shrink-0 object-contain"
            />
            <div className="space-y-0.5">
              <h1 className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900">
                {WORKSHOP_PROFILE.name.toUpperCase()}
              </h1>
              <p className="max-w-sm text-[9.5px] font-semibold text-slate-700">
                {WORKSHOP_PROFILE.focus}
              </p>
              <p className="max-w-sm text-[9.5px] text-slate-600">{WORKSHOP_PROFILE.address}</p>
              <p className="text-[9.5px] font-medium text-slate-700">
                WhatsApp Layanan: {formatPhoneDisplay(WORKSHOP_PROFILE.whatsappNumber)}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {order.isWarrantyClaim
                ? 'Nota Klaim Garansi'
                : isCustomerCopy
                ? 'Salinan Nota Servis'
                : 'Nota Servis'}
            </p>
            <p className="font-mono text-2xl font-black leading-tight tracking-tight text-slate-900">
              #{order.code}
            </p>
            {order.isWarrantyClaim && order.warrantySourceCode && (
              <p className="text-[9px] font-bold text-emerald-700">
                Rujukan Nota #{order.warrantySourceCode}
              </p>
            )}
            <div className="mt-1 space-y-0.5 text-[9.5px] text-slate-600">
              <p>
                Masuk: <span className="font-semibold text-slate-900">{formatDate(order.receivedAt)}</span>
              </p>
              {order.estimatedDoneAt && (
                <p>
                  Est. Selesai:{' '}
                  <span className="font-semibold text-slate-900">
                    {formatDate(order.estimatedDoneAt)}
                  </span>
                </p>
              )}
              <p>
                Dicetak: <span className="font-semibold text-slate-900">{printDateText}</span>
              </p>
            </div>
          </div>
        </header>

        {/* IDENTITAS PELANGGAN & UNIT — TANPA KARTU */}
        <section className="border-b border-slate-200 py-3">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Informasi Pelanggan
              </p>
              <table className="w-full text-[10.5px]">
                <tbody>
                  <tr>
                    <td className="w-24 py-0.5 text-slate-600">Nama / PIC</td>
                    <td className="w-3 text-slate-400">:</td>
                    <td className="font-bold text-slate-900">{order.customerName}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-600">Kategori</td>
                    <td className="text-slate-400">:</td>
                    <td className="font-medium text-slate-800">
                      {order.customerType === 'MITRA' && order.workshopName
                        ? `Bengkel Mitra (${order.workshopName})`
                        : 'Pelanggan Perorangan'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-600">No. WhatsApp</td>
                    <td className="text-slate-400">:</td>
                    <td className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatPhoneDisplay(order.customerPhone)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Identitas Unit
              </p>
              <table className="w-full text-[10.5px]">
                <tbody>
                  <tr>
                    <td className="w-24 py-0.5 text-slate-600">Kendaraan / Unit</td>
                    <td className="w-3 text-slate-400">:</td>
                    <td className="font-bold text-slate-900">
                      {vehicleTitle}
                      {order.vehicleYear ? ` (${order.vehicleYear})` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-600">No. Polisi</td>
                    <td className="text-slate-400">:</td>
                    <td className="font-mono font-semibold text-slate-900">
                      {order.plateNumber || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-600">Jenis Masuk</td>
                    <td className="text-slate-400">:</td>
                    <td className="font-medium text-slate-800">{getServiceTypeLabel(order)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {order.conditionNotes && (
            <p className="mt-2.5 border-t border-slate-200/80 pt-2 text-[10px] italic text-slate-700">
              <span className="font-bold not-italic text-slate-900">Catatan Awal: </span>
              {order.conditionNotes}
            </p>
          )}
        </section>

        {/* DAFTAR MODUL & STATUS PENGERJAAN — TABEL TERBUKA GARIS HORIZONTAL */}
        <section className="mt-3.5 break-inside-avoid">
          <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
            Unit Modul &amp; Pengerjaan
          </p>
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-slate-900 text-left text-[9px] font-bold uppercase tracking-wider text-slate-600">
                <th className="w-8 py-1.5 pr-2 text-center">No</th>
                <th className="py-1.5 pr-3">Modul / Part Number</th>
                <th className="py-1.5 pr-3">Keluhan Teknis</th>
                <th className="w-28 py-1.5 pr-3">Status</th>
                <th className="w-20 py-1.5 text-right">Garansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              {order.items.map((item, idx) => {
                const statusLabel = getStatusMeta(item.status as never).label;
                const warranty = item.warrantyMonths ?? 0;
                return (
                  <tr key={item.id}>
                    <td className="py-2 pr-2 text-center font-mono text-slate-600">{idx + 1}</td>
                    <td className="py-2 pr-3">
                      <p className="font-bold text-slate-900">{item.moduleName}</p>
                      {item.moduleDetail && (
                        <p className="font-mono text-[9.5px] text-slate-600">{item.moduleDetail}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-800">{item.complaint}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-900">{statusLabel}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-slate-900">
                      {warranty > 0 ? (
                        <div>
                          <span>{warranty} Bulan</span>
                          {item.warrantyUntil && (
                            <p className="text-[8.5px] font-normal text-slate-600">
                              s.d. {formatDate(item.warrantyUntil)}
                            </p>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* TABEL RINCIAN BIAYA JASA & SPAREPART — TABEL TERBUKA */}
        <section className="mt-4 break-inside-avoid">
          <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-700">
            Rincian Biaya Jasa &amp; Sparepart
          </p>
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-slate-900 text-left text-[9px] font-bold uppercase tracking-wider text-slate-600">
                <th className="w-8 py-1.5 pr-2 text-center">No</th>
                <th className="w-24 py-1.5 pr-3">Kategori</th>
                <th className="py-1.5 pr-3">Uraian Pekerjaan / Komponen</th>
                <th className="w-12 py-1.5 pr-3 text-center">Qty</th>
                <th className="w-28 py-1.5 pr-3 text-right">Harga Satuan</th>
                <th className="w-28 py-1.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {order.charges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-center italic text-slate-600">
                    Rincian biaya jasa dan komponen belum diinput (menunggu hasil diagnosa / persetujuan).
                  </td>
                </tr>
              ) : (
                order.charges.map((chg, idx) => {
                  const qty = chg.qty || 1;
                  const sub = chg.unitPrice * qty;
                  return (
                    <tr key={chg.id}>
                      <td className="py-2 pr-2 text-center font-mono text-slate-600">{idx + 1}</td>
                      <td className="py-2 pr-3 font-medium text-slate-700">
                        {CHARGE_KIND_LABEL[chg.kind || ''] || chg.kind || 'Biaya'}
                      </td>
                      <td className="py-2 pr-3 font-medium text-slate-900">{chg.description}</td>
                      <td className="py-2 pr-3 text-center font-mono tabular-nums">{qty}</td>
                      <td className="py-2 pr-3 text-right font-mono tabular-nums text-slate-700">
                        {formatRupiah(chg.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-mono font-bold tabular-nums text-slate-900">
                        {formatRupiah(sub)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {/* RINGKASAN PEMBAYARAN & KETENTUAN — TERBUKA TANPA KOTAK */}
        <section className="mt-4 grid grid-cols-12 gap-8 break-inside-avoid">
          <div className="col-span-7 space-y-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Riwayat Pembayaran Diterima
              </p>
              {order.payments.length === 0 ? (
                <p className="mt-1 text-[10px] text-slate-600">
                  Belum ada catatan pembayaran masuk.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-slate-200 text-[10px]">
                  {order.payments.map((pay) => (
                    <li key={pay.id} className="flex items-center justify-between py-1">
                      <span className="text-slate-700">
                        {formatDate(pay.paidAt)} ({PAYMENT_METHOD_LABEL[pay.method] || pay.method})
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900">
                        {formatRupiah(pay.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-200 pt-2.5 text-[9.5px] text-slate-600">
              <p className="font-bold uppercase tracking-wider text-slate-700">
                Ketentuan Servis &amp; Garansi
              </p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>
                  Garansi berlaku sesuai durasi modul di atas untuk keluhan yang sama dengan menunjukkan nota{' '}
                  <span className="font-mono font-bold text-slate-800">#{order.code}</span>.
                </li>
                <li>
                  Garansi tidak berlaku bila segel rusak atau terjadi korsleting kelistrikan eksternal di luar modul yang diperbaiki.
                </li>
                <li>
                  Cek progres dan status unit kapan saja dengan kode servis{' '}
                  <span className="font-mono font-bold text-slate-800">#{order.code}</span> (ID:{' '}
                  <span className="font-mono">{order.publicId}</span>).
                </li>
              </ol>
            </div>
          </div>

          <div className="col-span-5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600">Total Tagihan</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">
                {formatRupiah(totalCharges)}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600">Pembayaran Masuk</span>
              <span className="font-mono font-bold tabular-nums text-slate-900">
                - {formatRupiah(totalPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-slate-900 pt-2 text-xs font-black">
              <span>{remaining > 0 ? 'Sisa Tagihan' : 'Total Akhir'}</span>
              <span className="font-mono tabular-nums text-slate-900">
                {totalCharges === 0
                  ? 'Belum ditagih'
                  : remaining === 0
                  ? 'Rp 0'
                  : formatRupiah(remaining)}
              </span>
            </div>
            <div className="pt-1 text-right text-[10px]">
              <span className="font-semibold text-slate-500">Status: </span>
              <span className={`font-extrabold tracking-wide ${statusText.cls}`}>
                {statusText.text}
              </span>
            </div>
          </div>
        </section>

        {/* TANDA TANGAN */}
        <footer className="mt-8 grid grid-cols-2 gap-12 break-inside-avoid text-center text-[10.5px]">
          <div className="flex flex-col items-center">
            <p className="text-slate-600">Pelanggan / Penerima Unit,</p>
            <div className="h-12" />
            <p className="min-w-[180px] border-t border-slate-800 pt-1.5 font-bold text-slate-900">
              {order.customerName}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-slate-600">
              {WORKSHOP_PROFILE.city}, {printDateText} · Hormat Kami, {WORKSHOP_PROFILE.name}
            </p>
            <div className="h-12" />
            <p className="min-w-[180px] border-t border-slate-800 pt-1.5 font-bold text-slate-900">
              Admin / Kepala Teknisi
            </p>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
