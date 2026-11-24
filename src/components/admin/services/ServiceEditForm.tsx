'use client';

import { useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { CustomerType, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  MockProgressLog,
  MockServiceItem,
  MockServiceOrder,
  PARTNER_WORKSHOPS,
  normalizeWorkshopName,
} from '@/lib/frontend-mock';
import {
  PROGRESS_STEPS,
  SPECIAL_STAGE_STATUSES,
  getProgressStepIndex,
  getStatusMeta,
  getVehicleHeroImage,
  isSpecialStageStatus,
} from '@/lib/status';
import { formatDate, formatRupiah } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Camera,
  Check,
  AlertCircle,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import {
  IntakeChoice,
  calcTotalPaid,
  calcTotalCharges,
  readFileAsDataUrl,
} from './service-utils';

export interface ServiceEditFormProps {
  formId?: string;
  editOrder: MockServiceOrder;
  setEditOrder: Dispatch<SetStateAction<MockServiceOrder | null>>;
  setActiveLightboxPhoto: Dispatch<SetStateAction<string | null>>;
  newChargeKind: 'JASA' | 'SPAREPART' | 'DIAGNOSA';
  setNewChargeKind: Dispatch<SetStateAction<'JASA' | 'SPAREPART' | 'DIAGNOSA'>>;
  newChargeDesc: string;
  setNewChargeDesc: Dispatch<SetStateAction<string>>;
  newChargePrice: string;
  setNewChargePrice: Dispatch<SetStateAction<string>>;
  newPayAmount: string;
  setNewPayAmount: Dispatch<SetStateAction<string>>;
  newPayMethod: PaymentMethod;
  setNewPayMethod: Dispatch<SetStateAction<PaymentMethod>>;
  handleSaveOrderChanges: (e: FormEvent) => Promise<void>;
  handleAddCharge: () => void;
  handleDeleteCharge: (chargeId: string) => void;
  handleAddPayment: () => void;
  handleDeleteLog: (itemIdx: number, logId: string) => void;
  handleAddModuleToOrder: () => void;
}

type EditTab = 'work' | 'billing' | 'unit';

const STAGE_PLACEHOLDERS: Partial<Record<ItemStatus, string>> = {
  [ItemStatus.DITERIMA]: 'Contoh: Unit / modul diterima di bengkel dalam kondisi fisik utuh...',
  [ItemStatus.DIAGNOSA]: 'Contoh: Hasil pengecekan ditemukan jalur power / IC driver short...',
  [ItemStatus.PERBAIKAN]: 'Contoh: Penggantian komponen dan reballing jalur PCB sedang dikerjakan...',
  [ItemStatus.UJI_QC]: 'Contoh: Lolos uji bench test 12V & simulasi sinyal tanpa error...',
  [ItemStatus.SIAP_DIAMBIL]: 'Contoh: Unit sudah siap diambil atau siap dikirim via ekspedisi...',
  [ItemStatus.SELESAI]: 'Contoh: Unit sudah diserahkan ke pelanggan dan garansi aktif...',
  [ItemStatus.MENUNGGU_PERSETUJUAN]: 'Contoh: Menunggu konfirmasi estimasi biaya perbaikan dari pelanggan...',
  [ItemStatus.MENUNGGU_SPAREPART]: 'Contoh: Menunggu kedatangan komponen IC pengganti dari supplier...',
  [ItemStatus.BATAL]: 'Contoh: Alasan pembatalan pengerjaan unit...',
};

function findStageLog(item: MockServiceItem, stage: ItemStatus): MockProgressLog | undefined {
  const exact = item.logs.find((log) => log.stage === stage);
  if (exact) return exact;
  const metaLabel = getStatusMeta(stage).label.toLowerCase();
  return item.logs.find((log) => log.note.toLowerCase().startsWith(`[${metaLabel}]`));
}

export function ServiceEditForm({
  formId = 'service-edit-form',
  editOrder,
  setEditOrder,
  setActiveLightboxPhoto,
  newChargeKind,
  setNewChargeKind,
  newChargeDesc,
  setNewChargeDesc,
  newChargePrice,
  setNewChargePrice,
  newPayAmount,
  setNewPayAmount,
  newPayMethod,
  setNewPayMethod,
  handleSaveOrderChanges,
  handleAddCharge,
  handleDeleteCharge,
  handleAddPayment,
  handleDeleteLog,
  handleAddModuleToOrder,
}: ServiceEditFormProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('work');
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);

  const safeModuleIdx =
    selectedModuleIdx >= 0 && selectedModuleIdx < editOrder.items.length ? selectedModuleIdx : 0;
  const activeItem = editOrder.items[safeModuleIdx];

  const [focusedStage, setFocusedStage] = useState<ItemStatus>(
    () => activeItem?.status ?? ItemStatus.DITERIMA
  );

  const currentStageInView =
    activeItem &&
    (PROGRESS_STEPS.some((s) => s.key === focusedStage) ||
      SPECIAL_STAGE_STATUSES.some((s) => s.key === focusedStage))
      ? focusedStage
      : activeItem?.status ?? ItemStatus.DITERIMA;

  const updateItemAt = (itemIdx: number, updater: (prev: MockServiceItem) => MockServiceItem) => {
    const updated = editOrder.items.map((it, idx) => (idx === itemIdx ? updater(it) : it));
    setEditOrder({ ...editOrder, items: updated });
  };

  const selectModule = (idx: number) => {
    setSelectedModuleIdx(idx);
    const mod = editOrder.items[idx];
    if (mod) setFocusedStage(mod.status);
  };

  const selectStage = (itemIdx: number, stage: ItemStatus) => {
    setFocusedStage(stage);
    updateItemAt(itemIdx, (prev) => ({ ...prev, status: stage }));
  };

  const upsertStageEntry = (
    itemIdx: number,
    stage: ItemStatus,
    patch: { note?: string; photoUrl?: string | null }
  ) => {
    updateItemAt(itemIdx, (prev) => {
      const existing = findStageLog(prev, stage);
      const nextNote = patch.note !== undefined ? patch.note : existing?.note || '';
      const nextPhoto = patch.photoUrl !== undefined ? patch.photoUrl : existing?.photoUrl ?? null;

      let nextLogs: MockProgressLog[];
      if (!nextNote.trim() && !nextPhoto) {
        nextLogs = existing ? prev.logs.filter((l) => l.id !== existing.id) : prev.logs;
      } else if (existing) {
        nextLogs = prev.logs.map((l) =>
          l.id === existing.id
            ? { ...l, stage, note: nextNote, photoUrl: nextPhoto }
            : l
        );
      } else {
        const created: MockProgressLog = {
          id: `log-${Date.now()}`,
          createdAt: new Date().toISOString(),
          stage,
          note: nextNote,
          isPublic: true,
          photoUrl: nextPhoto,
        };
        nextLogs = [created, ...prev.logs];
      }

      const nextBeforePhoto =
        stage === ItemStatus.DITERIMA && patch.photoUrl !== undefined
          ? patch.photoUrl
          : prev.beforePhotoUrl;
      const nextAfterPhoto =
        (stage === ItemStatus.PERBAIKAN ||
          stage === ItemStatus.UJI_QC ||
          stage === ItemStatus.SIAP_DIAMBIL ||
          stage === ItemStatus.SELESAI) &&
        patch.photoUrl !== undefined
          ? patch.photoUrl
          : prev.afterPhotoUrl;

      return {
        ...prev,
        logs: nextLogs,
        beforePhotoUrl: nextBeforePhoto,
        afterPhotoUrl: nextAfterPhoto,
      };
    });
  };

  const totalCharges = calcTotalCharges(editOrder);
  const totalPaid = calcTotalPaid(editOrder);
  const remaining = Math.max(0, totalCharges - totalPaid);

  const heroPreviewSrc =
    editOrder.customPhotoUrl ||
    getVehicleHeroImage(
      editOrder.vehicleBrand,
      editOrder.vehicleModel,
      editOrder.unitCategory
    ).src;

  const currentStageMeta = getStatusMeta(currentStageInView);
  const currentStageLog = activeItem ? findStageLog(activeItem, currentStageInView) : undefined;
  const activeStepIdx = activeItem ? getProgressStepIndex(activeItem.status) : 0;
  const activePipelineIdx = PROGRESS_STEPS.findIndex((s) => s.key === activeItem?.status);
  const nextPipelineStep =
    activePipelineIdx >= 0 && activePipelineIdx < PROGRESS_STEPS.length - 1
      ? PROGRESS_STEPS[activePipelineIdx + 1]
      : activeItem && isSpecialStageStatus(activeItem.status)
      ? PROGRESS_STEPS[Math.min(activeStepIdx + 1, PROGRESS_STEPS.length - 1)]
      : null;

  return (
    <form id={formId} onSubmit={handleSaveOrderChanges} className="space-y-5">
      {/* 3 Clean Section Tabs */}
      <div
        role="tablist"
        aria-label="Bagian edit data servis"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.06]"
      >
        {[
          { key: 'work' as const, label: 'Pengerjaan' },
          { key: 'billing' as const, label: 'Biaya & Kas' },
          { key: 'unit' as const, label: 'Data Unit' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#2C2C2E] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENGERJAAN & TAHAP PER MODUL */}
      {activeTab === 'work' && activeItem && (
        <div className="space-y-5">
          {/* Module Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-1.5">
              {editOrder.items.map((mod, idx) => {
                const isSelected = idx === safeModuleIdx;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => selectModule(idx)}
                    className={`min-h-[38px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-200'
                    }`}
                  >
                    {mod.moduleName}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                handleAddModuleToOrder();
                setSelectedModuleIdx(editOrder.items.length);
                setFocusedStage(ItemStatus.DITERIMA);
              }}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 tap-bounce dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tambah Modul</span>
            </button>
          </div>

          {/* Info Modul Flat Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="mod-name"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Nama Modul
              </label>
              <input
                id="mod-name"
                type="text"
                value={activeItem.moduleName}
                onChange={(e) =>
                  updateItemAt(safeModuleIdx, (prev) => ({
                    ...prev,
                    moduleName: e.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="mod-detail"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Seri / Part IC
              </label>
              <input
                id="mod-detail"
                type="text"
                value={activeItem.moduleDetail || ''}
                onChange={(e) =>
                  updateItemAt(safeModuleIdx, (prev) => ({
                    ...prev,
                    moduleDetail: e.target.value,
                  }))
                }
                placeholder="Contoh: Bosch ME17.9.11"
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="mod-warranty"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Garansi
              </label>
              <select
                id="mod-warranty"
                value={activeItem.warrantyMonths || 0}
                onChange={(e) =>
                  updateItemAt(safeModuleIdx, (prev) => ({
                    ...prev,
                    warrantyMonths: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
              >
                <option value="0">Tanpa Garansi</option>
                <option value="1">1 Bulan</option>
                <option value="2">2 Bulan</option>
                <option value="3">3 Bulan</option>
                <option value="6">6 Bulan</option>
                <option value="12">12 Bulan</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="mod-complaint"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Keluhan / Gejala Kerusakan
              </label>
              <textarea
                id="mod-complaint"
                rows={2}
                value={activeItem.complaint}
                onChange={(e) =>
                  updateItemAt(safeModuleIdx, (prev) => ({
                    ...prev,
                    complaint: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-black/[0.08] bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>
          </div>

          {/* Interactive 6-Stage Stepper + Exception Toggles */}
          <div className="space-y-3 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tahap Pengerjaan
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Klik tahap untuk memperbarui status dan menambahkan catatan atau foto opsional.
                </p>
              </div>
              {nextPipelineStep && (
                <button
                  type="button"
                  onClick={() => selectStage(safeModuleIdx, nextPipelineStep.key)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-blue-600 px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-700 tap-bounce"
                >
                  <span>Lanjut: {nextPipelineStep.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {PROGRESS_STEPS.map((step, sIdx) => {
                const isStatusActive = activeItem.status === step.key;
                const isFocused = currentStageInView === step.key;
                const isDone =
                  !isSpecialStageStatus(activeItem.status) &&
                  (activeItem.status === ItemStatus.SELESAI || sIdx < activeStepIdx);
                const hasEntry = Boolean(findStageLog(activeItem, step.key));

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => selectStage(safeModuleIdx, step.key)}
                    className={`relative flex min-h-[54px] flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center transition-colors ${
                      isStatusActive || isFocused
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : isDone
                        ? 'border-emerald-600/30 bg-emerald-500/12 text-emerald-800 hover:bg-emerald-500/20 dark:border-emerald-400/25 dark:text-emerald-300'
                        : 'border-black/[0.08] bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold">
                      {isDone && !isStatusActive && (
                        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>Tahap {sIdx + 1}</span>
                    </span>
                    <span className="mt-0.5 truncate text-[11px] font-extrabold">
                      {step.label}
                    </span>
                    {hasEntry && (
                      <span
                        title="Memiliki catatan atau foto"
                        className={`mt-1 h-1 w-4 rounded-full ${
                          isStatusActive || isFocused
                            ? 'bg-white/80'
                            : 'bg-blue-600 dark:bg-blue-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Special / Exception Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kendala / Status Khusus:</span>
              </span>
              {SPECIAL_STAGE_STATUSES.map((sp) => {
                const isSelected = activeItem.status === sp.key;
                const isCancel = sp.key === ItemStatus.BATAL;
                return (
                  <button
                    key={sp.key}
                    type="button"
                    title={sp.description}
                    onClick={() => selectStage(safeModuleIdx, sp.key)}
                    className={`min-h-[34px] rounded-full border px-3 text-[11px] font-bold transition-colors ${
                      isSelected
                        ? isCancel
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-amber-700 bg-amber-700 text-white'
                        : 'border-black/[0.08] bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>

            {/* Clean Per-Stage Optional Note + Photo Editor */}
            <div className="space-y-3 rounded-2xl border border-black/[0.07] bg-slate-50/80 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none ${currentStageMeta.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStageMeta.dotClass}`} />
                    <span>{currentStageMeta.label}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Catatan &amp; Foto Tahap (Opsional)
                  </span>
                </div>

                <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-[11px] font-bold text-slate-800 transition-colors hover:bg-slate-100 tap-bounce dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white">
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{currentStageLog?.photoUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      readFileAsDataUrl(file, (url) =>
                        upsertStageEntry(safeModuleIdx, currentStageInView, { photoUrl: url })
                      );
                    }}
                  />
                </label>
              </div>

              <textarea
                rows={2}
                aria-label={`Catatan opsional tahap ${currentStageMeta.label}`}
                value={currentStageLog?.note || ''}
                onChange={(e) =>
                  upsertStageEntry(safeModuleIdx, currentStageInView, { note: e.target.value })
                }
                placeholder={
                  STAGE_PLACEHOLDERS[currentStageInView] ||
                  'Tulis keterangan atau temuan pada tahap ini (opsional)...'
                }
                className="w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder-slate-400"
              />

              {currentStageLog?.photoUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-2 dark:border-white/[0.08] dark:bg-black/30">
                  <button
                    type="button"
                    onClick={() => setActiveLightboxPhoto(currentStageLog.photoUrl || null)}
                    className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-black/[0.06] dark:border-white/10"
                  >
                    <img
                      src={currentStageLog.photoUrl}
                      alt={`Foto ${currentStageMeta.label}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Foto bukti tahap {currentStageMeta.label}
                    </p>
                    <p>Tampil pada detail admin &amp; halaman tracking pelanggan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      upsertStageEntry(safeModuleIdx, currentStageInView, { photoUrl: null })
                    }
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-[11px] font-bold text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>

            {/* Saved Timeline Overview for This Module */}
            {activeItem.logs.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Linimasa Progres Tersimpan ({activeItem.logs.length})
                </p>
                <div className="divide-y divide-black/[0.05] rounded-2xl border border-black/[0.06] bg-white dark:divide-white/[0.06] dark:border-white/[0.08] dark:bg-white/[0.02]">
                  {activeItem.logs.map((log) => {
                    const logMeta = log.stage ? getStatusMeta(log.stage) : null;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start justify-between gap-3 p-3 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (log.stage) setFocusedStage(log.stage);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
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
                            {log.photoUrl && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                <ImageIcon className="h-3 w-3" aria-hidden="true" />
                                Foto terlampir
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-slate-800 dark:text-slate-200">
                            {log.note || 'Dokumentasi foto tahap.'}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(safeModuleIdx, log.id)}
                          aria-label="Hapus catatan tahap ini"
                          title="Hapus catatan"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIAYA & KAS */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          {/* Ringkasan Tagihan */}
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs dark:bg-white/[0.04]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Tagihan
              </span>
              <p className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-white">
                {formatRupiah(totalCharges)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Sudah Dibayar
              </span>
              <p className="mt-0.5 font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                {formatRupiah(totalPaid)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Sisa
              </span>
              <p
                className={`mt-0.5 font-mono text-sm font-black ${
                  remaining <= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                {remaining <= 0 ? 'Lunas' : formatRupiah(remaining)}
              </p>
            </div>
          </div>

          {/* Daftar Biaya */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Rincian Item Biaya ({editOrder.charges.length})
            </h3>
            {editOrder.charges.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Belum ada rincian biaya yang diinput.
              </p>
            ) : (
              <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.08] dark:border-white/[0.08]">
                {editOrder.charges.map((chg) => (
                  <div key={chg.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-white/[0.1] dark:text-slate-300">
                        {chg.kind}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {chg.description}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(chg.unitPrice * chg.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCharge(chg.id)}
                        aria-label={`Hapus biaya ${chg.description}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <select
                aria-label="Jenis biaya"
                value={newChargeKind}
                onChange={(e) =>
                  setNewChargeKind(e.target.value as 'JASA' | 'SPAREPART' | 'DIAGNOSA')
                }
                className="h-10 rounded-xl border border-black/[0.08] bg-slate-50 px-2.5 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white sm:w-32"
              >
                <option value="JASA">Jasa</option>
                <option value="SPAREPART">Sparepart</option>
                <option value="DIAGNOSA">Diagnosa</option>
              </select>
              <input
                type="text"
                aria-label="Deskripsi biaya"
                value={newChargeDesc}
                onChange={(e) => setNewChargeDesc(e.target.value)}
                placeholder="Deskripsi biaya atau komponen..."
                className="h-10 flex-1 rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <input
                type="number"
                aria-label="Harga"
                value={newChargePrice}
                onChange={(e) => setNewChargePrice(e.target.value)}
                placeholder="Harga (Rp)"
                className="h-10 rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white sm:w-32"
              />
              <button
                type="button"
                onClick={handleAddCharge}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-slate-900"
              >
                Tambah Biaya
              </button>
            </div>
          </div>

          {/* Input Pembayaran Kas */}
          <div className="space-y-2.5 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Catat Penerimaan Kas / DP / Pelunasan
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Metode pembayaran"
                value={newPayMethod}
                onChange={(e) => setNewPayMethod(e.target.value as PaymentMethod)}
                className="h-10 rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white sm:w-40"
              >
                <option value={PaymentMethod.TRANSFER}>Transfer Bank</option>
                <option value={PaymentMethod.TUNAI}>Tunai (Cash)</option>
                <option value={PaymentMethod.QRIS}>QRIS</option>
              </select>

              <input
                type="number"
                aria-label="Nominal pembayaran"
                value={newPayAmount}
                onChange={(e) => setNewPayAmount(e.target.value)}
                placeholder="Nominal bayar (Rp)"
                className="h-10 flex-1 rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />

              <button
                type="button"
                onClick={handleAddPayment}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white tap-bounce hover:bg-emerald-800"
              >
                Catat Kas Masuk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA UNIT & PELANGGAN */}
      {activeTab === 'unit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(heroPreviewSrc)}
                className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-slate-900 dark:border-white/10"
              >
                <img
                  src={heroPreviewSrc}
                  alt={`${editOrder.vehicleBrand} ${editOrder.vehicleModel}`}
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Foto Unit / Kendaraan</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Klik foto untuk memperbesar atau ganti foto unit di sebelah kanan.
                </p>
              </div>
            </div>
            <label className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ganti Foto</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  readFileAsDataUrl(file, (url) =>
                    setEditOrder({ ...editOrder, customPhotoUrl: url })
                  );
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Merek Kendaraan / Unit
              </label>
              <input
                type="text"
                value={editOrder.vehicleBrand || ''}
                onChange={(e) => setEditOrder({ ...editOrder, vehicleBrand: e.target.value })}
                placeholder="Contoh: Toyota"
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Model / Tipe
              </label>
              <input
                type="text"
                value={editOrder.vehicleModel || ''}
                onChange={(e) => setEditOrder({ ...editOrder, vehicleModel: e.target.value })}
                placeholder="Contoh: Avanza 1.3 Veloz"
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Tahun
              </label>
              <input
                type="number"
                value={editOrder.vehicleYear || ''}
                onChange={(e) =>
                  setEditOrder({
                    ...editOrder,
                    vehicleYear: parseInt(e.target.value, 10) || null,
                  })
                }
                placeholder="2018"
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Plat Nomor
              </label>
              <input
                type="text"
                value={editOrder.plateNumber || ''}
                onChange={(e) => setEditOrder({ ...editOrder, plateNumber: e.target.value })}
                placeholder="Z 1234 AB"
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs font-bold uppercase text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Jenis Kedatangan Unit
              </label>
              <select
                value={
                  editOrder.unitCategory === 'GENSET_INDUSTRI'
                    ? 'GENSET_INDUSTRI'
                    : editOrder.intakeType === 'MOBIL_UTUH'
                    ? 'MOBIL_UTUH'
                    : 'MODUL_SAJA'
                }
                onChange={(e) => {
                  const val = e.target.value as IntakeChoice;
                  setEditOrder({
                    ...editOrder,
                    unitCategory: val === 'GENSET_INDUSTRI' ? 'GENSET_INDUSTRI' : 'OTOMOTIF',
                    intakeType:
                      val === 'MOBIL_UTUH' ? IntakeType.MOBIL_UTUH : IntakeType.MODUL_SAJA,
                  });
                }}
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
              >
                <option value="MOBIL_UTUH">Mobil Utuh</option>
                <option value="MODUL_SAJA">Modul Saja</option>
                <option value="GENSET_INDUSTRI">Genset / Industri</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Tipe Pelanggan
              </label>
              <select
                value={editOrder.customerType}
                onChange={(e) => {
                  const nextType = e.target.value as CustomerType;
                  setEditOrder({
                    ...editOrder,
                    customerType: nextType,
                    workshopName: normalizeWorkshopName(editOrder.workshopName, nextType),
                  });
                }}
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
              >
                <option value={CustomerType.PERORANGAN}>Perorangan</option>
                <option value={CustomerType.MITRA}>Bengkel Mitra</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={editOrder.customerName}
                onChange={(e) => setEditOrder({ ...editOrder, customerName: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Nomor WhatsApp Pelanggan
              </label>
              <input
                type="tel"
                value={editOrder.customerPhone}
                onChange={(e) => setEditOrder({ ...editOrder, customerPhone: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            {editOrder.customerType === CustomerType.MITRA && (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Bengkel Mitra
                </label>
                <select
                  value={
                    normalizeWorkshopName(editOrder.workshopName, CustomerType.MITRA) ||
                    PARTNER_WORKSHOPS[0]
                  }
                  onChange={(e) => setEditOrder({ ...editOrder, workshopName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
                >
                  {PARTNER_WORKSHOPS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Estimasi Selesai
              </label>
              <input
                type="date"
                value={
                  editOrder.estimatedDoneAt
                    ? new Date(editOrder.estimatedDoneAt).toISOString().slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setEditOrder({
                    ...editOrder,
                    estimatedDoneAt: e.target.value
                      ? new Date(`${e.target.value}T16:00:00.000Z`).toISOString()
                      : null,
                  })
                }
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Catatan Pengingat Prioritas
              </label>
              <input
                type="text"
                value={editOrder.priorityNote || ''}
                onChange={(e) => setEditOrder({ ...editOrder, priorityNote: e.target.value })}
                placeholder="Pengingat dashboard admin..."
                className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Catatan Kondisi Awal Unit
              </label>
              <textarea
                rows={2}
                value={editOrder.conditionNotes || ''}
                onChange={(e) => setEditOrder({ ...editOrder, conditionNotes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-black/[0.08] bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
