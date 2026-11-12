'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  INITIAL_SERVICE_ORDERS,
  MockServiceOrder,
} from '@/lib/frontend-mock';
import { ITEM_STATUS_LIST, getStatusMeta, WORKSHOP_PROFILE } from '@/lib/status';
import { FilterScrollRow } from '@/components/shared/FilterScrollRow';
import { formatDateTime, formatRupiah, generate4DigitCode } from '@/lib/utils';
import {
  Plus,
  Search,
  X,
  Check,
  Copy,
  MessageCircle,
  Printer,
  Camera,
  Trash2,
} from 'lucide-react';

const STATUS_FILTER_PILLS: Array<{ value: 'ALL' | ItemStatus; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: ItemStatus.DITERIMA, label: 'Diterima' },
  { value: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { value: ItemStatus.MENUNGGU_SPAREPART, label: 'Tunggu Part' },
  { value: ItemStatus.PERBAIKAN, label: 'Perbaikan' },
  { value: ItemStatus.UJI_QC, label: 'QC' },
  { value: ItemStatus.SIAP_DIAMBIL, label: 'Siap Ambil' },
  { value: ItemStatus.SELESAI, label: 'Selesai' },
];

type IntakeChoice = 'MOBIL_UTUH' | 'MODUL_SAJA' | 'GENSET_INDUSTRI';

const INTAKE_CHOICES: Array<{ value: IntakeChoice; label: string }> = [
  { value: 'MOBIL_UTUH', label: 'Mobil Utuh' },
  { value: 'MODUL_SAJA', label: 'Modul Saja' },
  { value: 'GENSET_INDUSTRI', label: 'Genset / Industri' },
];

function calcTotalPaid(order: MockServiceOrder): number {
  return order.payments.reduce((sum, p) => sum + p.amount, 0);
}

function calcTotalCharges(order: MockServiceOrder): number {
  return order.charges.reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

function formatVehicleTitle(order: MockServiceOrder): string {
  return [order.vehicleBrand, order.vehicleModel, order.vehicleYear].filter(Boolean).join(' ');
}

export function AdminServicesClient() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') as ItemStatus | null;
  const initialOrderParam = searchParams.get('order');
  const shouldOpenNew = searchParams.get('new') === '1';

  const [orders, setOrders] = useState<MockServiceOrder[]>(INITIAL_SERVICE_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ItemStatus>(
    initialStatusParam && ITEM_STATUS_LIST.some((s) => s.key === initialStatusParam)
      ? initialStatusParam
      : 'ALL'
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderParam);
  const [isIntakeOpen, setIsIntakeOpen] = useState(shouldOpenNew);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form penerimaan unit baru
  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeCustomerType, setIntakeCustomerType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [intakeWorkshop, setIntakeWorkshop] = useState('');
  const [intakeChoice, setIntakeChoice] = useState<IntakeChoice>('MOBIL_UTUH');
  const [intakeBrand, setIntakeBrand] = useState('');
  const [intakeModel, setIntakeModel] = useState('');
  const [intakePlate, setIntakePlate] = useState('');
  const [intakeModuleName, setIntakeModuleName] = useState('ECU (Engine Control Unit)');
  const [intakeSerial, setIntakeSerial] = useState('');
  const [intakeComplaint, setIntakeComplaint] = useState('');
  const [intakeEstimate, setIntakeEstimate] = useState('1500000');
  const [intakeWarranty, setIntakeWarranty] = useState('3');

  // Form update progres & log teknisi
  const [logStatus, setLogStatus] = useState<ItemStatus>(ItemStatus.DIAGNOSA);
  const [logNote, setLogNote] = useState('');
  const [logPublic, setLogPublic] = useState(true);
  const [logPhotoUrl, setLogPhotoUrl] = useState('');

  // Form biaya baru
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeKind, setChargeKind] = useState<'JASA' | 'SPAREPART' | 'DIAGNOSA'>('JASA');
  const [chargeAmount, setChargeAmount] = useState('');

  // Form pembayaran baru
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('DP Servis');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (selectedOrder?.items[0]) {
      setLogStatus(selectedOrder.items[0].status);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (!isIntakeOpen && !selectedOrderId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isIntakeOpen) setIsIntakeOpen(false);
        else if (selectedOrderId) setSelectedOrderId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isIntakeOpen, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const mainStatus = order.items[0]?.status;
      if (statusFilter !== 'ALL' && mainStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vehicleTitle = formatVehicleTitle(order).toLowerCase();
        const hit =
          order.code.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          vehicleTitle.includes(q) ||
          (order.plateNumber && order.plateNumber.toLowerCase().includes(q)) ||
          order.items.some(
            (it) =>
              it.moduleName.toLowerCase().includes(q) ||
              it.complaint.toLowerCase().includes(q)
          );
        if (!hit) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intakeName.trim() || !intakePhone.trim() || !intakeBrand.trim() || !intakeComplaint.trim()) {
      return;
    }

    const normalizedPhone = intakePhone.replace(/\D/g, '');
    const code = generate4DigitCode();
    const slugBase = (intakeModel || intakeBrand)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 14);
    const estimateNum = Math.max(0, Number(intakeEstimate) || 0);
    const warrantyMonths = Math.max(0, Number(intakeWarranty) || 0);
    const nowIso = new Date().toISOString();

    const unitCategory = intakeChoice === 'GENSET_INDUSTRI' ? 'GENSET_INDUSTRI' : 'OTOMOTIF';
    const intakeType = intakeChoice === 'MODUL_SAJA' ? IntakeType.MODUL_SAJA : IntakeType.MOBIL_UTUH;

    const newOrder: MockServiceOrder = {
      id: `ord-${Date.now()}`,
      code,
      publicId: `${slugBase || 'unit'}-${code.toLowerCase()}`,
      customerName: intakeName.trim(),
      customerPhone: normalizedPhone.startsWith('62')
        ? normalizedPhone
        : `62${normalizedPhone.replace(/^0/, '')}`,
      customerType: intakeCustomerType,
      workshopName: intakeCustomerType === CustomerType.MITRA ? intakeWorkshop.trim() || null : null,
      vehicleBrand: intakeBrand.trim(),
      vehicleModel: intakeModel.trim() || '-',
      vehicleYear: null,
      plateNumber: intakePlate.trim() ? intakePlate.trim().toUpperCase() : null,
      unitCategory,
      intakeType,
      entryMethod: intakeChoice === 'MODUL_SAJA' ? EntryMethod.EKSPEDISI : EntryMethod.DATANG,
      conditionNotes: intakeComplaint.trim(),
      receivedAt: nowIso,
      estimatedDoneAt: null,
      items: [
        {
          id: `item-${Date.now()}`,
          moduleTypeId: 'custom',
          moduleName: intakeModuleName,
          moduleDetail: intakeSerial.trim() || 'Unit Servis',
          complaint: intakeComplaint.trim(),
          status: ItemStatus.DITERIMA,
          warrantyMonths,
          logs: [
            {
              id: `log-${Date.now()}`,
              note: `Unit diterima di bengkel (${INTAKE_CHOICES.find((c) => c.value === intakeChoice)?.label}). Menunggu diagnosa awal teknisi.`,
              photoUrl: null,
              isPublic: true,
              createdAt: nowIso,
            },
          ],
        },
      ],
      charges:
        estimateNum > 0
          ? [
              {
                id: `chg-${Date.now()}`,
                kind: 'JASA',
                description: `Estimasi Servis ${intakeModuleName}`,
                qty: 1,
                unitPrice: estimateNum,
              },
            ]
          : [],
      payments: [],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsIntakeOpen(false);
    setSelectedOrderId(newOrder.id);

    setIntakeName('');
    setIntakePhone('');
    setIntakeWorkshop('');
    setIntakeBrand('');
    setIntakeModel('');
    setIntakePlate('');
    setIntakeSerial('');
    setIntakeComplaint('');
  }

  function handleAddTechnicianLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !logNote.trim()) return;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== selectedOrder.id) return order;
        const nextItems = order.items.map((item, idx) => {
          if (idx !== 0) return item;
          return {
            ...item,
            status: logStatus,
            logs: [
              {
                id: `log-${Date.now()}`,
                note: logNote.trim(),
                photoUrl: logPhotoUrl.trim() || null,
                isPublic: logPublic,
                createdAt: nowIso,
              },
              ...item.logs,
            ],
          };
        });
        return { ...order, items: nextItems };
      })
    );
    setLogNote('');
    setLogPhotoUrl('');
  }

  function handleAddCharge(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || !chargeDesc.trim()) return;
    const amt = Math.max(0, Number(chargeAmount) || 0);
    if (amt <= 0) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== selectedOrder.id) return order;
        return {
          ...order,
          charges: [
            ...order.charges,
            {
              id: `chg-${Date.now()}`,
              kind: chargeKind,
              description: chargeDesc.trim(),
              qty: 1,
              unitPrice: amt,
            },
          ],
        };
      })
    );
    setChargeDesc('');
    setChargeAmount('');
  }

  function handleRemoveCharge(chargeId: string) {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== selectedOrder.id) return order;
        return {
          ...order,
          charges: order.charges.filter((c) => c.id !== chargeId),
        };
      })
    );
  }

  function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    const amt = Math.max(0, Number(payAmount) || 0);
    if (amt <= 0) return;
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== selectedOrder.id) return order;
        return {
          ...order,
          payments: [
            ...order.payments,
            {
              id: `pay-${Date.now()}`,
              amount: amt,
              method: payMethod,
              paidAt: nowIso,
              note: payNote,
            },
          ],
        };
      })
    );
    setPayAmount('');
  }

  function handleCopyTrackingLink(order: MockServiceOrder) {
    const url = `${window.location.origin}/track/${order.publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function buildWhatsAppHref(order: MockServiceOrder): string {
    const phoneDigits = order.customerPhone.replace(/\D/g, '');
    const waNumber = phoneDigits.startsWith('62') ? phoneDigits : WORKSHOP_PROFILE.whatsappNumber;
    const primaryItem = order.items[0];
    const statusLabel = primaryItem ? getStatusMeta(primaryItem.status).label : '';
    const msg = `Halo ${order.customerName}, ini update dari ${WORKSHOP_PROFILE.name} untuk unit ${formatVehicleTitle(order)} (Kode: ${order.code}). Status saat ini: ${statusLabel}. Pantau progres & nota di /track/${order.publicId}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Manajemen Servis & Rekam Medis
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Kelola penerimaan unit, diagnosa teknisi, rincian biaya, pembayaran, dan garansi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsIntakeOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Terima Unit Baru</span>
        </button>
      </div>

      {/* Pencarian & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode servis, pelanggan, mobil, genset, plat, atau keluhan..."
            aria-label="Cari unit servis"
            className="h-12 w-full rounded-full border border-black/[0.06] bg-white pl-11 pr-11 text-sm text-slate-900 placeholder-slate-500 shadow-sm focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white dark:placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <FilterScrollRow ariaLabel="Filter status servis">
          {STATUS_FILTER_PILLS.map((pill) => {
            const active = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(pill.value)}
                className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-all tap-bounce ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:bg-[#1C1C1E] dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </FilterScrollRow>
      </div>

      {/* Daftar Order Servis */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-[26px] border border-black/[0.04] bg-white p-10 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Tidak ada unit sesuai filter
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Ubah kata kunci atau pilih status lain untuk melihat seluruh antrean.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-5 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredOrders.map((order) => {
            const primary = order.items[0];
            const meta = getStatusMeta(primary.status);
            const totalCharges = calcTotalCharges(order);
            const totalPaid = calcTotalPaid(order);
            const remaining = Math.max(0, totalCharges - totalPaid);

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-[26px] border border-black/[0.04] bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-white/[0.06] dark:bg-[#1C1C1E]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[#F2F2F7] px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:bg-white/10 dark:text-white">
                        {order.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.shortLabel}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {order.unitCategory === 'GENSET_INDUSTRI'
                        ? 'Genset'
                        : order.intakeType === IntakeType.MODUL_SAJA
                          ? 'Modul'
                          : 'Mobil'}
                    </span>
                  </div>

                  <h2 className="mt-3 text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatVehicleTitle(order)}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {order.customerName}
                    {order.workshopName ? ` (${order.workshopName})` : ''}
                    {order.plateNumber ? ` | ${order.plateNumber}` : ''}
                  </p>

                  <div className="mt-3 rounded-2xl bg-[#F2F2F7] p-3.5 dark:bg-white/[0.04]">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {primary.moduleName} ({primary.moduleDetail})
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                      {primary.complaint}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/[0.05] pt-3.5 dark:border-white/[0.06]">
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {formatRupiah(totalCharges)}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {remaining === 0 && totalCharges > 0
                        ? 'Lunas'
                        : `Sisa ${formatRupiah(remaining)}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="inline-flex min-h-[44px] items-center rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Kelola Unit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Penerimaan Unit Baru */}
      {isIntakeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intake-modal-title"
          onClick={() => setIsIntakeOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[36px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="intake-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Terima Unit Servis Baru
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Buat kode tracking unik dan catat keluhan awal pelanggan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIntakeOpen(false)}
                aria-label="Tutup form penerimaan unit"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="intake-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nama Pelanggan *
                  </label>
                  <input
                    id="intake-name"
                    type="text"
                    required
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="intake-phone" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    No. WhatsApp *
                  </label>
                  <input
                    id="intake-phone"
                    type="tel"
                    required
                    value={intakePhone}
                    onChange={(e) => setIntakePhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="intake-ctype" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tipe Pelanggan
                  </label>
                  <select
                    id="intake-ctype"
                    value={intakeCustomerType}
                    onChange={(e) => setIntakeCustomerType(e.target.value as CustomerType)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                  >
                    <option value={CustomerType.PERORANGAN}>Perorangan</option>
                    <option value={CustomerType.MITRA}>Bengkel Mitra B2B / Industri</option>
                  </select>
                </div>

                {intakeCustomerType === CustomerType.MITRA && (
                  <div>
                    <label htmlFor="intake-workshop" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Nama Bengkel / Perusahaan
                    </label>
                    <input
                      id="intake-workshop"
                      type="text"
                      value={intakeWorkshop}
                      onChange={(e) => setIntakeWorkshop(e.target.value)}
                      placeholder="Contoh: Bengkel Maju Tasik"
                      className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Kategori Penerimaan Unit
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {INTAKE_CHOICES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setIntakeChoice(cat.value)}
                      className={`min-h-[44px] rounded-2xl px-2 text-xs font-semibold transition-all tap-bounce ${
                        intakeChoice === cat.value
                          ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                          : 'bg-[#F2F2F7] text-slate-700 hover:bg-slate-200/70 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="intake-brand" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Merek Unit *
                  </label>
                  <input
                    id="intake-brand"
                    type="text"
                    required
                    value={intakeBrand}
                    onChange={(e) => setIntakeBrand(e.target.value)}
                    placeholder="Toyota / Deep Sea"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="intake-model" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Model / Tipe
                  </label>
                  <input
                    id="intake-model"
                    type="text"
                    value={intakeModel}
                    onChange={(e) => setIntakeModel(e.target.value)}
                    placeholder="Avanza / DSE7320"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="intake-plate" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Plat (Opsional)
                  </label>
                  <input
                    id="intake-plate"
                    type="text"
                    value={intakePlate}
                    onChange={(e) => setIntakePlate(e.target.value)}
                    placeholder="Z 1842 KEM"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm uppercase text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="intake-module" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Jenis Modul
                  </label>
                  <select
                    id="intake-module"
                    value={intakeModuleName}
                    onChange={(e) => setIntakeModuleName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                  >
                    <option value="ECU (Engine Control Unit)">ECU (Engine Control Unit)</option>
                    <option value="BCM (Body Control Module)">BCM (Body Control Module)</option>
                    <option value="EPS (Electric Power Steering)">EPS (Electric Power Steering)</option>
                    <option value="Speedometer / Cluster">Speedometer / Cluster</option>
                    <option value="Modul Kontrol Genset / AMF">Modul Kontrol Genset / AMF</option>
                    <option value="TCM / ABS Module">TCM / ABS Module</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="intake-serial" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    No. Seri / Part Number
                  </label>
                  <input
                    id="intake-serial"
                    type="text"
                    value={intakeSerial}
                    onChange={(e) => setIntakeSerial(e.target.value)}
                    placeholder="Contoh: Bosch ME17.9.11"
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="intake-complaint" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Keluhan Pelanggan *
                </label>
                <textarea
                  id="intake-complaint"
                  rows={2}
                  required
                  value={intakeComplaint}
                  onChange={(e) => setIntakeComplaint(e.target.value)}
                  placeholder="Jelaskan gejala kerusakan..."
                  className="mt-1.5 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] p-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white dark:placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="intake-estimate" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Estimasi Biaya (Rp)
                  </label>
                  <input
                    id="intake-estimate"
                    type="number"
                    min={0}
                    step={50000}
                    value={intakeEstimate}
                    onChange={(e) => setIntakeEstimate(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="intake-warranty" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Garansi (Bulan)
                  </label>
                  <input
                    id="intake-warranty"
                    type="number"
                    min={0}
                    max={24}
                    value={intakeWarranty}
                    onChange={(e) => setIntakeWarranty(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-black/[0.06] bg-[#F2F2F7] px-3.5 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Simpan Penerimaan & Buat Kode Tracking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sheet Detail Unit Servis */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[36px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:border-white/[0.08] dark:bg-[#1C1C1E] animate-[appleSheetSlideUp_0.35s_cubic-bezier(0.32,0.72,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    {selectedOrder.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {selectedOrder.customerName}
                    {selectedOrder.plateNumber ? ` | ${selectedOrder.plateNumber}` : ''}
                  </span>
                </div>
                <h2 id="detail-modal-title" className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {formatVehicleTitle(selectedOrder)} | {selectedOrder.items[0]?.moduleName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Masuk: {formatDateTime(selectedOrder.receivedAt)} | Pin Verifikasi: {selectedOrder.customerPhone.slice(-4)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label="Tutup detail unit"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Aksi Cepat */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyTrackingLink(selectedOrder)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
              >
                {copiedId === selectedOrder.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Link Tracking Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Salin Link Tracking</span>
                  </>
                )}
              </button>

              <a
                href={buildWhatsAppHref(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 tap-bounce"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>WhatsApp Pelanggan</span>
              </a>

              <a
                href={`/track/${selectedOrder.publicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Lihat & Cetak Nota</span>
              </a>
            </div>

            <div className="mt-5 space-y-5">
              {/* Update Progres & Log Teknisi */}
              <form
                onSubmit={handleAddTechnicianLog}
                className="space-y-3 rounded-[22px] bg-[#F2F2F7] p-4 dark:bg-white/[0.04]"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Update Status & Rekam Medis Teknisi
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="log-status" className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Status Pengerjaan
                    </label>
                    <select
                      id="log-status"
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value as ItemStatus)}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                    >
                      {ITEM_STATUS_LIST.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="log-photo" className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>URL Foto Bukti (Opsional)</span>
                    </label>
                    <input
                      id="log-photo"
                      type="url"
                      value={logPhotoUrl}
                      onChange={(e) => setLogPhotoUrl(e.target.value)}
                      placeholder="https://... atau kosongkan"
                      className="mt-1 h-11 w-full rounded-2xl border border-black/[0.06] bg-white px-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="log-note" className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Catatan Diagnosa / Tindakan *
                  </label>
                  <textarea
                    id="log-note"
                    rows={2}
                    required
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Contoh: Penggantian IC Driver dan kalibrasi pin keluaran..."
                    className="mt-1 w-full rounded-2xl border border-black/[0.06] bg-white p-3.5 text-sm text-slate-900 placeholder-slate-500 focus:border-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={logPublic}
                      onChange={(e) => setLogPublic(e.target.checked)}
                      className="h-4 w-4 rounded accent-slate-900 dark:accent-white"
                    />
                    <span>Tampilkan catatan ini ke portal pelanggan</span>
                  </label>

                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Simpan Progress
                  </button>
                </div>
              </form>

              {/* Riwayat Rekam Medis */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Riwayat Catatan Teknisi
                </h3>
                {selectedOrder.items[0]?.logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-[#F2F2F7] p-3.5 dark:bg-white/[0.04]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-white/10 dark:text-white">
                        {log.isPublic ? 'Publik' : 'Internal'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                      {log.note}
                    </p>
                    {log.photoUrl && (
                      <a
                        href={log.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        Buka foto lampiran
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Rincian Biaya & Pembayaran */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] bg-[#F2F2F7] p-4 dark:bg-white/[0.04]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Rincian Biaya Jasa & Part
                  </h3>
                  <div className="mt-3 space-y-2">
                    {selectedOrder.charges.map((chg) => (
                      <div
                        key={chg.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs dark:bg-white/[0.06]"
                      >
                        <span className="min-w-0 truncate text-slate-800 dark:text-slate-200">
                          {chg.description}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(chg.qty * chg.unitPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCharge(chg.id)}
                            aria-label={`Hapus biaya ${chg.description}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddCharge} className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={chargeKind}
                        onChange={(e) => setChargeKind(e.target.value as 'JASA' | 'SPAREPART' | 'DIAGNOSA')}
                        aria-label="Jenis item biaya"
                        className="h-10 rounded-xl border border-black/[0.06] bg-white px-2.5 text-xs text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                      >
                        <option value="JASA">Jasa</option>
                        <option value="SPAREPART">Part</option>
                        <option value="DIAGNOSA">Diagnosa</option>
                      </select>
                      <input
                        type="text"
                        value={chargeDesc}
                        onChange={(e) => setChargeDesc(e.target.value)}
                        placeholder="Deskripsi jasa / part"
                        aria-label="Deskripsi item biaya"
                        className="h-10 flex-1 rounded-xl border border-black/[0.06] bg-white px-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        placeholder="Nominal (Rp)"
                        aria-label="Nominal biaya"
                        className="h-10 flex-1 rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
                      />
                      <button
                        type="submit"
                        className="min-h-[40px] rounded-full bg-slate-900 px-4 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-slate-900"
                      >
                        Tambah
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-[22px] bg-[#F2F2F7] p-4 dark:bg-white/[0.04]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Riwayat Pembayaran
                  </h3>
                  <div className="mt-3 space-y-2">
                    {selectedOrder.payments.length === 0 ? (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Belum ada pembayaran masuk.
                      </p>
                    ) : (
                      selectedOrder.payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs dark:bg-white/[0.06]"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {pay.note || 'Pembayaran'} ({pay.method})
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            +{formatRupiah(pay.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddPayment} className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={payNote}
                        onChange={(e) => setPayNote(e.target.value)}
                        aria-label="Keterangan pembayaran"
                        className="h-10 rounded-xl border border-black/[0.06] bg-white px-2.5 text-xs text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                      >
                        <option value="DP Servis">DP</option>
                        <option value="Pelunasan">Pelunasan</option>
                      </select>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        aria-label="Metode pembayaran"
                        className="h-10 rounded-xl border border-black/[0.06] bg-white px-2.5 text-xs text-slate-900 focus:outline-none dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white"
                      >
                        <option value={PaymentMethod.TRANSFER}>Transfer</option>
                        <option value={PaymentMethod.TUNAI}>Tunai</option>
                        <option value={PaymentMethod.QRIS}>QRIS</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Nominal bayar (Rp)"
                        aria-label="Nominal pembayaran"
                        className="h-10 flex-1 rounded-xl border border-black/[0.06] bg-white px-3 font-mono text-xs text-slate-900 placeholder-slate-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder-slate-400"
                      />
                      <button
                        type="submit"
                        className="min-h-[40px] rounded-full bg-emerald-600 px-4 text-xs font-bold text-white tap-bounce hover:bg-emerald-700"
                      >
                        Catat
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
