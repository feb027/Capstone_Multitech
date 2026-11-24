'use client';

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { MockServiceOrder } from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { Check, Copy, ExternalLink, MessageCircle, Printer, X } from 'lucide-react';
import { ServiceDetailView } from './ServiceDetailView';
import { getWaLink } from './service-utils';
import { PrintableServiceReceipt } from '@/components/shared/PrintableServiceReceipt';

export interface ServicePreviewModalProps {
  selectedOrder: MockServiceOrder | null;
  setSelectedOrder: Dispatch<SetStateAction<MockServiceOrder | null>>;
}

export function ServicePreviewModal({
  selectedOrder,
  setSelectedOrder,
}: ServicePreviewModalProps) {
  const { createWarrantyClaim } = useDataset();
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    setCopiedTracking(false);
    setClaimError(null);
  }, [selectedOrder?.id]);

  const handleCreateWarrantyClaim = async (orderId: string, itemId: string) => {
    setClaimError(null);
    setClaimingItemId(itemId);
    const res = await createWarrantyClaim(orderId, itemId);
    setClaimingItemId(null);
    if (!res.ok) {
      setClaimError(res.error || 'Gagal membuat order klaim garansi.');
      return;
    }
    if (res.createdOrder) {
      setSelectedOrder(res.createdOrder);
    }
  };

  useEffect(() => {
    if (!selectedOrder && !activeLightboxPhoto) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeLightboxPhoto) {
        setActiveLightboxPhoto(null);
      } else if (selectedOrder) {
        setSelectedOrder(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedOrder, activeLightboxPhoto, setSelectedOrder]);

  const handleCopyTrackingLink = async () => {
    if (!selectedOrder || typeof window === 'undefined') return;
    const url = `${window.location.origin}/track/${selectedOrder.publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2200);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  if (!selectedOrder && !activeLightboxPhoto) return null;

  return (
    <>
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-order-popup-title"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] border border-black/[0.08] bg-white shadow-2xl sm:rounded-[32px] dark:border-white/[0.1] dark:bg-[#1C1C1E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-5 py-3.5 sm:px-6 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  id="service-order-popup-title"
                  className="font-mono text-sm font-black text-slate-900 dark:text-white sm:text-base"
                >
                  #{selectedOrder.code}
                </span>
                <span className="truncate rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-bold leading-none text-slate-700 dark:bg-white/[0.1] dark:text-slate-200">
                  {selectedOrder.vehicleBrand} {selectedOrder.vehicleModel}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyTrackingLink}
                  title="Salin link pelacakan publik untuk pelanggan"
                  aria-label="Salin link pelacakan publik"
                  className="ios-glass-inner inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-slate-700 transition-colors hover:bg-black/5 tap-bounce dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {copiedTracking ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-700 dark:text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Salin Link</span>
                    </>
                  )}
                </button>

                <a
                  href={getWaLink(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  title="Kirim Update WhatsApp ke Pelanggan"
                  aria-label="Kirim Update WhatsApp ke Pelanggan"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  title="Cetak Nota"
                  aria-label="Cetak Nota"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  aria-label="Tutup Dialog Detail Servis"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Middle Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {claimError && (
                <div
                  role="alert"
                  className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                >
                  {claimError}
                </div>
              )}
              <ServiceDetailView
                editOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
                setActiveLightboxPhoto={setActiveLightboxPhoto}
                onCreateWarrantyClaim={handleCreateWarrantyClaim}
                claimingItemId={claimingItemId}
                hideFooter
              />
            </div>

            {/* Fixed Non-Floating Modal Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-black/[0.06] bg-white px-5 py-3.5 sm:px-6 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <Link
                href={`/track/${selectedOrder.publicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tracking Pelanggan</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-black/[0.06] px-5 text-xs font-bold text-slate-800 transition-colors hover:bg-black/10 dark:bg-white/[0.1] dark:text-white dark:hover:bg-white/[0.16]"
                >
                  Tutup
                </button>
                <Link
                  href={`/admin/services?order=${selectedOrder.id}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Buka &amp; Edit di Halaman Servis</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && <PrintableServiceReceipt order={selectedOrder} />}

      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-2xl overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLightboxPhoto(null)}
              aria-label="Tutup pratinjau foto"
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <img
              src={activeLightboxPhoto}
              alt="Pratinjau foto servis"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
