'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  MessageSquare,
  FileDown,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ItemStatus } from '@prisma/client';
import { BrandLogo } from '@/components/shared/BrandLogo';
import {
  PROGRESS_STEPS,
  WORKSHOP_PROFILE,
  getProgressStepIndex,
  getStatusMeta,
  getUnitModelImage,
  getVehicleHeroImage,
} from '@/lib/status';
import { formatRupiah } from '@/lib/utils';

interface TrackingOrderProp {
  id: string;
  publicId: string;
  code: string;
  customer: {
    name: string;
    phone: string;
    type: string;
    workshopName: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number | null;
  } | null;
  intakeType: string;
  unitCategory?: string;
  receivedAt: string | Date;
  estimatedDoneAt: string | Date | null;
  conditionNotes: string | null;
  items: Array<{
    id: string;
    moduleType: { name: string };
    moduleDetail: string | null;
    complaint: string;
    status: string;
    warrantyMonths: number | null;
    logs: Array<{
      id: string;
      createdAt: string | Date;
      note: string | null;
      photoUrl: string | null;
    }>;
  }>;
  charges: Array<{
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    paidAt: string | Date;
  }>;
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

export function TrackingDetailClient({ order }: { order: TrackingOrderProp }) {
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!activePhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePhoto]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(order.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCost = (order.charges || []).reduce(
    (acc, c) => acc + c.unitPrice * (c.qty || 1),
    0
  );
  const totalPaid = (order.payments || []).reduce(
    (acc, p) => acc + (p.amount || 0),
    0
  );
  const balanceDue = Math.max(0, totalCost - totalPaid);

  const primaryStatus = (order.items[0]?.status as ItemStatus) || ItemStatus.DITERIMA;
  const statusMeta = getStatusMeta(primaryStatus);
  const heroVehiclePhoto = getVehicleHeroImage(
    order.vehicle?.brand,
    order.vehicle?.model,
    order.unitCategory
  );

  const waMessage = encodeURIComponent(
    `Halo CV Multitech Tasikmalaya, saya ingin konfirmasi progres servis unit *${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}* (Kode Nota: *#${order.code}*).`
  );
  const waUrl = `https://wa.me/${WORKSHOP_PROFILE.whatsappNumber}?text=${waMessage}`;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20 pt-1">
      {/* Header Nota Khusus Cetak */}
      <div className="hidden border-b border-slate-200 pb-4 print:flex print:items-center print:justify-between">
        <BrandLogo href="" />
        <div className="text-right text-xs">
          <p className="font-bold text-slate-900">Nota Servis #{order.code}</p>
          <p className="max-w-xs text-slate-600">{WORKSHOP_PROFILE.address}</p>
        </div>
      </div>

      {/* Top Bar Navigation */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 tap-bounce dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Antrean</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 font-mono text-xs font-bold text-slate-800 shadow-sm transition-all tap-bounce hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
            title="Salin Kode Nota"
          >
            <span>#{order.code}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            )}
          </button>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} aria-hidden="true" />
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Vehicle Overview Card */}
      <div className="ios-glass-card rounded-[28px] p-5">
        <button
          type="button"
          onClick={() => {
            setPhotoError(false);
            setActivePhoto(heroVehiclePhoto.src);
          }}
          aria-label={`Perbesar foto ${heroVehiclePhoto.caption}`}
          className="group relative mb-4 block w-full overflow-hidden rounded-2xl border border-black/[0.05] bg-slate-100 text-left tap-bounce dark:border-white/[0.08] dark:bg-black/30"
        >
          <img
            src={heroVehiclePhoto.src}
            alt={`Foto ${heroVehiclePhoto.caption}`}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-48"
          />
          <span className="absolute bottom-2.5 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
            Ketuk Perbesar
          </span>
        </button>

        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            {order.vehicle?.brand} {order.vehicle?.model}
          </h1>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-slate-600 dark:text-slate-400">
              {order.vehicle?.year ? `Tahun ${order.vehicle.year}` : 'Unit Servis'}
              {order.customer.workshopName ? ` · ${order.customer.workshopName}` : ''}
            </p>

            <div className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-300">
              {order.customer.name}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <div>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Diterima</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIndo(order.receivedAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Estimasi Selesai</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {formatDateIndo(order.estimatedDoneAt)}
            </p>
          </div>
        </div>

        {order.conditionNotes && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-black/30 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Catatan Masuk: </span>
            {order.conditionNotes}
          </div>
        )}
      </div>

      {/* Modules & Progress Steppers */}
      <div className="space-y-3">
        <h2 className="px-1 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Modul & Progres Pengerjaan
        </h2>

        {order.items.map((item) => {
          const itemStatus = item.status as ItemStatus;
          const currentIndex = getProgressStepIndex(itemStatus);
          const isCancelled = itemStatus === ItemStatus.BATAL;
          const itemModelPhoto = getUnitModelImage(item.moduleType.name, order.unitCategory);

          return (
            <div
              key={item.id}
              className="ios-glass-card space-y-4 rounded-[28px] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoError(false);
                      setActivePhoto(itemModelPhoto.src);
                    }}
                    aria-label={`Lihat foto model ${item.moduleType.name}`}
                    className="h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-slate-100 tap-bounce dark:border-white/[0.08] dark:bg-black/30"
                  >
                    <img
                      src={itemModelPhoto.src}
                      alt={item.moduleType.name}
                      className="h-full w-full object-cover"
                    />
                  </button>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.moduleType.name}
                    </h3>
                    {item.moduleDetail && (
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.moduleDetail}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-600 dark:text-slate-400">Keluhan: </span>
                      {item.complaint}
                    </p>
                  </div>
                </div>

                {item.warrantyMonths ? (
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                    <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Garansi {item.warrantyMonths} Bln</span>
                  </div>
                ) : null}
              </div>

              {!isCancelled ? (
                <div className="pt-1">
                  <div className="grid grid-cols-5 gap-1.5">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const isDone =
                        itemStatus === ItemStatus.SELESAI || idx < currentIndex;
                      const isCurrent =
                        itemStatus !== ItemStatus.SELESAI && idx === currentIndex;

                      return (
                        <div key={step.key} className="space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isDone
                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                : isCurrent
                                ? 'bg-blue-600 dark:bg-blue-500'
                                : 'bg-slate-200 dark:bg-white/15'
                            }`}
                          />
                          <p
                            className={`text-center text-[10px] leading-tight ${
                              isCurrent
                                ? 'font-bold text-blue-700 dark:text-blue-400'
                                : isDone
                                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                : 'font-medium text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  Pengerjaan modul ini dibatalkan.
                </div>
              )}

              {item.logs && item.logs.length > 0 && (
                <div className="border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Aktivitas Terbaru
                  </p>
                  <div className="space-y-3">
                    {item.logs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-xs">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-500 dark:bg-slate-400" />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                            <span>{formatDateIndo(log.createdAt)}</span>
                            <span className="font-mono">{formatTimeIndo(log.createdAt)}</span>
                          </div>
                          {log.note && (
                            <p className="text-slate-800 dark:text-slate-200">{log.note}</p>
                          )}

                          {log.photoUrl && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPhotoError(false);
                                  setActivePhoto(log.photoUrl);
                                }}
                                className="group relative overflow-hidden rounded-xl border border-black/[0.06] tap-bounce dark:border-white/[0.08]"
                              >
                                <img
                                  src={log.photoUrl}
                                  alt="Dokumentasi Teknis"
                                  className="h-24 w-40 object-cover transition-transform duration-300 group-hover:scale-105"
                                />
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
        <div className="ios-glass-card space-y-3 rounded-[28px] p-5">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Rincian Biaya
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {order.charges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                <span className="text-slate-700 dark:text-slate-300">{charge.description}</span>
                <span className="shrink-0 font-mono font-semibold text-slate-900 dark:text-white">
                  {formatRupiah(charge.unitPrice * (charge.qty || 1))}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-slate-200/80 pt-3 dark:border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">Total Biaya</span>
              <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                {formatRupiah(totalCost)}
              </span>
            </div>

            {totalPaid > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                <span>DP / Pembayaran Masuk</span>
                <span className="font-mono font-semibold">- {formatRupiah(totalPaid)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-white/[0.06]">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {balanceDue > 0 ? 'Sisa Tagihan' : 'Status'}
              </span>
              <span
                className={`font-mono font-black ${
                  balanceDue > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {balanceDue > 0 ? formatRupiah(balanceDue) : 'Lunas'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Buttons */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="mx-auto flex max-w-lg gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white py-3.5 text-xs font-bold text-slate-800 shadow-xl backdrop-blur-2xl transition-transform tap-bounce hover:bg-slate-50 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            <span>Nota PDF</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white shadow-xl backdrop-blur-2xl transition-transform tap-bounce hover:bg-black dark:bg-white dark:text-black"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>Hubungi CS</span>
          </a>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-backdrop-in"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto pengerjaan"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-lg overflow-hidden rounded-3xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              aria-label="Tutup foto"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {photoError ? (
              <div className="flex h-60 w-80 items-center justify-center p-6 text-center text-xs text-slate-300">
                Gambar dokumentasi gagal dimuat.
              </div>
            ) : (
              <img
                src={activePhoto}
                alt="Bukti Pengerjaan Full"
                onError={() => setPhotoError(true)}
                className="max-h-[80vh] w-auto object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
