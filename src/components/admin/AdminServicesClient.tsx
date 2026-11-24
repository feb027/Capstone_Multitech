'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  MockServiceOrder,
  MockChargeLine,
  MockPayment,
  PARTNER_WORKSHOPS,
  normalizePhone,
  normalizeWorkshopName,
  getDefaultBeforeAfter,
} from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { ITEM_STATUS_LIST, getVehicleHeroImage } from '@/lib/status';
import { generate4DigitCode } from '@/lib/utils';
import { Plus, X, Check, MessageCircle, Printer, Eye, Pencil, Save } from 'lucide-react';
import { IntakeChoice, readFileAsDataUrl, getWaLink } from './services/service-utils';
import { ServicesTableSection } from './services/ServicesTableSection';
import { ServiceDetailView } from './services/ServiceDetailView';
import { ServiceEditForm } from './services/ServiceEditForm';
import { ServiceIntakeModal } from './services/ServiceIntakeModal';

export function AdminServicesClient() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') as ItemStatus | null;
  const initialOrderParam = searchParams.get('orderId') || searchParams.get('order');
  const initialSearchParam = searchParams.get('search') || searchParams.get('customer') || '';
  const shouldOpenNew = searchParams.get('new') === '1';

  const { orders, customers, upsertOrder } = useDataset();
  const [searchQuery, setSearchQuery] = useState(initialSearchParam);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ItemStatus>(
    initialStatusParam && ITEM_STATUS_LIST.some((s) => s.key === initialStatusParam)
      ? initialStatusParam
      : 'ALL'
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Modal Detail / Edit Order
  const [selectedOrder, setSelectedOrder] = useState<MockServiceOrder | null>(null);
  const [editOrder, setEditOrder] = useState<MockServiceOrder | null>(null);
  const [modalMode, setModalMode] = useState<'DETAIL' | 'EDIT'>('DETAIL');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<string | null>(null);

  // Form penerimaan unit baru (Intake)
  const [isIntakeOpen, setIsIntakeOpen] = useState(shouldOpenNew);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeCustomerType, setIntakeCustomerType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [intakeWorkshop, setIntakeWorkshop] = useState<string>(PARTNER_WORKSHOPS[0]);
  const [intakeChoice, setIntakeChoice] = useState<IntakeChoice>('MOBIL_UTUH');
  const [intakeBrand, setIntakeBrand] = useState('');
  const [intakeModel, setIntakeModel] = useState('');
  const [intakeYear, setIntakeYear] = useState('2019');
  const [intakePlate, setIntakePlate] = useState('');
  const [intakeEstimatedDone, setIntakeEstimatedDone] = useState(() =>
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [intakeComplaint, setIntakeComplaint] = useState('');
  const [intakeCustomPhoto, setIntakeCustomPhoto] = useState<string | null>(null);
  const intakePhotoInputRef = useRef<HTMLInputElement>(null);

  // Searchable combobox "Isi cepat pelanggan terdaftar"
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState('');
  const customerPickerRef = useRef<HTMLDivElement>(null);

  const intakeHeroPreview = getVehicleHeroImage(
    intakeBrand,
    intakeModel,
    intakeChoice === 'GENSET_INDUSTRI' ? 'GENSET_INDUSTRI' : 'OTOMOTIF'
  );
  const activeIntakePhotoSrc = intakeCustomPhoto || intakeHeroPreview.src;

  const handleIntakePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAsDataUrl(file, (url) => setIntakeCustomPhoto(url));
  };

  // Input biaya baru di dalam edit order
  const [newChargeKind, setNewChargeKind] = useState<'JASA' | 'SPAREPART' | 'DIAGNOSA'>('JASA');
  const [newChargeDesc, setNewChargeDesc] = useState('');
  const [newChargePrice, setNewChargePrice] = useState('');

  // Input bayar baru di dalam edit order
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayMethod, setNewPayMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);

  // Inisialisasi selectedOrder dari query param jika ada
  useEffect(() => {
    if (initialOrderParam) {
      const found = orders.find((o) => o.id === initialOrderParam || o.code === initialOrderParam);
      if (found) {
        setSelectedOrder(found);
        setEditOrder(JSON.parse(JSON.stringify(found)));
        setModalMode('DETAIL');
      }
    }
  }, [initialOrderParam, orders]);

  // Tutup dropdown filter saat klik di luar
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [isFilterOpen]);

  // Tutup dropdown pelanggan terdaftar saat klik di luar / Escape
  useEffect(() => {
    if (!isCustomerPickerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (customerPickerRef.current && !customerPickerRef.current.contains(e.target as Node)) {
        setIsCustomerPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCustomerPickerOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [isCustomerPickerOpen]);

  const filteredPickerCustomers = useMemo(() => {
    const q = customerPickerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchWorkshop = (c.workshopName || '').toLowerCase().includes(q);
      const matchVehicle = c.vehicles.some(
        (v) =>
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          (v.plateNumber || '').toLowerCase().includes(q)
      );
      return matchName || matchPhone || matchWorkshop || matchVehicle;
    });
  }, [customers, customerPickerSearch]);

  // Buka modal order dalam mode Detail (lihat) atau Edit (ubah)
  const handleOpenDetail = (order: MockServiceOrder, mode: 'DETAIL' | 'EDIT' = 'DETAIL') => {
    setSelectedOrder(order);
    setEditOrder(JSON.parse(JSON.stringify(order)));
    setModalMode(mode);
    setSaveSuccess(false);
  };

  // Simpan perubahan order yang diedit admin (sinkron ke dataset)
  const handleSaveOrderChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;

    const normalizedOrder: MockServiceOrder = {
      ...editOrder,
      customerName: editOrder.customerName.trim(),
      customerPhone: normalizePhone(editOrder.customerPhone),
      workshopName: normalizeWorkshopName(editOrder.workshopName, editOrder.customerType),
      plateNumber: editOrder.plateNumber ? editOrder.plateNumber.trim().toUpperCase() : null,
    };

    await upsertOrder(normalizedOrder);
    setEditOrder(normalizedOrder);
    setSelectedOrder(normalizedOrder);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Tambah biaya (charge) ke order yang sedang diedit
  const handleAddCharge = () => {
    if (!editOrder || !newChargeDesc.trim() || !newChargePrice) return;
    const price = parseInt(newChargePrice.replace(/\D/g, ''), 10) || 0;
    const newChargeItem: MockChargeLine = {
      id: `chg-${Date.now()}`,
      kind: newChargeKind,
      description: newChargeDesc.trim(),
      qty: 1,
      unitPrice: price,
    };
    setEditOrder({
      ...editOrder,
      charges: [...editOrder.charges, newChargeItem],
    });
    setNewChargeDesc('');
    setNewChargePrice('');
  };

  // Hapus biaya dari order yang sedang diedit
  const handleDeleteCharge = (chargeId: string) => {
    if (!editOrder) return;
    setEditOrder({
      ...editOrder,
      charges: editOrder.charges.filter((c) => c.id !== chargeId),
    });
  };

  // Tambah pembayaran ke order yang sedang diedit
  const handleAddPayment = () => {
    if (!editOrder || !newPayAmount) return;
    const amount = parseInt(newPayAmount.replace(/\D/g, ''), 10) || 0;
    const newPayItem: MockPayment = {
      id: `pay-${Date.now()}`,
      amount,
      method: newPayMethod,
      paidAt: new Date().toISOString(),
      note: 'Diterima oleh Admin Kasir',
    };
    setEditOrder({
      ...editOrder,
      payments: [...editOrder.payments, newPayItem],
    });
    setNewPayAmount('');
  };

  // Hapus log aktivitas dari modul tertentu
  const handleDeleteLog = (itemIdx: number, logId: string) => {
    if (!editOrder) return;
    const updatedItems = editOrder.items.map((item, idx) => {
      if (idx !== itemIdx) return item;
      return {
        ...item,
        logs: item.logs.filter((l) => l.id !== logId),
      };
    });
    setEditOrder({
      ...editOrder,
      items: updatedItems,
    });
  };

  // Tambah modul baru di dalam detail order
  const handleAddModuleToOrder = () => {
    if (!editOrder) return;
    const defaults = getDefaultBeforeAfter('Modul Baru', editOrder.unitCategory);
    const newModuleItem = {
      id: `item-${Date.now()}`,
      moduleTypeId: `mod-${editOrder.items.length + 1}`,
      moduleName: 'Modul Baru',
      moduleDetail: '',
      complaint: editOrder.conditionNotes || 'Pemeriksaan kelistrikan modul.',
      status: ItemStatus.DITERIMA,
      warrantyMonths: 3,
      beforePhotoUrl: defaults.beforePhotoUrl,
      afterPhotoUrl: defaults.afterPhotoUrl,
      beforeCaption: defaults.beforeCaption,
      afterCaption: defaults.afterCaption,
      logs: [
        {
          id: `log-${Date.now()}`,
          createdAt: new Date().toISOString(),
          stage: ItemStatus.DITERIMA,
          note: 'Modul ditambahkan pada data servis.',
          isPublic: true,
          photoUrl: null,
        },
      ],
    };
    setEditOrder({
      ...editOrder,
      items: [...editOrder.items, newModuleItem],
    });
  };

  // Submit penerimaan unit baru (informasi unit & pelanggan saja)
  const handleCreateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    let newCode = generate4DigitCode();
    let guard = 0;
    while (orders.some((o) => o.code === newCode) && guard < 20) {
      newCode = generate4DigitCode();
      guard += 1;
    }

    const isGenset = intakeChoice === 'GENSET_INDUSTRI';
    const isMobilUtuh = intakeChoice === 'MOBIL_UTUH';
    const resolvedCondition =
      intakeComplaint.trim() || 'Unit diterima di bengkel dalam kondisi siap diperiksa.';
    const defaultModName = isGenset ? 'Panel Kontrol / AMF' : 'ECU / Modul Utama';
    const defaultBA = getDefaultBeforeAfter(defaultModName, isGenset ? 'GENSET_INDUSTRI' : 'OTOMOTIF');

    const newOrder: MockServiceOrder = {
      id: `ord-${Date.now()}`,
      publicId: `${(intakeModel || 'unit').toLowerCase().replace(/\s+/g, '-')}-${newCode}`,
      code: newCode,
      customerName: intakeName.trim(),
      customerPhone: normalizePhone(intakePhone),
      customerType: intakeCustomerType,
      workshopName: normalizeWorkshopName(intakeWorkshop, intakeCustomerType),
      intakeType: isMobilUtuh ? IntakeType.MOBIL_UTUH : IntakeType.MODUL_SAJA,
      entryMethod: EntryMethod.DATANG,
      unitCategory: isGenset ? 'GENSET_INDUSTRI' : 'OTOMOTIF',
      vehicleBrand: intakeBrand.trim() || (isGenset ? 'Deep Sea' : 'Toyota'),
      vehicleModel: intakeModel.trim() || (isGenset ? 'Genset Controller DSE' : 'Avanza'),
      vehicleYear: parseInt(intakeYear, 10) || 2019,
      plateNumber: intakePlate.trim() ? intakePlate.trim().toUpperCase() : null,
      conditionNotes: resolvedCondition,
      customPhotoUrl: intakeCustomPhoto,
      receivedAt: new Date().toISOString(),
      estimatedDoneAt: intakeEstimatedDone
        ? new Date(`${intakeEstimatedDone}T16:00:00.000Z`).toISOString()
        : new Date(Date.now() + 86400000 * 2).toISOString(),
      items: [
        {
          id: `item-${Date.now()}`,
          moduleTypeId: 'mod-1',
          moduleName: defaultModName,
          moduleDetail: '',
          complaint: resolvedCondition,
          status: ItemStatus.DITERIMA,
          warrantyMonths: 3,
          beforePhotoUrl: defaultBA.beforePhotoUrl,
          afterPhotoUrl: defaultBA.afterPhotoUrl,
          beforeCaption: defaultBA.beforeCaption,
          afterCaption: defaultBA.afterCaption,
          logs: [
            {
              id: `log-${Date.now()}`,
              createdAt: new Date().toISOString(),
              stage: ItemStatus.DITERIMA,
              note: 'Unit masuk antrean penerimaan servis CV Multitech.',
              isPublic: true,
              photoUrl: intakeCustomPhoto,
            },
          ],
        },
      ],
      charges: [],
      payments: [],
    };

    await upsertOrder(newOrder);
    setIsIntakeOpen(false);
    setSelectedOrder(newOrder);
    setEditOrder(JSON.parse(JSON.stringify(newOrder)));
    setModalMode('EDIT');
    setSaveSuccess(false);

    // Reset Form
    setIntakeName('');
    setIntakePhone('');
    setIntakeWorkshop(PARTNER_WORKSHOPS[0]);
    setIntakeBrand('');
    setIntakeModel('');
    setIntakePlate('');
    setIntakeComplaint('');
    setIntakeCustomPhoto(null);
    setIsCustomerPickerOpen(false);
    setCustomerPickerSearch('');
  };

  // Filter list order servis
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL') {
        const hasStatus = order.items.some((item) => item.status === statusFilter);
        if (!hasStatus) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = order.code.toLowerCase().includes(q);
        const matchCust = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone.includes(q);
        const matchBrand = (order.vehicleBrand || '').toLowerCase().includes(q);
        const matchModel = (order.vehicleModel || '').toLowerCase().includes(q);
        const matchPlate = (order.plateNumber || '').toLowerCase().includes(q);
        const matchMod = order.items.some(
          (i) => i.moduleName.toLowerCase().includes(q) || i.complaint.toLowerCase().includes(q)
        );
        if (
          !matchCode &&
          !matchCust &&
          !matchPhone &&
          !matchBrand &&
          !matchModel &&
          !matchPlate &&
          !matchMod
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };


  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Daftar Antrean Servis
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Kelola data pengerjaan teknisi, status modul, rincian biaya, dan rekaman unit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsIntakeOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md transition-transform hover:bg-slate-800 tap-bounce dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Tambah Unit Servis</span>
        </button>
      </div>


      <ServicesTableSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        filterDropdownRef={filterDropdownRef}
        filteredOrders={filteredOrders}
        copiedId={copiedId}
        copyCode={copyCode}
        handleOpenDetail={handleOpenDetail}
      />

      {/* MODAL DETAIL & EDIT SERVIS (2 Mode Terpisah: Detail & Edit yang Saling Sinkron) */}
      {selectedOrder && editOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] border border-black/[0.08] bg-white shadow-2xl sm:rounded-[32px] dark:border-white/[0.1] dark:bg-[#1C1C1E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Header Modal + Switcher Mode Detail / Edit */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-5 py-3.5 sm:px-6 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white sm:text-base">
                  #{editOrder.code}
                </span>
                <div className="inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setModalMode('DETAIL')}
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition-colors ${
                      modalMode === 'DETAIL'
                        ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-black'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Detail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('EDIT')}
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition-colors ${
                      modalMode === 'EDIT'
                        ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-black'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={getWaLink(editOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  title="Kirim Update WhatsApp ke Pelanggan"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  title="Cetak Nota"
                >
                  <Printer className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="ios-glass-inner flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  aria-label="Tutup Dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {/* Banner Sukses Simpan */}
              {saveSuccess && (
                <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Seluruh perubahan data servis berhasil disimpan!</span>
                </div>
              )}

              {modalMode === 'DETAIL' ? (
                <ServiceDetailView
                  editOrder={editOrder}
                  setSelectedOrder={setSelectedOrder}
                  setModalMode={setModalMode}
                  setActiveLightboxPhoto={setActiveLightboxPhoto}
                  hideFooter
                />
              ) : (
                <ServiceEditForm
                  formId="service-edit-form"
                  editOrder={editOrder}
                  setEditOrder={setEditOrder}
                  setActiveLightboxPhoto={setActiveLightboxPhoto}
                  newChargeKind={newChargeKind}
                  setNewChargeKind={setNewChargeKind}
                  newChargeDesc={newChargeDesc}
                  setNewChargeDesc={setNewChargeDesc}
                  newChargePrice={newChargePrice}
                  setNewChargePrice={setNewChargePrice}
                  newPayAmount={newPayAmount}
                  setNewPayAmount={setNewPayAmount}
                  newPayMethod={newPayMethod}
                  setNewPayMethod={setNewPayMethod}
                  handleSaveOrderChanges={handleSaveOrderChanges}
                  handleAddCharge={handleAddCharge}
                  handleDeleteCharge={handleDeleteCharge}
                  handleAddPayment={handleAddPayment}
                  handleDeleteLog={handleDeleteLog}
                  handleAddModuleToOrder={handleAddModuleToOrder}
                />
              )}
            </div>

            {modalMode === 'DETAIL' ? (
              <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-black/[0.06] bg-white px-5 py-3.5 sm:px-6 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-black/[0.06] px-5 text-xs font-bold text-slate-800 transition-colors hover:bg-black/10 dark:bg-white/[0.1] dark:text-white dark:hover:bg-white/[0.16]"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('EDIT')}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Edit Pengerjaan</span>
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] bg-white px-5 py-3.5 sm:px-6 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => setModalMode('DETAIL')}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Preview Detail</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="inline-flex min-h-[44px] items-center rounded-full bg-black/[0.06] px-5 text-xs font-bold text-slate-800 hover:bg-black/10 dark:bg-white/[0.1] dark:text-white dark:hover:bg-white/[0.16]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    form="service-edit-form"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md transition-transform tap-bounce hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ServiceIntakeModal
        customers={customers}
        activeLightboxPhoto={activeLightboxPhoto}
        setActiveLightboxPhoto={setActiveLightboxPhoto}
        isIntakeOpen={isIntakeOpen}
        setIsIntakeOpen={setIsIntakeOpen}
        intakeName={intakeName}
        setIntakeName={setIntakeName}
        intakePhone={intakePhone}
        setIntakePhone={setIntakePhone}
        intakeCustomerType={intakeCustomerType}
        setIntakeCustomerType={setIntakeCustomerType}
        intakeWorkshop={intakeWorkshop}
        setIntakeWorkshop={setIntakeWorkshop}
        intakeChoice={intakeChoice}
        setIntakeChoice={setIntakeChoice}
        intakeBrand={intakeBrand}
        setIntakeBrand={setIntakeBrand}
        intakeModel={intakeModel}
        setIntakeModel={setIntakeModel}
        intakeYear={intakeYear}
        setIntakeYear={setIntakeYear}
        intakePlate={intakePlate}
        setIntakePlate={setIntakePlate}
        intakeEstimatedDone={intakeEstimatedDone}
        setIntakeEstimatedDone={setIntakeEstimatedDone}
        intakeComplaint={intakeComplaint}
        setIntakeComplaint={setIntakeComplaint}
        intakeCustomPhoto={intakeCustomPhoto}
        setIntakeCustomPhoto={setIntakeCustomPhoto}
        intakePhotoInputRef={intakePhotoInputRef}
        isCustomerPickerOpen={isCustomerPickerOpen}
        setIsCustomerPickerOpen={setIsCustomerPickerOpen}
        customerPickerSearch={customerPickerSearch}
        setCustomerPickerSearch={setCustomerPickerSearch}
        customerPickerRef={customerPickerRef}
        filteredPickerCustomers={filteredPickerCustomers}
        intakeHeroPreview={intakeHeroPreview}
        activeIntakePhotoSrc={activeIntakePhotoSrc}
        handleIntakePhotoChange={handleIntakePhotoChange}
        handleCreateIntake={handleCreateIntake}
      />
    </div>
  );
}
