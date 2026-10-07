'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  MessageSquare, 
  FileDown, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Calendar,
  X,
  Share2
} from 'lucide-react';
import { ItemStatus } from '@prisma/client';

const STATUS_STEPS = [
  { key: ItemStatus.DITERIMA, label: 'Diterima' },
  { key: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { key: ItemStatus.PERBAIKAN, label: 'Pengerjaan' },
  { key: ItemStatus.UJI_QC, label: 'Uji & QC' },
  { key: ItemStatus.SIAP_DIAMBIL, label: 'Siap Ambil' },
];

function getStatusStepIndex(status: ItemStatus): number {
  switch (status) {
    case ItemStatus.DITERIMA:
      return 0;
    case ItemStatus.DIAGNOSA:
      return 1;
    case ItemStatus.PERBAIKAN:
      return 2;
    case ItemStatus.UJI_QC:
      return 3;
    case ItemStatus.SIAP_DIAMBIL:
    case ItemStatus.SELESAI:
      return 4;
    default:
      return 0;
  }
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateIndo(dateInput: string | Date | null): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeIndo(dateInput: string | Date | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TrackingDetailClient({ order }: { order: any }) {
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate pricing totals
  const totalCost = (order.charges || []).reduce(
    (acc: number, c: any) => acc + (c.unitPrice * (c.qty || 1)),
    0
  );
  const totalPaid = (order.payments || []).reduce(
    (acc: number, p: any) => acc + (p.amount || 0),
    0
  );
  const balanceDue = Math.max(0, totalCost - totalPaid);

  // Overall status tag
  const isAnyReady = order.items.some((i: any) => i.status === ItemStatus.SIAP_DIAMBIL);
  const isAnyRepairing = order.items.some((i: any) => i.status === ItemStatus.PERBAIKAN);

  const statusBadge = isAnyReady
    ? { label: 'Siap Diambil', bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' }
    : isAnyRepairing
    ? { label: 'Sedang Dikerjakan', bg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' }
    : { label: 'Dalam Diagnosa', bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' };

  // WhatsApp CS URL
  const waMessage = encodeURIComponent(
    `Halo Multitech Auto Electronics, saya ingin konfirmasi progres servis unit *${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}* (Kode Nota: *#${order.code}*).`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waMessage}`;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20 pt-1">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 tap-bounce dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Antrean</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Service Code Pill with Click-to-Copy */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 py-1 text-xs font-mono font-bold text-slate-800 shadow-sm transition-all tap-bounce hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
            title="Salin Kode Nota"
          >
            <span>#{order.code}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 text-slate-400" />
            )}
          </button>

          {/* Status Badge */}
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Vehicle Overview Card */}
      <div className="rounded-[28px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {order.vehicle?.brand} {order.vehicle?.model}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {order.vehicle?.year ? `Tahun ${order.vehicle.year}` : ''} {order.vehicle?.plateNumber ? `• ${order.vehicle.plateNumber}` : ''}
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {order.intakeType === 'MOBIL_UTUH' ? 'Mobil Utuh' : 'Modul Saja'}
          </div>
        </div>

        {/* Date Milestones Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <div>
            <span className="text-[10px] font-medium text-slate-400">Diterima</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIndo(order.receivedAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400">Estimasi Selesai</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIndo(order.estimatedDoneAt)}
            </p>
          </div>
        </div>

        {order.conditionNotes && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-black/30 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-white">Catatan Masuk: </span>
            {order.conditionNotes}
          </div>
        )}
      </div>

      {/* Modules & Progress Steppers */}
      <div className="space-y-3">
        <h2 className="px-1 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Modul & Progres Pengerjaan
        </h2>

        {order.items.map((item: any) => {
          const currentIndex = getStatusStepIndex(item.status);

          return (
            <div
              key={item.id}
              className="space-y-4 rounded-[28px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
            >
              {/* Module Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {item.moduleType.name}
                  </h3>
                  {item.moduleDetail && (
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {item.moduleDetail}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium text-slate-400">Keluhan: </span>
                    {item.complaint}
                  </p>
                </div>

                {item.warrantyMonths && (
                  <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>Garansi {item.warrantyMonths} Bln</span>
                  </div>
                )}
              </div>

              {/* Apple-Style Minimal Progress Stepper */}
              <div className="pt-1">
                {/* Visual Segments */}
                <div className="grid grid-cols-5 gap-1.5">
                  {STATUS_STEPS.map((step, idx) => {
                    const isPassed = idx < currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div key={step.key} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isPassed
                              ? 'bg-slate-900 dark:bg-white'
                              : isCurrent
                              ? 'bg-blue-600 dark:bg-blue-400'
                              : 'bg-slate-100 dark:bg-white/10'
                          }`}
                        />
                        <p
                          className={`text-center text-[10px] font-semibold leading-tight ${
                            isCurrent
                              ? 'font-bold text-blue-600 dark:text-blue-400'
                              : isPassed
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Logs (Work Notes) */}
              {item.logs && item.logs.length > 0 && (
                <div className="border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Aktivitas Terbaru
                  </p>
                  <div className="space-y-3">
                    {item.logs.map((log: any) => (
                      <div key={log.id} className="flex gap-3 text-xs">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400 dark:bg-slate-600" />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{formatDateIndo(log.createdAt)}</span>
                            <span>{formatTimeIndo(log.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{log.note}</p>

                          {/* Technical Photo Thumbnail */}
                          {log.photoUrl && (
                            <div className="pt-1">
                              <button
                                onClick={() => setActivePhoto(log.photoUrl)}
                                className="group relative overflow-hidden rounded-xl border border-black/[0.06] tap-bounce dark:border-white/[0.08]"
                              >
                                <img
                                  src={log.photoUrl}
                                  alt="Dokumentasi Teknis"
                                  className="h-24 w-40 object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                    Perbesar Foto
                                  </span>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transparent Cost Breakdown */}
      {order.charges && order.charges.length > 0 && (
        <div className="space-y-3 rounded-[28px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Rincian Biaya
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {order.charges.map((charge: any) => (
              <div key={charge.id} className="flex items-center justify-between py-2 text-xs">
                <span className="text-slate-600 dark:text-slate-300">{charge.description}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(charge.unitPrice * (charge.qty || 1))}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/80 pt-3 dark:border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Total Biaya</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiah(totalCost)}
              </span>
            </div>

            {totalPaid > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>DP / Pembayaran Masuk</span>
                <span className="font-semibold">- {formatRupiah(totalPaid)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-white/[0.06]">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {balanceDue > 0 ? 'Sisa Tagihan' : 'Status'}
              </span>
              <span className={`font-black ${balanceDue > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                {balanceDue > 0 ? formatRupiah(balanceDue) : 'Lunas'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="mx-auto flex max-w-lg gap-2 pointer-events-auto">
          {/* Download Nota PDF */}
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white py-3.5 text-xs font-bold text-slate-800 shadow-xl backdrop-blur-2xl transition-transform tap-bounce hover:bg-slate-50 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
          >
            <FileDown className="h-4 w-4" />
            <span>Nota PDF</span>
          </button>

          {/* WhatsApp CS Link */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-xl backdrop-blur-2xl transition-transform tap-bounce hover:bg-black dark:bg-white dark:text-black"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Hubungi CS</span>
          </a>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-backdrop-in"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg overflow-hidden rounded-3xl bg-black">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={activePhoto}
              alt="Bukti Pengerjaan Full"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
