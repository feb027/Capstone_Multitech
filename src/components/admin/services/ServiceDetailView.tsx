'use client';

import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { ItemStatus } from '@prisma/client';
import { MockServiceOrder, getDefaultBeforeAfter } from '@/lib/frontend-mock';
import { isWarrantyEligible } from '@/lib/business-rules';
import {
  PROGRESS_STEPS,
  getProgressStepIndex,
  getStatusMeta,
  getVehicleHeroImage,
} from '@/lib/status';
import { formatDate, formatRupiah } from '@/lib/utils';
import { Check, Maximize2, ShieldCheck, Pencil, ExternalLink, RotateCcw } from 'lucide-react';
import { calcTotalPaid, calcTotalCharges } from './service-utils';

export interface ServiceDetailViewProps {
  editOrder: MockServiceOrder;
  setSelectedOrder: Dispatch<SetStateAction<MockServiceOrder | null>>;
  setModalMode?: Dispatch<SetStateAction<'DETAIL' | 'EDIT'>>;
  setActiveLightboxPhoto: Dispatch<SetStateAction<string | null>>;
  onCreateWarrantyClaim?: (orderId: string, itemId: string) => Promise<void> | void;
  claimingItemId?: string | null;
  editHref?: string;
  hideFooter?: boolean;
}

export function ServiceDetailView({
  editOrder,
  setSelectedOrder,
  setModalMode,
  setActiveLightboxPhoto,
  onCreateWarrantyClaim,
  claimingItemId,
  editHref,
  hideFooter = false,
}: ServiceDetailViewProps) {
  const heroPhoto =
    editOrder.customPhotoUrl ||
    getVehicleHeroImage(
      editOrder.vehicleBrand,
      editOrder.vehicleModel,
      editOrder.unitCategory
    ).src;

  const totalCharges = calcTotalCharges(editOrder);
  const totalPaid = calcTotalPaid(editOrder);
  const remaining = Math.max(0, totalCharges - totalPaid);

  const paymentSummary =
    totalCharges === 0
      ? { label: 'Belum ditagih', textClass: 'text-slate-600 dark:text-slate-400' }
      : remaining === 0
      ? { label: 'Lunas', textClass: 'text-emerald-700 dark:text-emerald-400' }
      : totalPaid > 0
      ? { label: `DP ${formatRupiah(totalPaid)}`, textClass: 'text-blue-700 dark:text-blue-400' }
      : { label: 'Belum bayar', textClass: 'text-amber-800 dark:text-amber-300' };

  return (
    <div className="space-y-4">
      {/* Compact Vehicle + Billing Overview Card */}
      <div className="ios-glass-inner rounded-[22px] p-3.5 sm:p-4">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => setActiveLightboxPhoto(heroPhoto)}
            aria-label={`Perbesar foto ${editOrder.vehicleBrand} ${editOrder.vehicleModel}`}
            title="Klik untuk memperbesar foto unit"
            className="group relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-black/[0.06] bg-slate-900 sm:h-28 sm:w-40 dark:border-white/[0.08]"
          >
            <img
              src={heroPhoto}
              alt={`${editOrder.vehicleBrand} ${editOrder.vehicleModel}`}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              <Maximize2 className="h-3 w-3" aria-hidden="true" />
              <span>Foto</span>
            </span>
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    {editOrder.vehicleBrand} {editOrder.vehicleModel}
                  </h3>
                  {editOrder.isWarrantyClaim && (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Klaim Garansi{editOrder.warrantySourceCode ? ` #${editOrder.warrantySourceCode}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {editOrder.vehicleYear ? `Tahun ${editOrder.vehicleYear}` : 'Unit Servis'}
                  {editOrder.plateNumber ? ` · ${editOrder.plateNumber}` : ''}
                  {editOrder.workshopName ? ` · ${editOrder.workshopName}` : ''}
                  {editOrder.entryMethod === 'EKSPEDISI'
                    ? ` · Ekspedisi${editOrder.trackingNumber ? ` (${editOrder.trackingNumber})` : ''}`
                    : ' · Datang Langsung'}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {editOrder.customerName}
                </p>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  +{editOrder.customerPhone}
                </p>
              </div>
            </div>

            {editOrder.conditionNotes && (
              <div className="rounded-xl bg-black/[0.035] px-3 py-2 text-xs leading-relaxed text-slate-700 dark:bg-white/[0.05] dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">Catatan Masuk: </span>
                {editOrder.conditionNotes}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-black/[0.06] pt-3 text-xs sm:grid-cols-4 dark:border-white/[0.08]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Diterima
            </span>
            <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
              {formatDate(editOrder.receivedAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Est. Selesai
            </span>
            <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
              {editOrder.estimatedDoneAt ? formatDate(editOrder.estimatedDoneAt) : '-'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Biaya
            </span>
            <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
              {formatRupiah(totalCharges)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Status Bayar
            </span>
            <p className={`mt-0.5 font-bold ${paymentSummary.textClass}`}>
              {paymentSummary.label}
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Modul: Tahap Visual + Foto Before & After + Log Pengerjaan */}
      {editOrder.items.map((item) => {
        const statusMeta = getStatusMeta(item.status);
        const stepIdx = getProgressStepIndex(item.status);
        const isCancelled = item.status === ItemStatus.BATAL;
        const isDone = item.status === ItemStatus.SELESAI;
        const defaults = getDefaultBeforeAfter(item.moduleName, editOrder.unitCategory);
        const beforePhoto = item.beforePhotoUrl || defaults.beforePhotoUrl;
        const afterPhoto = item.afterPhotoUrl || defaults.afterPhotoUrl;
        const beforeText = item.beforeCaption || defaults.beforeCaption;
        const afterText = item.afterCaption || defaults.afterCaption;

        const hasStagePhotos = item.logs.some((log) => Boolean(log.photoUrl));

        return (
          <div key={item.id} className="space-y-3.5 rounded-[22px] border border-black/[0.07] bg-slate-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            {/* Header Modul */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {item.moduleName}
                  </h4>
                  <span
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-center text-[10px] font-bold leading-none ${statusMeta.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusMeta.dotClass}`} />
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
                {item.moduleDetail && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {item.moduleDetail}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Keluhan:{' '}
                  </span>
                  {item.complaint}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {item.warrantyMonths > 0 && (
                  <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold leading-none text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    <span>
                      Garansi {item.warrantyMonths} Bln
                      {item.warrantyUntil ? ` (s.d. ${formatDate(item.warrantyUntil)})` : ''}
                    </span>
                  </span>
                )}
                {onCreateWarrantyClaim && isWarrantyEligible(item) && (
                  <button
                    type="button"
                    disabled={claimingItemId === item.id}
                    onClick={() => onCreateWarrantyClaim(editOrder.id, item.id)}
                    className="inline-flex min-h-[30px] shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>{claimingItemId === item.id ? 'Memproses...' : 'Buat Klaim Garansi'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress 6 Tahap Visual */}
            {!isCancelled ? (
              <div className="rounded-2xl bg-white p-3 border border-black/[0.05] dark:border-white/[0.06] dark:bg-black/25">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Tahapan Pengerjaan
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-1.5">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const stepDone = isDone || idx < stepIdx;
                    const stepCurrent = !isDone && idx === stepIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            stepDone
                              ? 'bg-emerald-600 text-white'
                              : stepCurrent
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
                              : 'bg-slate-200 text-slate-600 dark:bg-white/15 dark:text-slate-300'
                          }`}
                        >
                          {stepDone ? <Check className="h-3 w-3" aria-hidden="true" /> : idx + 1}
                        </div>
                        <div
                          className={`mt-1.5 h-1.5 w-full rounded-full ${
                            stepDone
                              ? 'bg-emerald-600'
                              : stepCurrent
                              ? 'bg-blue-600'
                              : 'bg-slate-200 dark:bg-white/15'
                          }`}
                        />
                        <span
                          className={`mt-1 text-[10px] leading-tight ${
                            stepCurrent
                              ? 'font-bold text-blue-700 dark:text-blue-400'
                              : stepDone
                              ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-red-500/15 p-3 text-xs font-bold text-red-700 dark:text-red-300">
                <p>Pengerjaan modul ini dibatalkan.</p>
                {item.cancelReason && (
                  <p className="mt-1 font-normal text-red-600 dark:text-red-300/90">
                    Alasan: {item.cancelReason}
                  </p>
                )}
              </div>
            )}

            {/* Linimasa Progres & Dokumentasi Per Tahap */}
            {item.logs.length > 0 && (
              <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Linimasa Progres &amp; Dokumentasi
                </p>
                <div className="space-y-2.5">
                  {item.logs.map((log) => {
                    const logMeta = log.stage ? getStatusMeta(log.stage) : null;
                    return (
                      <div key={log.id} className="flex gap-2.5 text-xs">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {logMeta && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none ${logMeta.badgeClass}`}
                              >
                                {logMeta.shortLabel}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {formatDate(log.createdAt)}
                            </span>
                            {!log.isPublic && (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                                Privat (Internal)
                              </span>
                            )}
                          </div>
                          {log.note && (
                            <p className="text-slate-800 dark:text-slate-200">{log.note}</p>
                          )}
                          {log.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setActiveLightboxPhoto(log.photoUrl || null)}
                              className="mt-1 block overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                            >
                              <img
                                src={log.photoUrl}
                                alt="Bukti pengerjaan"
                                className="h-24 w-40 object-cover"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dokumentasi Before & After (tampil jika belum ada foto per-tahap atau ada foto custom khusus) */}
            {!hasStagePhotos && (
              <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Dokumentasi Before &amp; After Perbaikan
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-2.5 dark:bg-amber-950/20">
                    <span className="inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      BEFORE · Kondisi Awal
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveLightboxPhoto(beforePhoto)}
                      aria-label={`Perbesar foto before ${item.moduleName}`}
                      className="mt-2 block w-full overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                    >
                      <img
                        src={beforePhoto}
                        alt={`Before ${item.moduleName}`}
                        className="h-24 w-full object-cover transition-transform hover:scale-105"
                      />
                    </button>
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                      {beforeText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5 dark:bg-emerald-950/20">
                    <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      AFTER · Setelah Diperbaiki
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveLightboxPhoto(afterPhoto)}
                      aria-label={`Perbesar foto after ${item.moduleName}`}
                      className="mt-2 block w-full overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                    >
                      <img
                        src={afterPhoto}
                        alt={`After ${item.moduleName}`}
                        className="h-24 w-full object-cover transition-transform hover:scale-105"
                      />
                    </button>
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                      {afterText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Rincian Biaya & Pembayaran (Read-Only) */}
      <div className="ios-glass-inner space-y-3 rounded-[22px] p-4">
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Rincian Biaya &amp; Pembayaran
          </h4>
          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
            Total: {formatRupiah(totalCharges)}
          </span>
        </div>

        {editOrder.charges.length === 0 ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Belum ada rincian biaya yang diinput.
          </p>
        ) : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {editOrder.charges.map((chg) => (
              <div key={chg.id} className="flex items-center justify-between py-2 text-xs">
                <div className="min-w-0 pr-2">
                  <span className="mr-1.5 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-white/[0.1] dark:text-slate-300">
                    {chg.kind}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {chg.description}
                  </span>
                </div>
                <span className="shrink-0 font-mono font-bold text-slate-900 dark:text-white">
                  {formatRupiah(chg.unitPrice * chg.qty)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2 text-xs font-bold dark:bg-white/[0.04]">
          <span className="text-slate-600 dark:text-slate-400">
            Sudah Dibayar: {formatRupiah(totalPaid)}
          </span>
          <span className={paymentSummary.textClass}>
            {totalCharges === 0
              ? 'Belum ditagih'
              : remaining <= 0
              ? 'Lunas'
              : `Sisa ${formatRupiah(remaining)}`}
          </span>
        </div>
      </div>

      {/* Standalone Footer (when rendered outside fixed modal shell) */}
      {!hideFooter && (
        <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="inline-flex min-h-[44px] items-center rounded-full bg-black/[0.06] px-5 text-xs font-bold text-slate-800 hover:bg-black/10 dark:bg-white/[0.1] dark:text-white dark:hover:bg-white/[0.16]"
          >
            Tutup
          </button>
          {editHref ? (
            <Link
              href={editHref}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Buka &amp; Edit di Halaman Servis</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setModalMode?.('EDIT')}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Pengerjaan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
