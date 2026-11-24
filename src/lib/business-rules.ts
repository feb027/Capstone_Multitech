import { ItemStatus } from '@prisma/client';

/**
 * Validasi transisi status modul sesuai BR-03 pada 02-SRS.md.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  [ItemStatus.DITERIMA]: [ItemStatus.DITERIMA, ItemStatus.DIAGNOSA, ItemStatus.BATAL],
  [ItemStatus.DIAGNOSA]: [
    ItemStatus.DIAGNOSA,
    ItemStatus.MENUNGGU_PERSETUJUAN,
    ItemStatus.MENUNGGU_SPAREPART,
    ItemStatus.PERBAIKAN,
    ItemStatus.BATAL,
  ],
  [ItemStatus.MENUNGGU_PERSETUJUAN]: [
    ItemStatus.MENUNGGU_PERSETUJUAN,
    ItemStatus.DIAGNOSA,
    ItemStatus.MENUNGGU_SPAREPART,
    ItemStatus.PERBAIKAN,
    ItemStatus.BATAL,
  ],
  [ItemStatus.MENUNGGU_SPAREPART]: [
    ItemStatus.MENUNGGU_SPAREPART,
    ItemStatus.MENUNGGU_PERSETUJUAN,
    ItemStatus.PERBAIKAN,
    ItemStatus.BATAL,
  ],
  [ItemStatus.PERBAIKAN]: [
    ItemStatus.PERBAIKAN,
    ItemStatus.MENUNGGU_PERSETUJUAN,
    ItemStatus.MENUNGGU_SPAREPART,
    ItemStatus.UJI_QC,
    ItemStatus.BATAL,
  ],
  [ItemStatus.UJI_QC]: [
    ItemStatus.UJI_QC,
    ItemStatus.PERBAIKAN,
    ItemStatus.SIAP_DIAMBIL,
    ItemStatus.BATAL,
  ],
  [ItemStatus.SIAP_DIAMBIL]: [
    ItemStatus.SIAP_DIAMBIL,
    ItemStatus.UJI_QC,
    ItemStatus.SELESAI,
    ItemStatus.BATAL,
  ],
  [ItemStatus.SELESAI]: [ItemStatus.SELESAI],
  [ItemStatus.BATAL]: [ItemStatus.BATAL],
};

export function isValidStatusTransition(fromStatus: ItemStatus, toStatus: ItemStatus): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function getAllowedNextStatuses(currentStatus: ItemStatus): ItemStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [currentStatus];
}

export function isItemStatusFinal(status: ItemStatus): boolean {
  return status === ItemStatus.SELESAI || status === ItemStatus.BATAL;
}

export function areAllItemsFinal(items: Array<{ status: ItemStatus }>): boolean {
  return items.length > 0 && items.every((item) => isItemStatusFinal(item.status));
}

export type PaymentSummaryStatus = 'BELUM_DITAGIH' | 'BELUM_BAYAR' | 'DP' | 'LUNAS';

export function calculateBillingSummary(
  charges: Array<{ qty: number; unitPrice: number }>,
  payments: Array<{ amount: number }>
): {
  totalCharges: number;
  totalPaid: number;
  remaining: number;
  status: PaymentSummaryStatus;
  statusLabel: string;
} {
  const totalCharges = charges.reduce(
    (sum, c) => sum + Math.max(0, c.unitPrice) * Math.max(1, c.qty || 1),
    0
  );
  const totalPaid = payments.reduce((sum, p) => sum + Math.max(0, p.amount || 0), 0);
  const remaining = Math.max(0, totalCharges - totalPaid);

  if (totalCharges === 0) {
    return {
      totalCharges: 0,
      totalPaid,
      remaining: 0,
      status: 'BELUM_DITAGIH',
      statusLabel: 'Belum ditagih',
    };
  }
  if (totalPaid === 0) {
    return {
      totalCharges,
      totalPaid: 0,
      remaining: totalCharges,
      status: 'BELUM_BAYAR',
      statusLabel: 'Belum bayar',
    };
  }
  if (remaining > 0) {
    return {
      totalCharges,
      totalPaid,
      remaining,
      status: 'DP',
      statusLabel: 'DP',
    };
  }
  return {
    totalCharges,
    totalPaid,
    remaining: 0,
    status: 'LUNAS',
    statusLabel: 'Lunas',
  };
}

export function computeWarrantyUntil(
  baseDateInput: string | Date,
  warrantyMonths: number | null | undefined
): string | null {
  if (!warrantyMonths || warrantyMonths <= 0) return null;
  const date = typeof baseDateInput === 'string' ? new Date(baseDateInput) : new Date(baseDateInput.getTime());
  if (Number.isNaN(date.getTime())) return null;
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + warrantyMonths);
  return result.toISOString();
}

export function isWarrantyEligible(
  item: {
    status: ItemStatus | string;
    warrantyMonths?: number | null;
    warrantyUntil?: string | Date | null;
  },
  referenceDate: Date = new Date()
): boolean {
  const isFinishedStage =
    item.status === ItemStatus.SELESAI || item.status === ItemStatus.SIAP_DIAMBIL;
  if (!isFinishedStage) return false;

  if (item.warrantyUntil) {
    const expiry =
      typeof item.warrantyUntil === 'string' ? new Date(item.warrantyUntil) : item.warrantyUntil;
    if (Number.isNaN(expiry.getTime())) return false;
    return expiry.getTime() >= referenceDate.getTime();
  }

  return Boolean(item.warrantyMonths && item.warrantyMonths > 0);
}

export function validateOrderRules(order: {
  items: Array<{
    moduleName: string;
    status: ItemStatus;
    cancelReason?: string | null;
    overrideReason?: string | null;
  }>;
  charges: Array<{ qty: number; unitPrice: number }>;
  payments: Array<{ amount: number }>;
}): string | null {
  const billing = calculateBillingSummary(order.charges, order.payments);

  for (const item of order.items) {
    if (item.status === ItemStatus.BATAL && !(item.cancelReason || '').trim()) {
      return `Alasan pembatalan wajib diisi untuk modul "${item.moduleName}".`;
    }
    if (
      item.status === ItemStatus.SELESAI &&
      billing.totalCharges > 0 &&
      billing.remaining > 0 &&
      !(item.overrideReason || '').trim()
    ) {
      return `Modul "${item.moduleName}" belum dapat ditutup SELESAI sebelum lunas (atau isi alasan override seperti mitra tempo).`;
    }
  }

  return null;
}

export function generateUniqueOrderCode(existingCodes: Iterable<string>): {
  code: string;
  isLowCapacity: boolean;
} {
  const used = new Set<string>();
  for (const c of existingCodes) {
    const clean = (c || '').trim();
    if (clean) used.add(clean);
  }

  const remainingCapacity = Math.max(0, 10000 - used.size);
  const isLowCapacity = remainingCapacity < 1000;

  if (used.size >= 10000) {
    throw new Error('Kapasitas kode servis 4 digit (10.000) sudah penuh.');
  }

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const candidate = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    if (!used.has(candidate)) {
      return { code: candidate, isLowCapacity };
    }
  }

  for (let num = 0; num < 10000; num += 1) {
    const candidate = num.toString().padStart(4, '0');
    if (!used.has(candidate)) {
      return { code: candidate, isLowCapacity };
    }
  }

  throw new Error('Tidak dapat membuat kode servis unik.');
}

/**
 * Escapes CSV cell values safely against formula injection (=, +, -, @, \t, \r).
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
