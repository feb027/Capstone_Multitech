'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CustomerType } from '@prisma/client';
import {
  MockServiceOrder,
  PARTNER_WORKSHOPS,
  normalizePhone,
  normalizeWorkshopName,
} from '@/lib/frontend-mock';
import { useDataset } from '@/lib/use-dataset';
import { getStatusMeta } from '@/lib/status';
import { formatDate, formatRupiah } from '@/lib/utils';
import { ServicePreviewModal } from '@/components/admin/services/ServicePreviewModal';
import { calcTotalCharges, calcTotalPaid } from '@/components/admin/services/service-utils';
import {
  ArrowLeft,
  Building2,
  Car,
  Check,
  Eye,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  UserCheck,
  X,
} from 'lucide-react';
import {
  CustomerRow,
  buildAllCustomers,
  findCustomerByIdentifier,
  getCustomerInitials,
  getCustomerOrders,
} from '../customer-utils';

export function CustomerDetailClient({
  customerId,
  initialCustomers,
  initialOrders,
}: {
  customerId: string;
  initialCustomers: CustomerRow[];
  initialOrders: MockServiceOrder[];
}) {
  const { orders, customers, upsertCustomer, addVehicle } = useDataset(
    initialOrders,
    initialCustomers
  );

  const allCustomers = useMemo(
    () => buildAllCustomers(customers, orders),
    [customers, orders]
  );

  const customer = useMemo(
    () => findCustomerByIdentifier(allCustomers, customerId),
    [allCustomers, customerId]
  );

  const customerOrders = useMemo(
    () => (customer ? getCustomerOrders(customer, orders) : []),
    [customer, orders]
  );

  const totalSpent = useMemo(
    () => customerOrders.reduce((sum, ord) => sum + calcTotalCharges(ord), 0),
    [customerOrders]
  );

  const [selectedOrder, setSelectedOrder] = useState<MockServiceOrder | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState<CustomerType>(CustomerType.PERORANGAN);
  const [editWorkshop, setEditWorkshop] = useState<string>(PARTNER_WORKSHOPS[0]);
  const [editAddress, setEditAddress] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehBrand, setVehBrand] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehicleSaved, setVehicleSaved] = useState(false);

  useEffect(() => {
    const hasOpenModal = Boolean(isEditOpen || isAddVehicleOpen);
    if (!hasOpenModal) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isEditOpen) {
        setIsEditOpen(false);
      } else if (isAddVehicleOpen) {
        setIsAddVehicleOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditOpen, isAddVehicleOpen]);

  const openEditProfile = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditType(customer.type);
    setEditWorkshop(
      normalizeWorkshopName(customer.workshopName, CustomerType.MITRA) || PARTNER_WORKSHOPS[0]
    );
    setEditAddress(customer.address || '');
    setIsEditOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    await upsertCustomer({
      id: customer.id,
      previousPhone: customer.phone,
      name: editName.trim() || customer.name,
      phone: editPhone.trim() || customer.phone,
      type: editType,
      workshopName: editType === CustomerType.MITRA ? editWorkshop : null,
      address: editAddress.trim() || null,
    });

    setIsEditOpen(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !vehBrand.trim() || !vehModel.trim()) return;

    const vehicle = {
      brand: vehBrand.trim(),
      model: vehModel.trim(),
      year: vehYear.trim() ? parseInt(vehYear.trim(), 10) : null,
      plateNumber: vehPlate.trim() || null,
    };

    const existsInStore = customers.some((c) => c.id === customer.id);
    if (existsInStore) {
      await addVehicle(customer.id, vehicle);
    } else {
      await upsertCustomer({
        id: customer.id,
        previousPhone: customer.phone,
        name: customer.name,
        phone: customer.phone,
        type: customer.type,
        workshopName: customer.workshopName,
        address: customer.address,
        vehicle,
      });
    }

    setVehBrand('');
    setVehModel('');
    setVehYear('');
    setVehPlate('');
    setIsAddVehicleOpen(false);
    setVehicleSaved(true);
    setTimeout(() => setVehicleSaved(false), 3000);
  };

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/customers"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Data Pelanggan</span>
        </Link>

        <div className="ios-glass-card rounded-[26px] p-10 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Pelanggan tidak ditemukan
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Data pelanggan tersebut belum terdaftar atau sudah diperbarui.
          </p>
        </div>
      </div>
    );
  }

  const cleanPhone = normalizePhone(customer.phone);

  return (
    <div className="space-y-5">
      {/* Back link + save feedback */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/customers"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 tap-bounce dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Data Pelanggan</span>
        </Link>

        {(profileSaved || vehicleSaved) && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {profileSaved
                ? 'Profil pelanggan berhasil diperbarui.'
                : 'Unit kendaraan baru berhasil ditambahkan.'}
            </span>
          </div>
        )}
      </div>

      {/* Ringkasan Profil Pelanggan & Daftar Kendaraan */}
      <section
        aria-label="Profil Pelanggan"
        className="ios-glass-card rounded-[26px] p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-base font-extrabold tracking-tight text-white shadow-xs dark:bg-white dark:text-slate-900">
              {getCustomerInitials(customer.name)}
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {customer.name}
                </h1>
                {customer.type === CustomerType.MITRA ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-200">
                    <Building2 className="h-3 w-3" aria-hidden="true" />
                    <span>{customer.workshopName || 'Bengkel Mitra'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-slate-200">
                    <UserCheck className="h-3 w-3" aria-hidden="true" />
                    <span>Perorangan</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                {cleanPhone && (
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    +{cleanPhone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{customer.address || 'Alamat belum dilengkapi'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-500/20 tap-bounce dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Chat WA</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 text-xs font-bold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 tap-bounce dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Kendaraan</span>
            </button>

            <button
              type="button"
              onClick={openEditProfile}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 tap-bounce dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Profil</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Cepat + Daftar Kendaraan Terdaftar */}
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-black/[0.06] pt-4 dark:border-white/[0.08] lg:grid-cols-12 lg:items-center">
          <div className="grid grid-cols-3 gap-3 lg:col-span-5">
            <div className="rounded-2xl bg-black/[0.03] px-3.5 py-2.5 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Servis
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {customerOrders.length}x
              </p>
            </div>
            <div className="rounded-2xl bg-black/[0.03] px-3.5 py-2.5 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Unit Terdaftar
              </p>
              <p className="mt-0.5 font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {customer.vehicles.length}
              </p>
            </div>
            <div className="rounded-2xl bg-black/[0.03] px-3.5 py-2.5 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Biaya
              </p>
              <p className="mt-0.5 truncate font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                {formatRupiah(totalSpent)}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Kendaraan / Unit Terdaftar
            </p>
            {customer.vehicles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customer.vehicles.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-slate-200"
                  >
                    <Car className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    <span>
                      {v.brand} {v.model}
                    </span>
                    {v.year && (
                      <span className="text-slate-500 dark:text-slate-400">({v.year})</span>
                    )}
                    {v.plateNumber && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:bg-white/10 dark:text-slate-200">
                        {v.plateNumber}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Belum ada kendaraan yang terdaftar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tabel Riwayat Servis Pelanggan */}
      <section aria-label="Tabel Riwayat Servis Pelanggan" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Riwayat Servis
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Klik salah satu baris riwayat untuk membuka detail lengkap servis dan dokumentasi perbaikan.
            </p>
          </div>
          <Link
            href="/admin/services?new=1"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 text-xs font-bold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 tap-bounce dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.08]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Unit Servis</span>
          </Link>
        </div>

        {customerOrders.length === 0 ? (
          <div className="ios-glass-card rounded-[26px] p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Belum ada riwayat servis
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Pelanggan ini belum memiliki catatan servis unit di sistem.
            </p>
          </div>
        ) : (
          <div className="ios-glass-card overflow-hidden rounded-[26px] shadow-sm">
            {/* Mobile List */}
            <div className="divide-y divide-black/[0.05] md:hidden dark:divide-white/[0.06]">
              {customerOrders.map((ord) => {
                const primary = ord.items[0];
                const meta = primary ? getStatusMeta(primary.status) : null;
                const total = calcTotalCharges(ord);
                const paid = calcTotalPaid(ord);

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="w-full space-y-2 p-4 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                            #{ord.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ord.vehicleBrand} {ord.vehicleModel}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {formatDate(ord.receivedAt)}
                          {ord.plateNumber ? ` · ${ord.plateNumber}` : ''}
                        </p>
                      </div>
                      {meta && (
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          {meta.shortLabel}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {primary?.moduleName || 'Servis Modul'}
                      {primary?.complaint ? `: ${primary.complaint}` : ''}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(total)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {total === 0
                          ? 'Belum ditagih'
                          : paid >= total
                          ? 'Lunas'
                          : paid > 0
                          ? `DP ${formatRupiah(paid)}`
                          : 'Belum Bayar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
                    <th className="px-5 py-3.5">Kode &amp; Masuk</th>
                    <th className="px-5 py-3.5">Unit / Kendaraan</th>
                    <th className="px-5 py-3.5">Modul &amp; Keluhan</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Biaya</th>
                    <th className="px-5 py-3.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {customerOrders.map((ord) => {
                    const primary = ord.items[0];
                    const meta = primary ? getStatusMeta(primary.status) : null;
                    const total = calcTotalCharges(ord);
                    const paid = calcTotalPaid(ord);
                    const paymentLabel =
                      total === 0
                        ? 'Belum ditagih'
                        : paid >= total
                        ? 'Lunas'
                        : paid > 0
                        ? `DP ${formatRupiah(paid)}`
                        : 'Belum Bayar';

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="group cursor-pointer transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                          <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                            #{ord.code}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                            {formatDate(ord.receivedAt)}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 align-middle">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {ord.vehicleBrand} {ord.vehicleModel}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {ord.plateNumber || (ord.vehicleYear ? `Tahun ${ord.vehicleYear}` : 'Unit Modul')}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {ord.items.map((item) => (
                              <span
                                key={item.id}
                                className="rounded-md bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-white/[0.08] dark:text-slate-200"
                              >
                                {item.moduleName}
                              </span>
                            ))}
                          </div>
                          {primary?.complaint && (
                            <p className="mt-1 max-w-sm truncate text-[11px] text-slate-600 dark:text-slate-400">
                              {primary.complaint}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                          {meta && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                              <span>{meta.shortLabel}</span>
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                          <p className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(total)}
                          </p>
                          <p
                            className={`mt-0.5 text-[11px] font-semibold ${
                              total > 0 && paid >= total
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {paymentLabel}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            aria-label={`Lihat detail servis #${ord.code}`}
                            title={`Lihat detail lengkap servis #${ord.code}`}
                            className="ios-glass-inner inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-slate-700 transition-colors hover:bg-black/5 tap-bounce dark:text-slate-200 dark:hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal Edit Profil Pelanggan */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-customer-modal-title"
          onClick={() => setIsEditOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[28px] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <h2
                id="edit-customer-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Edit Profil Pelanggan
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                aria-label="Tutup form edit profil"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-cust-name"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Nama Pelanggan
                  </label>
                  <input
                    id="edit-cust-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-cust-phone"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    No. WhatsApp / HP
                  </label>
                  <input
                    id="edit-cust-phone"
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 font-mono text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-cust-type"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Tipe Pelanggan
                  </label>
                  <select
                    id="edit-cust-type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CustomerType)}
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
                  >
                    <option value={CustomerType.PERORANGAN}>Perorangan</option>
                    <option value={CustomerType.MITRA}>Bengkel Mitra</option>
                  </select>
                </div>

                {editType === CustomerType.MITRA && (
                  <div>
                    <label
                      htmlFor="edit-cust-workshop"
                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      Bengkel Mitra
                    </label>
                    <select
                      id="edit-cust-workshop"
                      value={editWorkshop}
                      onChange={(e) => setEditWorkshop(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#2C2C2E] dark:text-white"
                    >
                      {PARTNER_WORKSHOPS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={editType === CustomerType.MITRA ? 'sm:col-span-2' : ''}>
                  <label
                    htmlFor="edit-cust-address"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Alamat
                  </label>
                  <input
                    id="edit-cust-address"
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Alamat singkat pelanggan atau mitra"
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 dark:bg-white/10 dark:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-slate-900"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kendaraan */}
      {isAddVehicleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4 animate-[appleBackdropFadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vehicle-modal-title"
          onClick={() => setIsAddVehicleOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] border border-black/[0.06] bg-white p-6 shadow-2xl sm:rounded-[28px] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <h2
                id="add-vehicle-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Tambah Kendaraan / Unit
              </h2>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                aria-label="Tutup form tambah kendaraan"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] text-slate-600 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="veh-brand"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Merek *
                  </label>
                  <input
                    id="veh-brand"
                    type="text"
                    required
                    value={vehBrand}
                    onChange={(e) => setVehBrand(e.target.value)}
                    placeholder="Toyota"
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="veh-model"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Model *
                  </label>
                  <input
                    id="veh-model"
                    type="text"
                    required
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    placeholder="Avanza Veloz"
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="veh-year"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Tahun
                  </label>
                  <input
                    id="veh-year"
                    type="number"
                    value={vehYear}
                    onChange={(e) => setVehYear(e.target.value)}
                    placeholder="2020"
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 font-mono text-xs text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="veh-plate"
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Plat Nomor
                  </label>
                  <input
                    id="veh-plate"
                    type="text"
                    value={vehPlate}
                    onChange={(e) => setVehPlate(e.target.value)}
                    placeholder="Z 1234 AB"
                    className="mt-1 h-11 w-full rounded-xl border border-black/[0.08] bg-[#F2F2F7] px-3 font-mono text-xs uppercase text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 dark:bg-white/10 dark:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slate-900 px-5 text-xs font-bold text-white tap-bounce dark:bg-white dark:text-slate-900"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Simpan Unit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ServicePreviewModal
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  );
}
