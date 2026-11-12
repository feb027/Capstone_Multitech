'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  INITIAL_SERVICE_ORDERS,
  MockServiceOrder,
  MockProgressLog,
  MockChargeLine,
  MockPayment,
} from '@/lib/frontend-mock';
import {
  ITEM_STATUS_LIST,
  getStatusMeta,
  WORKSHOP_PROFILE,
  getVehicleHeroImage,
  getUnitModelImage,
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
  Calendar,
  Save,
  Clock,
  ShieldCheck,
  FileText,
  CreditCard,
  User,
  Wrench,
  Camera,
  Car,
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

const INTAKE_CHOICES: Array<{ value: IntakeChoice; label: string }> = [
  { value: 'MOBIL_UTUH', label: 'Mobil Utuh' },
  { value: 'MODUL_SAJA', label: 'Modul Saja' },
  { value: 'GENSET_INDUSTRI', label: 'Genset / Industri' },
];

function calcTotalPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

function calcTotalCharges(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

export function AdminServicesClient() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') as ItemStatus | null;
  const initialOrderParam = searchParams.get('orderId') || searchParams.get('order');
  const initialSearchParam = searchParams.get('search') || searchParams.get('customer') || '';
  const shouldOpenNew = searchParams.get('new') === '1';

  const [orders, setOrders] = useState<MockServiceOrder[]>(INITIAL_SERVICE_ORDERS);
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<string | null>(null);

  // Form penerimaan unit baru (Intake)
  const [isIntakeOpen, setIsIntakeOpen] = useState(shouldOpenNew);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeCustomerType, setIntakeCustomerType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [intakeWorkshop, setIntakeWorkshop] = useState('');
  const [intakeChoice, setIntakeChoice] = useState<IntakeChoice>('MOBIL_UTUH');
  const [intakeBrand, setIntakeBrand] = useState('');
  const [intakeModel, setIntakeModel] = useState('');
  const [intakeYear, setIntakeYear] = useState('2019');
  const [intakePlate, setIntakePlate] = useState('');
  const [intakeModuleName, setIntakeModuleName] = useState('ECU (Engine Control Unit)');
  const [intakeSerial, setIntakeSerial] = useState('');
  const [intakeComplaint, setIntakeComplaint] = useState('');
  const [intakeEstimate, setIntakeEstimate] = useState('1500000');
  const [intakeWarranty, setIntakeWarranty] = useState('3');

  // Input log baru di dalam detail order
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<ItemStatus>(ItemStatus.PERBAIKAN);

  // Input biaya baru di dalam detail order
  const [newChargeDesc, setNewChargeDesc] = useState('');
  const [newChargePrice, setNewChargePrice] = useState('');

  // Input bayar baru di dalam detail order
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayMethod, setNewPayMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);

  // Inisialisasi selectedOrder dari query param jika ada
  useEffect(() => {
    if (initialOrderParam) {
      const found = orders.find((o) => o.id === initialOrderParam || o.code === initialOrderParam);
      if (found) {
        setSelectedOrder(found);
        setEditOrder(JSON.parse(JSON.stringify(found)));
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

  // Buka detail order untuk diedit
  const handleOpenDetail = (order: MockServiceOrder) => {
    setSelectedOrder(order);
    setEditOrder(JSON.parse(JSON.stringify(order)));
    setSaveSuccess(false);
  };

  // Simpan perubahan order yang diedit admin
  const handleSaveOrderChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === editOrder.id ? { ...editOrder } : o))
    );
    setSelectedOrder({ ...editOrder });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Tambah biaya (charge) ke order yang sedang diedit
  const handleAddCharge = () => {
    if (!editOrder || !newChargeDesc.trim() || !newChargePrice) return;
    const price = parseInt(newChargePrice.replace(/\D/g, ''), 10) || 0;
    const newChargeItem: MockChargeLine = {
      id: `chg-${Date.now()}`,
      kind: 'JASA',
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

  // Tambah log aktivitas teknisi ke modul pertama
  const handleAddLog = () => {
    if (!editOrder || !newLogNote.trim()) return;
    const newLogItem: MockProgressLog = {
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
      note: `[${getStatusMeta(newLogStatus).label}] ${newLogNote.trim()}`,
      isPublic: true,
      photoUrl: null,
    };
    const updatedItems = editOrder.items.map((item, idx) => {
      if (idx === 0) {
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
  };

  // Submit penerimaan unit baru
  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = generate4DigitCode();
    const isGenset = intakeChoice === 'GENSET_INDUSTRI';
    const isMobilUtuh = intakeChoice === 'MOBIL_UTUH';

    const newOrder: MockServiceOrder = {
      id: `ord-${Date.now()}`,
      publicId: `${(intakeModel || 'unit').toLowerCase().replace(/\s+/g, '-')}-${newCode}`,
      code: newCode,
      customerName: intakeName.trim(),
      customerPhone: intakePhone.trim(),
      customerType: intakeCustomerType,
      workshopName: intakeCustomerType === CustomerType.MITRA ? intakeWorkshop.trim() : null,
      intakeType: isMobilUtuh ? IntakeType.MOBIL_UTUH : IntakeType.MODUL_SAJA,
      entryMethod: EntryMethod.DATANG,
      unitCategory: isGenset ? 'GENSET_INDUSTRI' : 'OTOMOTIF',
      vehicleBrand: intakeBrand.trim() || (isGenset ? 'Deep Sea' : 'Toyota'),
      vehicleModel: intakeModel.trim() || (isGenset ? 'Genset Controller DSE' : 'Avanza'),
      vehicleYear: parseInt(intakeYear, 10) || 2019,
      plateNumber: intakePlate.trim() || null,
      conditionNotes: 'Unit diterima di bengkel dalam kondisi baik.',
      receivedAt: new Date().toISOString(),
      estimatedDoneAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      items: [
        {
          id: `item-${Date.now()}`,
          moduleTypeId: 'mod-1',
          moduleName: intakeModuleName.trim(),
          moduleDetail: intakeSerial.trim() || '',
          complaint: intakeComplaint.trim() || 'Pemeriksaan rutin kelistrikan modul.',
          status: ItemStatus.DITERIMA,
          warrantyMonths: parseInt(intakeWarranty, 10) || 3,
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
      charges: [
        {
          id: `chg-${Date.now()}`,
          kind: 'JASA',
          description: `Estimasi Servis ${intakeModuleName}`,
          qty: 1,
          unitPrice: parseInt(intakeEstimate, 10) || 1500000,
        },
      ],
      payments: [],
    };

    setOrders([newOrder, ...orders]);
    setIsIntakeOpen(false);
    setSelectedOrder(newOrder);
    setEditOrder(JSON.parse(JSON.stringify(newOrder)));

    // Reset Form
    setIntakeName('');
    setIntakePhone('');
    setIntakeBrand('');
    setIntakeModel('');
    setIntakePlate('');
    setIntakeComplaint('');
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
          {/* Tampilan Tabel Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.05] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-4 py-3.5">Kode & Tanggal</th>
                  <th className="px-4 py-3.5">Pelanggan</th>
                  <th className="px-4 py-3.5">Kendaraan / Unit</th>
                  <th className="px-4 py-3.5">Modul & Keluhan</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Biaya / Kas</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {filteredOrders.map((order) => {
                  const primaryItem = order.items[0];
                  const statusMeta = primaryItem ? getStatusMeta(primaryItem.status) : null;
                  const totalCharges = calcTotalCharges(order);
                  const totalPaid = calcTotalPaid(order);
                  const balance = Math.max(0, totalCharges - totalPaid);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      {/* Kode & Tanggal */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            #{order.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCode(order.code);
                            }}
                            title="Salin Kode Nota"
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            {copiedId === order.code ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(order.receivedAt)}
                        </p>
                      </td>

                      {/* Pelanggan */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.customerName}
                        </p>
                        {order.workshopName ? (
                          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                            {order.workshopName}
                          </p>
                        ) : (
                          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            +{order.customerPhone}
                          </p>
                        )}
                      </td>

                      {/* Unit / Kendaraan */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.vehicleBrand} {order.vehicleModel}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{order.vehicleYear ? `Th ${order.vehicleYear}` : ''}</span>
                          {order.plateNumber && <span>· {order.plateNumber}</span>}
                          <span>
                            · {order.unitCategory === 'GENSET_INDUSTRI' ? 'Genset' : order.intakeType === 'MOBIL_UTUH' ? 'Mobil' : 'Modul'}
                          </span>
                        </div>
                      </td>

                      {/* Modul & Keluhan */}
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {primaryItem?.moduleName || 'Modul Servis'}
                        </p>
                        <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                          {primaryItem?.complaint || '-'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {statusMeta && (
                          <span
                            className={`inline-flex min-w-[78px] items-center justify-center rounded-full border px-3 py-1 text-center text-[10px] font-bold leading-none ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.shortLabel}
                          </span>
                        )}
                      </td>

                      {/* Biaya & Bayar */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(totalCharges)}
                        </p>
                        <p
                          className={`text-[10px] font-semibold ${
                            balance === 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {balance === 0 ? 'Lunas' : `Sisa ${formatRupiah(balance)}`}
                        </p>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(order);
                          }}
                          className="ios-glass-inner inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold text-slate-800 transition-colors hover:bg-black/5 tap-bounce dark:text-white dark:hover:bg-white/10"
                        >
                          Detail & Edit
                        </button>
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
              const statusMeta = primaryItem ? getStatusMeta(primaryItem.status) : null;
              const totalCharges = calcTotalCharges(order);
              const totalPaid = calcTotalPaid(order);
              const balance = Math.max(0, totalCharges - totalPaid);

              return (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order)}
                  className="cursor-pointer space-y-2 p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          #{order.code}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                          {order.vehicleBrand} {order.vehicleModel}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                        {order.customerName} {order.workshopName ? `· ${order.workshopName}` : ''}
                      </p>
                    </div>

                    {statusMeta && (
                      <span
                        className={`inline-flex min-w-[72px] shrink-0 items-center justify-center rounded-full border px-2.5 py-0.5 text-center text-[10px] font-bold leading-none ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.shortLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-black/[0.04] pt-2 text-xs dark:border-white/[0.06]">
                    <span className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                      {primaryItem?.moduleName || 'Modul Servis'}
                    </span>
                    <span className="shrink-0 font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(totalCharges)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL SERVIS / ADMIN FULL EDITABLE (Persis Tampilan Pelanggan namun Admin Bisa Edit) */}
      {selectedOrder && editOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="ios-glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] p-5 shadow-2xl sm:rounded-[32px] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Header Modal */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white sm:text-base">
                  Nota Servis #{editOrder.code}
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white dark:bg-white dark:text-black">
                  MODE ADMIN
                </span>
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

            <form onSubmit={handleSaveOrderChanges} className="mt-4 space-y-5">
              {/* Vehicle Photo Hero Card dengan Preview Maximize */}
              <div className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-slate-100 dark:border-white/[0.08] dark:bg-black/30">
                <img
                  src={getVehicleHeroImage(editOrder.vehicleBrand, editOrder.vehicleModel, editOrder.unitCategory).src}
                  alt="Unit Servis"
                  className="h-44 w-full object-cover sm:h-52"
                />
                <button
                  type="button"
                  onClick={() =>
                    setActiveLightboxPhoto(
                      getVehicleHeroImage(editOrder.vehicleBrand, editOrder.vehicleModel, editOrder.unitCategory).src
                    )
                  }
                  className="absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md"
                  aria-label="Perbesar Foto Unit"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* SEKSI 1: Identitas Kendaraan & Pelanggan (Admin Editable) */}
              <div className="ios-glass-inner space-y-3.5 rounded-[24px] p-4">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Informasi Unit & Pelanggan
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Bisa diedit langsung
                  </span>
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

                  {/* Dropdown Intake Type (Pilihan Pasti) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Jenis Kedatangan Unit (Dropdown)
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
                          intakeType: val === 'MOBIL_UTUH' ? IntakeType.MOBIL_UTUH : IntakeType.MODUL_SAJA,
                        });
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                    >
                      <option value="MOBIL_UTUH">Mobil Utuh (Bawa Kendaraan)</option>
                      <option value="MODUL_SAJA">Modul Saja (Lepasan / Kirim)</option>
                      <option value="GENSET_INDUSTRI">Genset / Industri (Panel & Modul)</option>
                    </select>
                  </div>

                  {/* Dropdown Customer Type (Pilihan Pasti) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tipe Pelanggan (Dropdown)
                    </label>
                    <select
                      value={editOrder.customerType}
                      onChange={(e) =>
                        setEditOrder({
                          ...editOrder,
                          customerType: e.target.value as CustomerType,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                    >
                      <option value={CustomerType.PERORANGAN}>Perorangan (Pemilik Langsung)</option>
                      <option value={CustomerType.MITRA}>Mitra B2B (Bengkel Rekanan)</option>
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
                        Nama Bengkel Mitra B2B
                      </label>
                      <input
                        type="text"
                        value={editOrder.workshopName || ''}
                        onChange={(e) => setEditOrder({ ...editOrder, workshopName: e.target.value })}
                        placeholder="Contoh: Bengkel Maju Motor Tasik"
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SEKSI 2: Modul & Status Pengerjaan (Admin Editable) */}
              <div className="ios-glass-inner space-y-3.5 rounded-[24px] p-4">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Modul, Status & Progres Pengerjaan
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Dropdown status otomatis perbarui timeline
                  </span>
                </div>

                {editOrder.items.map((item, idx) => (
                  <div key={item.id} className="space-y-3 rounded-2xl bg-black/[0.02] p-3.5 dark:bg-white/[0.03]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Nama Modul
                        </label>
                        <input
                          type="text"
                          value={item.moduleName}
                          onChange={(e) => {
                            const updated = [...editOrder.items];
                            updated[idx].moduleName = e.target.value;
                            setEditOrder({ ...editOrder, items: updated });
                          }}
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                      </div>

                      {/* Dropdown Status Modul (Pilihan Pasti) */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Status Pengerjaan (Dropdown)
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as ItemStatus;
                            const updated = [...editOrder.items];
                            updated[idx].status = newStatus;
                            setEditOrder({ ...editOrder, items: updated });
                          }}
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
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
                          Keluhan / Gejala Kerusakan
                        </label>
                        <textarea
                          rows={2}
                          value={item.complaint}
                          onChange={(e) => {
                            const updated = [...editOrder.items];
                            updated[idx].complaint = e.target.value;
                            setEditOrder({ ...editOrder, items: updated });
                          }}
                          className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Garansi (Dropdown)
                        </label>
                        <select
                          value={item.warrantyMonths || 0}
                          onChange={(e) => {
                            const updated = [...editOrder.items];
                            updated[idx].warrantyMonths = parseInt(e.target.value, 10) || 0;
                            setEditOrder({ ...editOrder, items: updated });
                          }}
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                        >
                          <option value="0">Tanpa Garansi</option>
                          <option value="1">Garansi 1 Bulan</option>
                          <option value="3">Garansi 3 Bulan</option>
                          <option value="6">Garansi 6 Bulan</option>
                          <option value="12">Garansi 12 Bulan (1 Tahun)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Detail Seri / Modul
                        </label>
                        <input
                          type="text"
                          value={item.moduleDetail || ''}
                          onChange={(e) => {
                            const updated = [...editOrder.items];
                            updated[idx].moduleDetail = e.target.value;
                            setEditOrder({ ...editOrder, items: updated });
                          }}
                          placeholder="Nomor part / kode IC"
                          className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Form Tambah Log Aktivitas Baru */}
                <div className="border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tambah Catatan Log Aktivitas Teknisi
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={newLogStatus}
                      onChange={(e) => setNewLogStatus(e.target.value as ItemStatus)}
                      className="h-10 shrink-0 rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white sm:w-44"
                    >
                      {ITEM_STATUS_LIST.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      placeholder="Tuliskan catatan pengerjaan / penggantian komponen..."
                      className="h-10 flex-1 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={handleAddLog}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-black"
                    >
                      Tambah Log
                    </button>
                  </div>
                </div>
              </div>

              {/* SEKSI 3: Rincian Biaya & Pembayaran (Admin Editable) */}
              <div className="ios-glass-inner space-y-3.5 rounded-[24px] p-4">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 dark:border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Rincian Biaya & Rekap Pembayaran
                  </h3>
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                    Total: {formatRupiah(calcTotalCharges(editOrder))}
                  </span>
                </div>

                {/* List Biaya dengan Tombol Hapus */}
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {editOrder.charges.map((chg) => (
                    <div key={chg.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {chg.description}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          1 x {formatRupiah(chg.unitPrice)}
                        </p>
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
                <div className="flex flex-col gap-2 border-t border-black/[0.05] pt-2 sm:flex-row dark:border-white/[0.06]">
                  <input
                    type="text"
                    value={newChargeDesc}
                    onChange={(e) => setNewChargeDesc(e.target.value)}
                    placeholder="Deskripsi biaya (contoh: Jasa Reballing IC)"
                    className="h-10 flex-1 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                  <input
                    type="number"
                    value={newChargePrice}
                    onChange={(e) => setNewChargePrice(e.target.value)}
                    placeholder="Harga (Rp)"
                    className="h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-mono text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white sm:w-36"
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
                      className="h-10 flex-1 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-mono font-bold text-slate-900 dark:border-emerald-800 dark:bg-black/40 dark:text-white"
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

              {/* Action Bar Sticky: Simpan Perubahan */}
              <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2.5 rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/95">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex min-h-[44px] items-center rounded-full px-5 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-slate-900 px-6 text-xs font-bold text-white shadow-md transition-transform tap-bounce hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENERIMAAN UNIT BARU (INTAKE) */}
      {isIntakeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={() => setIsIntakeOpen(false)}
        >
          <div
            className="ios-glass-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[32px] p-5 shadow-2xl sm:rounded-[32px] sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5 dark:border-white/[0.08]">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Penerimaan Unit Servis Baru
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Isi data pelanggan, spesifikasi kendaraan, dan keluhan modul.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIntakeOpen(false)}
                className="ios-glass-inner flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIntake} className="mt-4 space-y-4">
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

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tipe Pelanggan (Dropdown)
                  </label>
                  <select
                    value={intakeCustomerType}
                    onChange={(e) => setIntakeCustomerType(e.target.value as CustomerType)}
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                  >
                    <option value={CustomerType.PERORANGAN}>Perorangan</option>
                    <option value={CustomerType.MITRA}>Mitra B2B (Bengkel Rekanan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Kategori Intake (Dropdown)
                  </label>
                  <select
                    value={intakeChoice}
                    onChange={(e) => setIntakeChoice(e.target.value as IntakeChoice)}
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                  >
                    {INTAKE_CHOICES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {intakeCustomerType === CustomerType.MITRA && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Nama Bengkel Mitra B2B
                    </label>
                    <input
                      type="text"
                      required
                      value={intakeWorkshop}
                      onChange={(e) => setIntakeWorkshop(e.target.value)}
                      placeholder="Nama Bengkel Rekanan"
                      className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Merek Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeBrand}
                    onChange={(e) => setIntakeBrand(e.target.value)}
                    placeholder="Toyota / Honda / Mitsubishi / Deep Sea"
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
                    placeholder="Avanza / Pajero / Genset DSE"
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
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nama Modul yang Dikerjakan
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeModuleName}
                    onChange={(e) => setIntakeModuleName(e.target.value)}
                    placeholder="ECU / Speedometer / EPS / BCM / Panel AMF"
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Keluhan & Gejala Kerusakan
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={intakeComplaint}
                    onChange={(e) => setIntakeComplaint(e.target.value)}
                    placeholder="Jelaskan kendala seperti mogok, check engine menyala, mati total..."
                    className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Estimasi Biaya Servis (Rp)
                  </label>
                  <input
                    type="number"
                    value={intakeEstimate}
                    onChange={(e) => setIntakeEstimate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-mono font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Masa Garansi
                  </label>
                  <select
                    value={intakeWarranty}
                    onChange={(e) => setIntakeWarranty(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                  >
                    <option value="1">1 Bulan</option>
                    <option value="3">3 Bulan</option>
                    <option value="6">6 Bulan</option>
                    <option value="12">12 Bulan (1 Tahun)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-full px-5 text-xs font-bold text-slate-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-6 text-xs font-bold text-white shadow-md tap-bounce dark:bg-white dark:text-black"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Nota & Masukkan Antrean</span>
                </button>
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
