'use client';

import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react';
import { CustomerType, EntryMethod } from '@prisma/client';
import { MockCustomerRow, PARTNER_WORKSHOPS } from '@/lib/frontend-mock';
import { getVehicleHeroImage } from '@/lib/status';
import { Plus, Search, X, User, Camera, Car, ChevronDown } from 'lucide-react';
import { INTAKE_CHOICES, IntakeChoice, VEHICLE_PRESETS } from './service-utils';
import { WorkshopSelectField } from '@/components/admin/WorkshopSelectField';

export interface ServiceIntakeModalProps {
  customers: MockCustomerRow[];
  workshopOptions: string[];
  activeLightboxPhoto: string | null;
  setActiveLightboxPhoto: Dispatch<SetStateAction<string | null>>;
  isIntakeOpen: boolean;
  setIsIntakeOpen: Dispatch<SetStateAction<boolean>>;
  intakeName: string;
  setIntakeName: Dispatch<SetStateAction<string>>;
  intakePhone: string;
  setIntakePhone: Dispatch<SetStateAction<string>>;
  intakeCustomerType: CustomerType;
  setIntakeCustomerType: Dispatch<SetStateAction<CustomerType>>;
  intakeWorkshop: string;
  setIntakeWorkshop: Dispatch<SetStateAction<string>>;
  intakeChoice: IntakeChoice;
  setIntakeChoice: Dispatch<SetStateAction<IntakeChoice>>;
  intakeBrand: string;
  setIntakeBrand: Dispatch<SetStateAction<string>>;
  intakeModel: string;
  setIntakeModel: Dispatch<SetStateAction<string>>;
  intakeYear: string;
  setIntakeYear: Dispatch<SetStateAction<string>>;
  intakePlate: string;
  setIntakePlate: Dispatch<SetStateAction<string>>;
  intakeEstimatedDone: string;
  setIntakeEstimatedDone: Dispatch<SetStateAction<string>>;
  intakeComplaint: string;
  setIntakeComplaint: Dispatch<SetStateAction<string>>;
  intakeCustomPhoto: string | null;
  setIntakeCustomPhoto: Dispatch<SetStateAction<string | null>>;
  intakeEntryMethod: EntryMethod;
  setIntakeEntryMethod: Dispatch<SetStateAction<EntryMethod>>;
  intakeTrackingNumber: string;
  setIntakeTrackingNumber: Dispatch<SetStateAction<string>>;
  intakeError?: string | null;
  isUploadingIntakePhoto?: boolean;
  intakePhotoInputRef: RefObject<HTMLInputElement | null>;
  isCustomerPickerOpen: boolean;
  setIsCustomerPickerOpen: Dispatch<SetStateAction<boolean>>;
  customerPickerSearch: string;
  setCustomerPickerSearch: Dispatch<SetStateAction<string>>;
  customerPickerRef: RefObject<HTMLDivElement | null>;
  filteredPickerCustomers: MockCustomerRow[];
  intakeHeroPreview: ReturnType<typeof getVehicleHeroImage>;
  activeIntakePhotoSrc: string;
  handleIntakePhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleCreateIntake: (e: FormEvent) => Promise<void>;
}

export function ServiceIntakeModal({
  customers,
  workshopOptions,
  activeLightboxPhoto,
  setActiveLightboxPhoto,
  isIntakeOpen,
  setIsIntakeOpen,
  intakeName,
  setIntakeName,
  intakePhone,
  setIntakePhone,
  intakeCustomerType,
  setIntakeCustomerType,
  intakeWorkshop,
  setIntakeWorkshop,
  intakeChoice,
  setIntakeChoice,
  intakeBrand,
  setIntakeBrand,
  intakeModel,
  setIntakeModel,
  intakeYear,
  setIntakeYear,
  intakePlate,
  setIntakePlate,
  intakeEstimatedDone,
  setIntakeEstimatedDone,
  intakeComplaint,
  setIntakeComplaint,
  intakeCustomPhoto,
  setIntakeCustomPhoto,
  intakeEntryMethod,
  setIntakeEntryMethod,
  intakeTrackingNumber,
  setIntakeTrackingNumber,
  intakeError,
  isUploadingIntakePhoto,
  intakePhotoInputRef,
  isCustomerPickerOpen,
  setIsCustomerPickerOpen,
  customerPickerSearch,
  setCustomerPickerSearch,
  customerPickerRef,
  filteredPickerCustomers,
  intakeHeroPreview,
  activeIntakePhotoSrc,
  handleIntakePhotoChange,
  handleCreateIntake,
}: ServiceIntakeModalProps) {
  return (
    <>
      {/* MODAL PENERIMAAN UNIT BARU (INTAKE) */}
      {isIntakeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="intake-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setIsIntakeOpen(false)}
        >
          <div
            className="ios-glass-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner Foto Mobil / Unit di Paling Atas */}
            <div className="relative h-44 w-full overflow-hidden bg-slate-900 sm:h-52">
              <img
                src={activeIntakePhotoSrc}
                alt={intakeHeroPreview.caption}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />
  
              {/* Top Controls */}
              <div className="absolute inset-x-4 top-3.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  <Car className="h-3.5 w-3.5" />
                  <span>{INTAKE_CHOICES.find((c) => c.value === intakeChoice)?.label}</span>
                </span>
  
                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(false)}
                  aria-label="Tutup Modal Tambah Unit"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
  
              {/* Bottom Title & Custom Photo Action */}
              <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">
                    Tambah Unit Servis
                  </p>
                  <h2 id="intake-modal-title" className="truncate text-lg font-black tracking-tight text-white sm:text-xl">
                    {intakeBrand || intakeModel
                      ? `${intakeBrand} ${intakeModel}`.trim()
                      : 'Unit Kendaraan / Genset Baru'}
                  </h2>
                </div>
  
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    ref={intakePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIntakePhotoChange}
                    className="hidden"
                  />
                  {intakeCustomPhoto && (
                    <button
                      type="button"
                      onClick={() => setIntakeCustomPhoto(null)}
                      className="inline-flex h-8 items-center rounded-full border border-white/20 bg-black/55 px-2.5 text-[10px] font-bold text-white backdrop-blur-md hover:bg-black/80"
                    >
                      Reset Foto
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isUploadingIntakePhoto}
                    onClick={() => intakePhotoInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/90 px-3 text-[11px] font-bold text-slate-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>
                      {isUploadingIntakePhoto
                        ? 'Mengunggah...'
                        : intakeCustomPhoto
                        ? 'Ganti Foto'
                        : 'Upload Foto'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
  
            <form onSubmit={handleCreateIntake} className="space-y-4 p-5 sm:p-6">
              {intakeError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
                >
                  {intakeError}
                </div>
              )}

              {/* Preset Cepat Unit Populer */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pilih Cepat Unit Umum (Opsional)
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {VEHICLE_PRESETS.map((preset) => {
                    const isSelected =
                      intakeBrand.toLowerCase() === preset.brand.toLowerCase() &&
                      intakeModel.toLowerCase() === preset.model.toLowerCase();
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setIntakeBrand(preset.brand);
                          setIntakeModel(preset.model);
                          setIntakeYear(preset.year);
                          setIntakeChoice(preset.choice);
                        }}
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/10 bg-black/[0.03] text-slate-700 hover:bg-black/[0.07] dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
  
              {/* Langkah 1: Informasi Unit & Kendaraan */}
              <div className="ios-glass-inner space-y-3 rounded-[22px] p-4">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      1. Informasi Unit Masuk
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Detail modul diisi setelah simpan
                  </span>
                </div>
  
                {/* Pilihan Kategori Intake */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Kategori Kedatangan
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {INTAKE_CHOICES.map((c) => {
                      const active = intakeChoice === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setIntakeChoice(c.value)}
                          className={`rounded-xl border px-2.5 py-2 text-left transition-colors ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                              : 'border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          <p className="text-[11px] font-bold leading-tight">{c.label}</p>
                          <p
                            className={`mt-0.5 line-clamp-1 text-[9px] ${
                              active
                                ? 'text-white/75 dark:text-black/70'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {c.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
  
                {/* Pilihan Metode Penyerahan Unit */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Metode Penyerahan
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      {[
                        { value: EntryMethod.DATANG, label: 'Datang Langsung' },
                        { value: EntryMethod.EKSPEDISI, label: 'Kirim Ekspedisi' },
                      ].map((opt) => {
                        const active = intakeEntryMethod === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setIntakeEntryMethod(opt.value)}
                            className={`h-10 rounded-xl border px-2.5 text-[11px] font-bold transition-colors ${
                              active
                                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                                : 'border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {intakeEntryMethod === EntryMethod.EKSPEDISI && (
                    <div>
                      <label
                        htmlFor="intake-tracking"
                        className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                      >
                        Nomor Resi Ekspedisi (Opsional)
                      </label>
                      <input
                        id="intake-tracking"
                        type="text"
                        value={intakeTrackingNumber}
                        onChange={(e) => setIntakeTrackingNumber(e.target.value)}
                        placeholder="JNE / J&T / Cargo..."
                        className="mt-1.5 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 font-mono text-xs font-bold uppercase text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Merek Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={intakeBrand}
                      onChange={(e) => setIntakeBrand(e.target.value)}
                      placeholder="Toyota / Honda / Deep Sea"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Model / Tipe Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={intakeModel}
                      onChange={(e) => setIntakeModel(e.target.value)}
                      placeholder="Avanza / Jazz / Pajero / Genset"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Tahun Unit
                    </label>
                    <input
                      type="number"
                      value={intakeYear}
                      onChange={(e) => setIntakeYear(e.target.value)}
                      placeholder="2019"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Plat Nomor (Bila Ada)
                    </label>
                    <input
                      type="text"
                      value={intakePlate}
                      onChange={(e) => setIntakePlate(e.target.value)}
                      placeholder="Z 1842 AB"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold uppercase text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Estimasi Selesai (Menentukan Prioritas Urgent)
                    </label>
                    <input
                      type="date"
                      value={intakeEstimatedDone}
                      onChange={(e) => setIntakeEstimatedDone(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Keluhan &amp; Kondisi Awal Unit
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={intakeComplaint}
                      onChange={(e) => setIntakeComplaint(e.target.value)}
                      placeholder="Contoh: Mesin pincang, indikator check engine nyala, atau unit mati total..."
                      className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
                </div>
              </div>
  
              {/* Langkah 2: Informasi Pelanggan */}
              <div className="ios-glass-inner space-y-3 rounded-[22px] p-4">
                <div
                  ref={customerPickerRef}
                  className="relative space-y-2 border-b border-black/[0.05] pb-2.5 dark:border-white/[0.06]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        2. Data Pelanggan
                      </h3>
                    </div>
  
                    {customers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomerPickerOpen((prev) => !prev)}
                        aria-expanded={isCustomerPickerOpen}
                        aria-haspopup="listbox"
                        className="inline-flex h-8 max-w-[240px] items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-xs transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:bg-[#1C1C1E] dark:text-slate-200 dark:hover:bg-white/[0.06]"
                      >
                        <Search className="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span className="truncate">Isi cepat pelanggan terdaftar</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
                            isCustomerPickerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
  
                  {isCustomerPickerOpen && (
                    <div
                      role="listbox"
                      aria-label="Daftar pelanggan terdaftar"
                      className="rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#1C1C1E]"
                    >
                      {/* Sticky Search Bar */}
                      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2 dark:border-white/[0.08]">
                        <Search
                          className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400"
                          aria-hidden="true"
                        />
                        <input
                          type="text"
                          autoFocus
                          value={customerPickerSearch}
                          onChange={(e) => setCustomerPickerSearch(e.target.value)}
                          placeholder="Cari nama, WA, mitra, atau plat..."
                          aria-label="Cari pelanggan terdaftar"
                          className="h-7 min-w-0 flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500"
                        />
                        {customerPickerSearch && (
                          <button
                            type="button"
                            onClick={() => setCustomerPickerSearch('')}
                            aria-label="Hapus pencarian pelanggan"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
  
                      {/* Scrollable Customer List */}
                      <div className="max-h-56 divide-y divide-black/[0.04] overflow-y-auto dark:divide-white/[0.06]">
                        {filteredPickerCustomers.length === 0 ? (
                          <p className="px-3.5 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            Pelanggan tidak ditemukan
                          </p>
                        ) : (
                          filteredPickerCustomers.map((c) => {
                            const vehicleSummary = c.vehicles
                              .map((v) =>
                                `${v.brand} ${v.model}${v.plateNumber ? ` (${v.plateNumber})` : ''}`.trim()
                              )
                              .join(', ');
                            return (
                              <button
                                key={c.id}
                                type="button"
                                role="option"
                                aria-selected={
                                  intakeName.trim().toLowerCase() === c.name.trim().toLowerCase() &&
                                  intakePhone.trim() === c.phone
                                }
                                onClick={() => {
                                  setIntakeName(c.name);
                                  setIntakePhone(c.phone);
                                  setIntakeCustomerType(c.type);
                                  if (c.type === CustomerType.MITRA) {
                                    setIntakeWorkshop(
                                      c.workshopName || workshopOptions[0] || PARTNER_WORKSHOPS[0]
                                    );
                                  }
                                  setIsCustomerPickerOpen(false);
                                  setCustomerPickerSearch('');
                                }}
                                className="flex w-full items-start justify-between gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                      {c.name}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                        c.type === CustomerType.MITRA
                                          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300'
                                          : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                                      }`}
                                    >
                                      {c.type === CustomerType.MITRA
                                        ? `Mitra: ${c.workshopName || PARTNER_WORKSHOPS[0]}`
                                        : 'Perorangan'}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                    +{c.phone}
                                    {vehicleSummary ? ` · ${vehicleSummary}` : ''}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
  
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      required
                      value={intakeName}
                      onChange={(e) => setIntakeName(e.target.value)}
                      placeholder="Contoh: Nama pelanggan atau PIC"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      required
                      value={intakePhone}
                      onChange={(e) => setIntakePhone(e.target.value)}
                      placeholder="08123456xxxx"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
  
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Tipe Pelanggan
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIntakeCustomerType(CustomerType.PERORANGAN)}
                        className={`h-10 rounded-xl border px-3 text-xs font-bold transition-colors ${
                          intakeCustomerType === CustomerType.PERORANGAN
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        Perorangan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIntakeCustomerType(CustomerType.MITRA);
                          setIntakeWorkshop(
                            intakeWorkshop.trim() || workshopOptions[0] || PARTNER_WORKSHOPS[0]
                          );
                        }}
                        className={`h-10 rounded-xl border px-3 text-xs font-bold transition-colors ${
                          intakeCustomerType === CustomerType.MITRA
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        Bengkel Mitra
                      </button>
                    </div>
                  </div>

                  {intakeCustomerType === CustomerType.MITRA && (
                    <div className="sm:col-span-2">
                      <WorkshopSelectField
                        id="intake-workshop"
                        label="Nama Bengkel Mitra"
                        required
                        value={intakeWorkshop}
                        onChange={setIntakeWorkshop}
                        options={workshopOptions}
                        selectClassName="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                        inputClassName="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
  
              <div className="flex flex-col-reverse gap-2 border-t border-black/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Setelah tersimpan, halaman detail modul akan otomatis terbuka.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIntakeOpen(false)}
                    className="inline-flex min-h-[44px] items-center rounded-full px-5 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Simpan Unit &amp; Lanjut ke Detail</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* LIGHTBOX FOTO PREVIEW */}
      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto unit"
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
            <img src={activeLightboxPhoto} alt="Preview" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
