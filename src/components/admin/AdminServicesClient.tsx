'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  MockServiceOrder,
  MockProgressLog,
  MockChargeLine,
  MockPayment,
  PARTNER_WORKSHOPS,
  normalizePhone,
  normalizeWorkshopName,
  getDefaultBeforeAfter,
} from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import {
  ITEM_STATUS_LIST,
  PROGRESS_STEPS,
  getProgressStepIndex,
  getStatusMeta,
  WORKSHOP_PROFILE,
  getVehicleHeroImage,
} from '@/lib/status';
import { formatDate, formatRupiah, generate4DigitCode } from '@/lib/utils';
import {
  Plus,
  Search,
  X,
  Check,
  Copy,
  MessageCircle,
  Printer,
  Trash2,
  SlidersHorizontal,
  Maximize2,
  Save,
  ShieldCheck,
  User,
  Camera,
  Car,
  ChevronDown,
  Eye,
  Pencil,
  ImagePlus,
} from 'lucide-react';

const STATUS_FILTER_OPTIONS: Array<{ value: 'ALL' | ItemStatus; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: ItemStatus.DITERIMA, label: 'Diterima' },
  { value: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { value: ItemStatus.MENUNGGU_SPAREPART, label: 'Tunggu Komponen' },
  { value: ItemStatus.PERBAIKAN, label: 'Pengerjaan' },
  { value: ItemStatus.UJI_QC, label: 'Uji & QC' },
  { value: ItemStatus.SIAP_DIAMBIL, label: 'Siap Diambil' },
  { value: ItemStatus.SELESAI, label: 'Selesai' },
  { value: ItemStatus.BATAL, label: 'Dibatalkan' },
];

type IntakeChoice = 'MOBIL_UTUH' | 'MODUL_SAJA' | 'GENSET_INDUSTRI';

const INTAKE_CHOICES: Array<{ value: IntakeChoice; label: string; hint: string }> = [
  { value: 'MOBIL_UTUH', label: 'Mobil Utuh', hint: 'Unit kendaraan masuk bengkel' },
  { value: 'MODUL_SAJA', label: 'Modul Saja', hint: 'Modul lepasan / kirim ekspedisi' },
  { value: 'GENSET_INDUSTRI', label: 'Genset / Industri', hint: 'Panel AMF / controller genset' },
];

const VEHICLE_PRESETS: Array<{
  label: string;
  brand: string;
  model: string;
  year: string;
  choice: IntakeChoice;
}> = [
  { label: 'Toyota Avanza', brand: 'Toyota', model: 'Avanza 1.3 Veloz', year: '2018', choice: 'MOBIL_UTUH' },
  { label: 'Honda Jazz', brand: 'Honda', model: 'Jazz RS GK5', year: '2019', choice: 'MOBIL_UTUH' },
  { label: 'Mitsubishi Pajero', brand: 'Mitsubishi', model: 'Pajero Sport Dakar', year: '2017', choice: 'MOBIL_UTUH' },
  { label: 'Suzuki Ertiga', brand: 'Suzuki', model: 'Ertiga GX', year: '2019', choice: 'MOBIL_UTUH' },
  { label: 'Genset DSE', brand: 'Deep Sea', model: 'Genset Controller DSE', year: '2021', choice: 'GENSET_INDUSTRI' },
];

function calcTotalPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

function calcTotalCharges(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

function readFileAsDataUrl(file: File, onDone: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onDone(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

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

  // Input tambahan pengerjaan (log + tahap + foto bukti) di dalam detail/edit order
  const [activeModuleLogIdx, setActiveModuleLogIdx] = useState(0);
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<ItemStatus>(ItemStatus.PERBAIKAN);
  const [newLogPhoto, setNewLogPhoto] = useState<string | null>(null);

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
        setActiveModuleLogIdx(0);
        setNewLogStatus(found.items[0]?.status || ItemStatus.PERBAIKAN);
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
    setActiveModuleLogIdx(0);
    setNewLogStatus(order.items[0]?.status || ItemStatus.PERBAIKAN);
    setNewLogNote('');
    setNewLogPhoto(null);
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

  // Tambah catatan pengerjaan teknisi + tahap + foto bukti ke modul terpilih
  const handleAddLog = () => {
    if (!editOrder || !newLogNote.trim()) return;
    const targetIdx =
      activeModuleLogIdx >= 0 && activeModuleLogIdx < editOrder.items.length
        ? activeModuleLogIdx
        : 0;
    const newLogItem: MockProgressLog = {
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
      note: `[${getStatusMeta(newLogStatus).label}] ${newLogNote.trim()}`,
      isPublic: true,
      photoUrl: newLogPhoto,
    };
    const updatedItems = editOrder.items.map((item, idx) => {
      if (idx === targetIdx) {
        return {
          ...item,
          status: newLogStatus,
          logs: [newLogItem, ...item.logs],
        };
      }
      return item;
    });
    setEditOrder({
      ...editOrder,
      items: updatedItems,
    });
    setNewLogNote('');
    setNewLogPhoto(null);
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
              note: 'Unit masuk antrean penerimaan servis CV Multitech.',
              isPublic: true,
              photoUrl: null,
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
    setActiveModuleLogIdx(0);
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

  const getWaLink = (order: MockServiceOrder) => {
    const raw = order.customerPhone.replace(/\D/g, '');
    const waNumber = raw.startsWith('0') ? `62${raw.slice(1)}` : raw;
    const primaryItem = order.items[0];
    const statusLabel = primaryItem ? getStatusMeta(primaryItem.status).label : '';
    const msg = `Halo ${order.customerName}, update dari ${WORKSHOP_PROFILE.name} untuk unit ${order.vehicleBrand || ''} ${order.vehicleModel || ''} (Kode: #${order.code}). Status saat ini: ${statusLabel}. Pantau progres langsung di: https://cvmultitech.id/track/${order.publicId}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
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

      {/* Unified Search Bar dengan Icon Filter di Sisi Kanan */}
      <div ref={filterDropdownRef} className="relative z-30">
        <div className="ios-glass-card flex h-12 items-center rounded-2xl pl-3.5 pr-1.5 transition-all focus-within:ring-2 focus-within:ring-black/15 dark:focus-within:ring-white/25">
          <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-300" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              statusFilter === 'ALL'
                ? 'Cari kode servis, pelanggan, mobil, genset, plat, atau keluhan...'
                : `Cari di status ${STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter)?.label || ''}...`
            }
            aria-label="Cari antrean servis"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:text-white dark:placeholder-zinc-400"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <div className="mx-1 h-5 w-px shrink-0 bg-black/[0.08] dark:bg-white/[0.12]" aria-hidden="true" />

          {/* Tombol Filter di Sisi Kanan Search Bar */}
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            aria-label={`Filter status (${STATUS_FILTER_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua'})`}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all tap-bounce ${
              statusFilter !== 'ALL' || isFilterOpen
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {statusFilter !== 'ALL' && (
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C9182B] dark:bg-[#EF4444]"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Dropdown Menu Filter Status */}
        {isFilterOpen && (
          <div
            role="listbox"
            aria-label="Pilih filter status servis"
            className="ios-glass-card absolute right-0 top-14 z-40 w-56 space-y-1 rounded-2xl p-1.5 shadow-2xl animate-sheet-in"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setIsFilterOpen(false);
                  }}
                  className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabel Data Servis */}
      {filteredOrders.length === 0 ? (
        <div className="ios-glass-card rounded-[28px] p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Tidak ada unit servis yang sesuai
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Coba ubah kata kunci pencarian atau reset filter status.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-4 inline-flex min-h-[42px] items-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-black"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="ios-glass-card overflow-hidden rounded-[26px] shadow-sm">
          {/* Tampilan Tabel Desktop (Ringkas, Rapih, Tidak Menumpuk) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-4 py-3.5">Kode &amp; Masuk</th>
                  <th className="px-4 py-3.5">Unit Servis</th>
                  <th className="px-4 py-3.5">Pelanggan</th>
                  <th className="px-4 py-3.5">Modul &amp; Tahap Pengerjaan</th>
                  <th className="px-4 py-3.5 text-right">Tagihan</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filteredOrders.map((order) => {
                  const primaryItem = order.items[0];
                  const itemStatus = primaryItem?.status || ItemStatus.DITERIMA;
                  const statusMeta = getStatusMeta(itemStatus);
                  const stepIndex = getProgressStepIndex(itemStatus);
                  const isCancelled = itemStatus === ItemStatus.BATAL;
                  const isDone = itemStatus === ItemStatus.SELESAI;
                  const totalCharges = calcTotalCharges(order);
                  const totalPaid = calcTotalPaid(order);
                  const isPaidFull = totalCharges > 0 && totalPaid >= totalCharges;
                  const isPartial = totalCharges > 0 && totalPaid > 0 && totalPaid < totalCharges;
                  const extraModules = Math.max(0, order.items.length - 1);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order, 'DETAIL')}
                      className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      {/* Col 1: Kode & Tanggal */}
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                            #{order.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCode(order.code);
                            }}
                            title="Salin Kode Nota"
                            aria-label={`Salin kode #${order.code}`}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            {copiedId === order.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(order.receivedAt)}
                        </p>
                      </td>

                      {/* Col 2: Unit Servis (Tanpa info bertumpuk) */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.vehicleBrand} {order.vehicleModel}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {order.plateNumber ||
                            (order.unitCategory === 'GENSET_INDUSTRI'
                              ? 'Unit Genset'
                              : 'Modul Lepasan')}
                        </p>
                      </td>

                      {/* Col 3: Pelanggan */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.customerName}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            order.workshopName
                              ? 'font-semibold text-blue-700 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {order.workshopName || 'Perorangan'}
                        </p>
                      </td>

                      {/* Col 4: Modul & Tahap Visual 5-Langkah */}
                      <td className="min-w-[230px] px-4 py-3.5 align-middle">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-bold text-slate-900 dark:text-white">
                              {primaryItem?.moduleName || 'Modul Servis'}
                            </span>
                            {extraModules > 0 && (
                              <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/[0.1] dark:text-slate-300">
                                +{extraModules}
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none ${statusMeta.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                            {!isCancelled && !isDone
                              ? `Tahap ${stepIndex + 1}/5 · ${statusMeta.shortLabel}`
                              : statusMeta.shortLabel}
                          </span>
                        </div>

                        {!isCancelled && (
                          <div className="mt-2 grid grid-cols-5 gap-1" aria-hidden="true">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const stepDone = isDone || idx < stepIndex;
                              const stepActive = !isDone && idx === stepIndex;
                              return (
                                <div
                                  key={step.key}
                                  title={`${idx + 1}. ${step.label}`}
                                  className={`h-1.5 rounded-full transition-colors ${
                                    stepDone
                                      ? 'bg-emerald-500 dark:bg-emerald-400'
                                      : stepActive
                                      ? 'bg-blue-600 dark:bg-blue-400'
                                      : 'bg-slate-200 dark:bg-white/15'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Col 5: Tagihan Ringkas */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle font-mono">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {totalCharges > 0 ? formatRupiah(totalCharges) : '-'}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] font-bold ${
                            totalCharges === 0
                              ? 'text-slate-400'
                              : isPaidFull
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isPartial
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {totalCharges === 0
                            ? 'Belum ditagih'
                            : isPaidFull
                            ? 'Lunas'
                            : isPartial
                            ? 'DP Masuk'
                            : 'Belum Bayar'}
                        </p>
                      </td>

                      {/* Col 6: 2 Tombol Aksi Icon Only Atas-Bawah (Detail & Edit) */}
                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                        <div className="inline-flex flex-col items-end justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(order, 'DETAIL');
                            }}
                            title="Lihat Detail"
                            aria-label={`Lihat detail #${order.code}`}
                            className="ios-glass-inner inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(order, 'EDIT');
                            }}
                            title="Edit Servis"
                            aria-label={`Edit servis #${order.code}`}
                            className="ios-glass-inner inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tampilan Kartu List Mobile */}
          <div className="divide-y divide-black/[0.05] md:hidden dark:divide-white/[0.06]">
            {filteredOrders.map((order) => {
              const primaryItem = order.items[0];
              const itemStatus = primaryItem?.status || ItemStatus.DITERIMA;
              const statusMeta = getStatusMeta(itemStatus);
              const stepIndex = getProgressStepIndex(itemStatus);
              const isDone = itemStatus === ItemStatus.SELESAI;
              const isCancelled = itemStatus === ItemStatus.BATAL;
              const totalCharges = calcTotalCharges(order);

              return (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order, 'DETAIL')}
                  className="cursor-pointer space-y-2.5 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                          #{order.code}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {order.vehicleBrand} {order.vehicleModel}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
                        {order.customerName} · {order.workshopName || 'Perorangan'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold leading-none ${statusMeta.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {statusMeta.shortLabel}
                    </span>
                  </div>

                  {!isCancelled && (
                    <div className="grid grid-cols-5 gap-1">
                      {PROGRESS_STEPS.map((step, idx) => {
                        const stepDone = isDone || idx < stepIndex;
                        const stepActive = !isDone && idx === stepIndex;
                        return (
                          <div
                            key={step.key}
                            className={`h-1.5 rounded-full ${
                              stepDone
                                ? 'bg-emerald-500 dark:bg-emerald-400'
                                : stepActive
                                ? 'bg-blue-600 dark:bg-blue-400'
                                : 'bg-slate-200 dark:bg-white/15'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t border-black/[0.05] pt-2.5 dark:border-white/[0.06]">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {primaryItem?.moduleName || 'Modul Servis'}
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {totalCharges > 0 ? formatRupiah(totalCharges) : '-'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order, 'DETAIL');
                        }}
                        title="Lihat Detail"
                        aria-label={`Lihat detail #${order.code}`}
                        className="ios-glass-inner inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-800 dark:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order, 'EDIT');
                        }}
                        title="Edit Servis"
                        aria-label={`Edit servis #${order.code}`}
                        className="ios-glass-inner inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-800 dark:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL & EDIT SERVIS (2 Mode Terpisah: Detail & Edit yang Saling Sinkron) */}
      {selectedOrder && editOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="ios-glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Header Modal + Switcher Mode Detail / Edit */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3.5 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white sm:text-base">
                  #{editOrder.code}
                </span>
                <div className="inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setModalMode('DETAIL')}
                    className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition-colors ${
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
                    className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition-colors ${
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
                  className="ios-glass-inner flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  title="Kirim Update WhatsApp ke Pelanggan"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ios-glass-inner flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  title="Cetak Nota"
                >
                  <Printer className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="ios-glass-inner flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  aria-label="Tutup Dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Banner Sukses Simpan */}
            {saveSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>Seluruh perubahan data servis berhasil disimpan!</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* MODE 1: DETAIL (Tampilan Bersih, Tahap Jelas & Before/After)   */}
            {/* ============================================================== */}
            {modalMode === 'DETAIL' ? (
              <div className="mt-4 space-y-4">
                {/* Vehicle Hero & Overview Card */}
                <div className="ios-glass-inner overflow-hidden rounded-[24px]">
                  <div className="relative h-44 w-full bg-slate-900 sm:h-48">
                    <img
                      src={
                        editOrder.customPhotoUrl ||
                        getVehicleHeroImage(
                          editOrder.vehicleBrand,
                          editOrder.vehicleModel,
                          editOrder.unitCategory
                        ).src
                      }
                      alt={`${editOrder.vehicleBrand} ${editOrder.vehicleModel}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <button
                      type="button"
                      onClick={() =>
                        setActiveLightboxPhoto(
                          editOrder.customPhotoUrl ||
                            getVehicleHeroImage(
                              editOrder.vehicleBrand,
                              editOrder.vehicleModel,
                              editOrder.unitCategory
                            ).src
                        )
                      }
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md"
                      aria-label="Perbesar Foto Unit"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-x-4 bottom-3 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-white">
                          {editOrder.vehicleBrand} {editOrder.vehicleModel}
                        </h3>
                        <p className="text-[11px] text-white/80">
                          {editOrder.vehicleYear ? `Tahun ${editOrder.vehicleYear}` : 'Unit Servis'}
                          {editOrder.plateNumber ? ` · ${editOrder.plateNumber}` : ''}
                          {editOrder.workshopName ? ` · ${editOrder.workshopName}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-900">
                        {editOrder.customerName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Diterima
                        </span>
                        <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                          {formatDate(editOrder.receivedAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Est. Selesai
                        </span>
                        <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                          {editOrder.estimatedDoneAt ? formatDate(editOrder.estimatedDoneAt) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Kontak
                        </span>
                        <p className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">
                          +{editOrder.customerPhone}
                        </p>
                      </div>
                    </div>

                    {editOrder.conditionNotes && (
                      <div className="rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-slate-700 dark:bg-white/[0.04] dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white">Catatan Masuk: </span>
                        {editOrder.conditionNotes}
                      </div>
                    )}
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

                  return (
                    <div key={item.id} className="ios-glass-inner space-y-4 rounded-[24px] p-4">
                      {/* Header Modul */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {item.moduleName}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                              {statusMeta.label}
                            </span>
                          </div>
                          {item.moduleDetail && (
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {item.moduleDetail}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                              Keluhan:{' '}
                            </span>
                            {item.complaint}
                          </p>
                        </div>

                        {item.warrantyMonths > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            Garansi {item.warrantyMonths} Bln
                          </span>
                        )}
                      </div>

                      {/* Progress 5 Tahap Visual */}
                      {!isCancelled ? (
                        <div className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Tahapan Pengerjaan
                          </p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const stepDone = isDone || idx < stepIdx;
                              const stepCurrent = !isDone && idx === stepIdx;
                              return (
                                <div key={step.key} className="flex flex-col items-center text-center">
                                  <div
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                      stepDone
                                        ? 'bg-emerald-500 text-white'
                                        : stepCurrent
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
                                        : 'bg-slate-200 text-slate-500 dark:bg-white/15 dark:text-slate-400'
                                    }`}
                                  >
                                    {stepDone ? <Check className="h-3 w-3" /> : idx + 1}
                                  </div>
                                  <div
                                    className={`mt-1.5 h-1.5 w-full rounded-full ${
                                      stepDone
                                        ? 'bg-emerald-500'
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
                                        : 'text-slate-500 dark:text-slate-400'
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
                          Pengerjaan modul ini dibatalkan.
                        </div>
                      )}

                      {/* Perbandingan Visual Before & After */}
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Dokumentasi Before &amp; After Perbaikan
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-2.5 dark:bg-amber-950/20">
                            <span className="inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              BEFORE · Kondisi Awal
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveLightboxPhoto(beforePhoto)}
                              className="mt-2 block w-full overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                            >
                              <img
                                src={beforePhoto}
                                alt={`Before ${item.moduleName}`}
                                className="h-28 w-full object-cover transition-transform hover:scale-105"
                              />
                            </button>
                            <p className="mt-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                              {beforeText}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5 dark:bg-emerald-950/20">
                            <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              AFTER · Setelah Diperbaiki
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveLightboxPhoto(afterPhoto)}
                              className="mt-2 block w-full overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                            >
                              <img
                                src={afterPhoto}
                                alt={`After ${item.moduleName}`}
                                className="h-28 w-full object-cover transition-transform hover:scale-105"
                              />
                            </button>
                            <p className="mt-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
                              {afterText}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Aktivitas Teknisi */}
                      {item.logs.length > 0 && (
                        <div className="border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Riwayat Pengerjaan Teknisi
                          </p>
                          <div className="space-y-2.5">
                            {item.logs.map((log) => (
                              <div key={log.id} className="flex gap-2.5 text-xs">
                                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    {formatDate(log.createdAt)}
                                  </p>
                                  <p className="text-slate-800 dark:text-slate-200">{log.note}</p>
                                  {log.photoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveLightboxPhoto(log.photoUrl || null)}
                                      className="mt-1 block overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08]"
                                    >
                                      <img
                                        src={log.photoUrl}
                                        alt="Bukti pengerjaan"
                                        className="h-20 w-36 object-cover"
                                      />
                                    </button>
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

                {/* Rincian Biaya & Pembayaran (Read-Only) */}
                <div className="ios-glass-inner space-y-3 rounded-[24px] p-4">
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Rincian Biaya &amp; Pembayaran
                    </h4>
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      Total: {formatRupiah(calcTotalCharges(editOrder))}
                    </span>
                  </div>

                  {editOrder.charges.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Belum ada rincian biaya yang diinput.
                    </p>
                  ) : (
                    <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                      {editOrder.charges.map((chg) => (
                        <div key={chg.id} className="flex items-center justify-between py-2 text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="mr-1.5 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-white/[0.1] dark:text-slate-300">
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
                      Sudah Dibayar: {formatRupiah(calcTotalPaid(editOrder))}
                    </span>
                    <span
                      className={
                        calcTotalCharges(editOrder) - calcTotalPaid(editOrder) <= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-300'
                      }
                    >
                      {calcTotalCharges(editOrder) - calcTotalPaid(editOrder) <= 0
                        ? 'Lunas'
                        : `Sisa ${formatRupiah(
                            Math.max(0, calcTotalCharges(editOrder) - calcTotalPaid(editOrder))
                          )}`}
                    </span>
                  </div>
                </div>

                {/* Footer Mode Detail */}
                <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2.5 rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/95">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="inline-flex min-h-[42px] items-center rounded-full px-5 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('EDIT')}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Pengerjaan</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* MODE 2: EDIT (Form Tersinkron dengan Tampilan Detail)          */
              /* ============================================================== */
              <form onSubmit={handleSaveOrderChanges} className="mt-4 space-y-5">
                {/* SEKSI 1: Modul, Tahap, Gambar Before/After & Input Tambahan Pengerjaan */}
                <div className="ios-glass-inner space-y-4 rounded-[24px] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05] pb-2.5 dark:border-white/[0.06]">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        1. Tahap Pengerjaan &amp; Foto Before / After
                      </h3>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Pilih tahap visual, upload bukti Before/After, lalu tambahkan catatan pengerjaan
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddModuleToOrder}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-900 px-3 text-[11px] font-bold text-white tap-bounce dark:bg-white dark:text-black"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Modul</span>
                    </button>
                  </div>

                  {editOrder.items.map((item, idx) => {
                    const stepIdx = getProgressStepIndex(item.status);
                    const isDone = item.status === ItemStatus.SELESAI;
                    const defaults = getDefaultBeforeAfter(item.moduleName, editOrder.unitCategory);
                    const beforePhoto = item.beforePhotoUrl || defaults.beforePhotoUrl;
                    const afterPhoto = item.afterPhotoUrl || defaults.afterPhotoUrl;

                    return (
                      <div
                        key={item.id}
                        className="space-y-3.5 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                      >
                        {/* Tahap Pengerjaan Interaktif 5 Langkah */}
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Tahap Pengerjaan ({item.moduleName})
                            </span>
                            <select
                              value={item.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as ItemStatus;
                                const updated = [...editOrder.items];
                                updated[idx] = { ...updated[idx], status: newStatus };
                                setEditOrder({ ...editOrder, items: updated });
                              }}
                              className="h-8 rounded-xl border border-black/[0.08] bg-white px-2.5 text-[11px] font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                            >
                              {ITEM_STATUS_LIST.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-2 grid grid-cols-5 gap-1.5">
                            {PROGRESS_STEPS.map((step, sIdx) => {
                              const stepDone = isDone || sIdx < stepIdx;
                              const stepCurrent = !isDone && sIdx === stepIdx;
                              return (
                                <button
                                  key={step.key}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...editOrder.items];
                                    updated[idx] = { ...updated[idx], status: step.key };
                                    setEditOrder({ ...editOrder, items: updated });
                                  }}
                                  className={`rounded-xl border px-1.5 py-2 text-center transition-colors ${
                                    stepCurrent
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : stepDone
                                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                      : 'border-black/[0.08] bg-white text-slate-600 hover:bg-black/[0.04] dark:border-white/10 dark:bg-black/40 dark:text-slate-300'
                                  }`}
                                >
                                  <span className="block text-[9px] font-bold">
                                    Tahap {sIdx + 1}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] font-extrabold">
                                    {step.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Info Modul */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Nama Modul
                            </label>
                            <input
                              type="text"
                              value={item.moduleName}
                              onChange={(e) => {
                                const updated = [...editOrder.items];
                                updated[idx] = { ...updated[idx], moduleName: e.target.value };
                                setEditOrder({ ...editOrder, items: updated });
                              }}
                              className="mt-1 h-9 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Seri / Part IC
                            </label>
                            <input
                              type="text"
                              value={item.moduleDetail || ''}
                              onChange={(e) => {
                                const updated = [...editOrder.items];
                                updated[idx] = { ...updated[idx], moduleDetail: e.target.value };
                                setEditOrder({ ...editOrder, items: updated });
                              }}
                              placeholder="Contoh: Bosch ME17.9.11"
                              className="mt-1 h-9 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Garansi
                            </label>
                            <select
                              value={item.warrantyMonths || 0}
                              onChange={(e) => {
                                const updated = [...editOrder.items];
                                updated[idx] = {
                                  ...updated[idx],
                                  warrantyMonths: parseInt(e.target.value, 10) || 0,
                                };
                                setEditOrder({ ...editOrder, items: updated });
                              }}
                              className="mt-1 h-9 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
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
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Keluhan / Gejala Kerusakan
                            </label>
                            <textarea
                              rows={2}
                              value={item.complaint}
                              onChange={(e) => {
                                const updated = [...editOrder.items];
                                updated[idx] = { ...updated[idx], complaint: e.target.value };
                                setEditOrder({ ...editOrder, items: updated });
                              }}
                              className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Upload & Keterangan Foto BEFORE & AFTER */}
                        <div className="border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Foto &amp; Keterangan Before / After (Perbandingan Kerusakan &amp; Perbaikan)
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* BEFORE */}
                            <div className="space-y-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-2.5 dark:bg-amber-950/20">
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                  BEFORE · Kondisi Awal
                                </span>
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:bg-white/10 dark:text-white">
                                  <Camera className="h-3 w-3" />
                                  <span>Upload Before</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      readFileAsDataUrl(file, (url) => {
                                        const updated = [...editOrder.items];
                                        updated[idx] = { ...updated[idx], beforePhotoUrl: url };
                                        setEditOrder({ ...editOrder, items: updated });
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                              <img
                                src={beforePhoto}
                                alt={`Before ${item.moduleName}`}
                                onClick={() => setActiveLightboxPhoto(beforePhoto)}
                                className="h-24 w-full cursor-pointer rounded-xl object-cover"
                              />
                              <input
                                type="text"
                                value={item.beforeCaption ?? defaults.beforeCaption}
                                onChange={(e) => {
                                  const updated = [...editOrder.items];
                                  updated[idx] = { ...updated[idx], beforeCaption: e.target.value };
                                  setEditOrder({ ...editOrder, items: updated });
                                }}
                                placeholder="Keterangan komponen rusak sebelum diperbaiki..."
                                className="h-9 w-full rounded-xl border border-black/[0.08] bg-white px-2.5 text-[11px] text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                              />
                            </div>

                            {/* AFTER */}
                            <div className="space-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-2.5 dark:bg-emerald-950/20">
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  AFTER · Setelah Diperbaiki
                                </span>
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:bg-white/10 dark:text-white">
                                  <Camera className="h-3 w-3" />
                                  <span>Upload After</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      readFileAsDataUrl(file, (url) => {
                                        const updated = [...editOrder.items];
                                        updated[idx] = { ...updated[idx], afterPhotoUrl: url };
                                        setEditOrder({ ...editOrder, items: updated });
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                              <img
                                src={afterPhoto}
                                alt={`After ${item.moduleName}`}
                                onClick={() => setActiveLightboxPhoto(afterPhoto)}
                                className="h-24 w-full cursor-pointer rounded-xl object-cover"
                              />
                              <input
                                type="text"
                                value={item.afterCaption ?? defaults.afterCaption}
                                onChange={(e) => {
                                  const updated = [...editOrder.items];
                                  updated[idx] = { ...updated[idx], afterCaption: e.target.value };
                                  setEditOrder({ ...editOrder, items: updated });
                                }}
                                placeholder="Keterangan komponen yang diganti / hasil perbaikan..."
                                className="h-9 w-full rounded-xl border border-black/[0.08] bg-white px-2.5 text-[11px] text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Daftar Riwayat Pengerjaan Modul Ini */}
                        {item.logs.length > 0 && (
                          <div className="border-t border-black/[0.05] pt-2.5 dark:border-white/[0.06]">
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Log Pengerjaan Tersimpan ({item.logs.length})
                            </p>
                            <div className="space-y-1.5">
                              {item.logs.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-start justify-between gap-2 rounded-xl bg-white/70 px-2.5 py-2 text-[11px] dark:bg-black/30"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                      {formatDate(log.createdAt)}
                                    </span>
                                    <p className="text-slate-800 dark:text-slate-200">{log.note}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(idx, log.id)}
                                    title="Hapus catatan ini"
                                    className="shrink-0 text-red-500 hover:text-red-700 dark:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Input Tambahan Pengerjaan (Sinkron dengan Riwayat Pengerjaan & Tahap) */}
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-3.5 dark:bg-blue-950/20">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Input Tambahan Pengerjaan Teknisi
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {editOrder.items.length > 1 && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Modul Tujuan
                          </label>
                          <select
                            value={activeModuleLogIdx}
                            onChange={(e) => setActiveModuleLogIdx(Number(e.target.value) || 0)}
                            className="mt-1 h-9 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                          >
                            {editOrder.items.map((it, i) => (
                              <option key={it.id} value={i}>
                                {it.moduleName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={editOrder.items.length > 1 ? '' : 'sm:col-span-2'}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Update Tahap Pengerjaan
                        </label>
                        <select
                          value={newLogStatus}
                          onChange={(e) => setNewLogStatus(e.target.value as ItemStatus)}
                          className="mt-1 h-9 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                        >
                          {ITEM_STATUS_LIST.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Catatan Pengerjaan / Komponen yang Diganti
                        </label>
                        <input
                          type="text"
                          value={newLogNote}
                          onChange={(e) => setNewLogNote(e.target.value)}
                          placeholder="Contoh: Penggantian IC driver coil 30343 dan reballing jalur PCB..."
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white">
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>{newLogPhoto ? 'Ganti Foto Bukti' : 'Lampirkan Foto Bukti'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              readFileAsDataUrl(file, (url) => setNewLogPhoto(url));
                            }}
                          />
                        </label>
                        {newLogPhoto && (
                          <button
                            type="button"
                            onClick={() => setNewLogPhoto(null)}
                            className="text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400"
                          >
                            Hapus foto
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddLog}
                        className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-black"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Pengerjaan</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SEKSI 2: Rincian Biaya & Pembayaran Kas */}
                <div className="ios-glass-inner space-y-3.5 rounded-[24px] p-4">
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      2. Rincian Biaya &amp; Pembayaran
                    </h3>
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      Total: {formatRupiah(calcTotalCharges(editOrder))}
                    </span>
                  </div>

                  {/* List Biaya */}
                  <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                    {editOrder.charges.map((chg) => (
                      <div key={chg.id} className="flex items-center justify-between py-2 text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="mr-1.5 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-white/[0.1] dark:text-slate-300">
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
                            className="text-red-500 hover:text-red-700 dark:text-red-400"
                            title="Hapus Biaya"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Tambah Biaya */}
                  <div className="flex flex-col gap-2 border-t border-black/[0.05] pt-2.5 sm:flex-row dark:border-white/[0.06]">
                    <select
                      value={newChargeKind}
                      onChange={(e) =>
                        setNewChargeKind(e.target.value as 'JASA' | 'SPAREPART' | 'DIAGNOSA')
                      }
                      className="h-10 rounded-xl border border-black/[0.08] bg-white px-2.5 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white sm:w-32"
                    >
                      <option value="JASA">Jasa</option>
                      <option value="SPAREPART">Sparepart</option>
                      <option value="DIAGNOSA">Diagnosa</option>
                    </select>
                    <input
                      type="text"
                      value={newChargeDesc}
                      onChange={(e) => setNewChargeDesc(e.target.value)}
                      placeholder="Deskripsi biaya / komponen..."
                      className="h-10 flex-1 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                    <input
                      type="number"
                      value={newChargePrice}
                      onChange={(e) => setNewChargePrice(e.target.value)}
                      placeholder="Harga (Rp)"
                      className="h-10 rounded-xl border border-black/[0.08] bg-white px-3 font-mono text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white sm:w-32"
                    />
                    <button
                      type="button"
                      onClick={handleAddCharge}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-black"
                    >
                      Tambah Biaya
                    </button>
                  </div>

                  {/* Form Tambah Pembayaran Kas */}
                  <div className="rounded-2xl bg-emerald-500/10 p-3.5 dark:bg-emerald-950/20">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Input Penerimaan Kas / DP / Pelunasan
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={newPayMethod}
                        onChange={(e) => setNewPayMethod(e.target.value as PaymentMethod)}
                        className="h-10 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-slate-900 dark:border-emerald-800 dark:bg-[#1C1C1E] dark:text-white sm:w-40"
                      >
                        <option value={PaymentMethod.TRANSFER}>Transfer Bank</option>
                        <option value={PaymentMethod.TUNAI}>Tunai (Cash)</option>
                        <option value={PaymentMethod.QRIS}>QRIS</option>
                      </select>

                      <input
                        type="number"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        placeholder="Nominal bayar (Rp)"
                        className="h-10 flex-1 rounded-xl border border-emerald-300 bg-white px-3 font-mono text-xs font-bold text-slate-900 dark:border-emerald-800 dark:bg-black/40 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={handleAddPayment}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white tap-bounce hover:bg-emerald-700 dark:bg-emerald-500"
                      >
                        Catat Kas Masuk
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Total Telah Dibayar:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(calcTotalPaid(editOrder))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SEKSI 3: Foto Unit, Informasi Kendaraan & Pelanggan */}
                <div className="ios-glass-inner space-y-3.5 rounded-[24px] p-4">
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      3. Informasi Unit &amp; Pelanggan
                    </h3>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-1 text-[10px] font-bold text-slate-800 hover:bg-black/10 dark:bg-white/10 dark:text-white">
                      <Camera className="h-3 w-3" />
                      <span>Ganti Foto Unit</span>
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Merek Kendaraan / Unit
                      </label>
                      <input
                        type="text"
                        value={editOrder.vehicleBrand || ''}
                        onChange={(e) => setEditOrder({ ...editOrder, vehicleBrand: e.target.value })}
                        placeholder="Contoh: Toyota"
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Model / Tipe
                      </label>
                      <input
                        type="text"
                        value={editOrder.vehicleModel || ''}
                        onChange={(e) => setEditOrder({ ...editOrder, vehicleModel: e.target.value })}
                        placeholder="Contoh: Avanza 1.3 Veloz"
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Plat Nomor
                      </label>
                      <input
                        type="text"
                        value={editOrder.plateNumber || ''}
                        onChange={(e) => setEditOrder({ ...editOrder, plateNumber: e.target.value })}
                        placeholder="Z 1234 AB"
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                      >
                        <option value="MOBIL_UTUH">Mobil Utuh</option>
                        <option value="MODUL_SAJA">Modul Saja</option>
                        <option value="GENSET_INDUSTRI">Genset / Industri</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                      >
                        <option value={CustomerType.PERORANGAN}>Perorangan</option>
                        <option value={CustomerType.MITRA}>Mitra B2B</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Nama Pelanggan
                      </label>
                      <input
                        type="text"
                        value={editOrder.customerName}
                        onChange={(e) => setEditOrder({ ...editOrder, customerName: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Nomor WhatsApp Pelanggan
                      </label>
                      <input
                        type="tel"
                        value={editOrder.customerPhone}
                        onChange={(e) => setEditOrder({ ...editOrder, customerPhone: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    {editOrder.customerType === CustomerType.MITRA && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Bengkel Mitra B2B
                        </label>
                        <select
                          value={
                            normalizeWorkshopName(editOrder.workshopName, CustomerType.MITRA) ||
                            PARTNER_WORKSHOPS[0]
                          }
                          onChange={(e) => setEditOrder({ ...editOrder, workshopName: e.target.value })}
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Catatan Pengingat Prioritas
                      </label>
                      <input
                        type="text"
                        value={editOrder.priorityNote || ''}
                        onChange={(e) =>
                          setEditOrder({ ...editOrder, priorityNote: e.target.value })
                        }
                        placeholder="Pengingat dashboard admin..."
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Catatan Kondisi Awal Unit
                      </label>
                      <textarea
                        rows={2}
                        value={editOrder.conditionNotes || ''}
                        onChange={(e) =>
                          setEditOrder({ ...editOrder, conditionNotes: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Bar Sticky: Lihat Detail / Batal / Simpan */}
                <div className="sticky bottom-0 z-20 flex items-center justify-between gap-2 rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/95">
                  <button
                    type="button"
                    onClick={() => setModalMode('DETAIL')}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview Detail</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="inline-flex min-h-[42px] items-center rounded-full px-4 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-md transition-transform tap-bounce hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
                    >
                      <Save className="h-4 w-4" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL PENERIMAAN UNIT BARU (INTAKE) */}
      {isIntakeOpen && (
        <div
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
                  <h2 className="truncate text-lg font-black tracking-tight text-white sm:text-xl">
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
                    onClick={() => intakePhotoInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/90 px-3 text-[11px] font-bold text-slate-900 shadow-sm transition-colors hover:bg-white"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{intakeCustomPhoto ? 'Ganti Foto' : 'Upload Foto'}</span>
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateIntake} className="space-y-4 p-5 sm:p-6">
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
                                      normalizeWorkshopName(c.workshopName, CustomerType.MITRA) ||
                                        PARTNER_WORKSHOPS[0]
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
                      placeholder="Contoh: Budi Santoso"
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
                            normalizeWorkshopName(intakeWorkshop, CustomerType.MITRA) ||
                              PARTNER_WORKSHOPS[0]
                          );
                        }}
                        className={`h-10 rounded-xl border px-3 text-xs font-bold transition-colors ${
                          intakeCustomerType === CustomerType.MITRA
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.03] dark:border-white/10 dark:bg-black/40 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        Bengkel Mitra B2B
                      </button>
                    </div>
                  </div>

                  {intakeCustomerType === CustomerType.MITRA && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Bengkel Mitra B2B (Dropdown)
                      </label>
                      <select
                        required
                        value={
                          normalizeWorkshopName(intakeWorkshop, CustomerType.MITRA) ||
                          PARTNER_WORKSHOPS[0]
                        }
                        onChange={(e) => setIntakeWorkshop(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                      >
                        {PARTNER_WORKSHOPS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
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
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div className="relative max-w-2xl overflow-hidden rounded-2xl bg-black">
            <button
              type="button"
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={activeLightboxPhoto} alt="Preview" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
