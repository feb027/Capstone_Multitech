import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import {
  areAllItemsFinal,
  calculateBillingSummary,
  computeWarrantyUntil,
  escapeCsvCell,
  generateUniqueOrderCode,
  isValidStatusTransition,
  isWarrantyEligible,
  validateOrderRules,
} from '../src/lib/business-rules';
import { normalizePhone, normalizeWorkshopName } from '../src/lib/dataset-types';
import {
  createWarrantyClaimSchema,
  upsertCustomerSchema,
  upsertOrderSchema,
} from '../src/lib/validation';

test('TC-01: generateUniqueOrderCode menghasilkan kode 4-digit unik', () => {
  const existing = ['0001', '4821', '9999'];
  const result = generateUniqueOrderCode(existing);
  assert.match(result.code, /^\d{4}$/);
  assert.equal(existing.includes(result.code), false);
  assert.equal(result.isLowCapacity, false);
});

test('TC-07 / BR-03: transisi status modul harus mengikuti urutan kerja', () => {
  assert.equal(isValidStatusTransition(ItemStatus.DITERIMA, ItemStatus.DIAGNOSA), true);
  assert.equal(isValidStatusTransition(ItemStatus.DITERIMA, ItemStatus.BATAL), true);
  assert.equal(isValidStatusTransition(ItemStatus.DITERIMA, ItemStatus.SELESAI), false);
  assert.equal(isValidStatusTransition(ItemStatus.DITERIMA, ItemStatus.PERBAIKAN), false);

  assert.equal(isValidStatusTransition(ItemStatus.DIAGNOSA, ItemStatus.PERBAIKAN), true);
  assert.equal(isValidStatusTransition(ItemStatus.PERBAIKAN, ItemStatus.UJI_QC), true);
  assert.equal(isValidStatusTransition(ItemStatus.UJI_QC, ItemStatus.SIAP_DIAMBIL), true);
  assert.equal(isValidStatusTransition(ItemStatus.SIAP_DIAMBIL, ItemStatus.SELESAI), true);

  assert.equal(isValidStatusTransition(ItemStatus.SELESAI, ItemStatus.DIAGNOSA), false);
  assert.equal(isValidStatusTransition(ItemStatus.BATAL, ItemStatus.PERBAIKAN), false);
});

test('TC-10 / TC-11 / BR-05: kalkulasi tagihan DP, nilai batas kurang Rp 1, dan Lunas', () => {
  const charges = [{ qty: 1, unitPrice: 1_000_000 }];

  const unpaid = calculateBillingSummary(charges, []);
  assert.equal(unpaid.status, 'BELUM_BAYAR');
  assert.equal(unpaid.remaining, 1_000_000);

  const dp = calculateBillingSummary(charges, [{ amount: 300_000 }]);
  assert.equal(dp.status, 'DP');
  assert.equal(dp.remaining, 700_000);

  const oneRupiahShort = calculateBillingSummary(charges, [{ amount: 999_999 }]);
  assert.equal(oneRupiahShort.status, 'DP');
  assert.equal(oneRupiahShort.remaining, 1);

  const paidOff = calculateBillingSummary(charges, [{ amount: 300_000 }, { amount: 700_000 }]);
  assert.equal(paidOff.status, 'LUNAS');
  assert.equal(paidOff.remaining, 0);
});

test('TC-12 / BR-06 & FR-S10: validasi penutupan SELESAI belum lunas dan alasan BATAL', () => {
  const missingCancelReason = validateOrderRules({
    items: [{ moduleName: 'ECU', status: ItemStatus.BATAL, cancelReason: '  ' }],
    charges: [],
    payments: [],
  });
  assert.ok(missingCancelReason);

  const withCancelReason = validateOrderRules({
    items: [
      {
        moduleName: 'ECU',
        status: ItemStatus.BATAL,
        cancelReason: 'Korosi parah pada jalur mikrokontroler',
      },
    ],
    charges: [],
    payments: [],
  });
  assert.equal(withCancelReason, null);

  const blockedClose = validateOrderRules({
    items: [{ moduleName: 'ECU', status: ItemStatus.SELESAI, overrideReason: null }],
    charges: [{ qty: 1, unitPrice: 750_000 }],
    payments: [{ amount: 300_000 }],
  });
  assert.ok(blockedClose);

  const allowedWithOverride = validateOrderRules({
    items: [
      {
        moduleName: 'ECU',
        status: ItemStatus.SELESAI,
        overrideReason: 'Mitra sistem tempo 14 hari',
      },
    ],
    charges: [{ qty: 1, unitPrice: 750_000 }],
    payments: [{ amount: 300_000 }],
  });
  assert.equal(allowedWithOverride, null);
});

test('BR-07: penguncian perubahan tagihan saat seluruh modul final', () => {
  assert.equal(areAllItemsFinal([]), false);
  assert.equal(
    areAllItemsFinal([{ status: ItemStatus.SELESAI }, { status: ItemStatus.PERBAIKAN }]),
    false
  );
  assert.equal(
    areAllItemsFinal([{ status: ItemStatus.SELESAI }, { status: ItemStatus.BATAL }]),
    true
  );
});

test('TC-13 / BR-08 / FR-S09: perhitungan masa berlaku dan kelayakan klaim garansi', () => {
  const until = computeWarrantyUntil('2026-10-01T10:00:00.000Z', 3);
  assert.ok(until);
  assert.equal(until.startsWith('2027-01-01'), true);

  assert.equal(
    isWarrantyEligible(
      { status: ItemStatus.SELESAI, warrantyMonths: 3, warrantyUntil: until },
      new Date('2026-11-24T10:00:00.000Z')
    ),
    true
  );

  assert.equal(
    isWarrantyEligible(
      { status: ItemStatus.SELESAI, warrantyMonths: 3, warrantyUntil: '2026-11-01T00:00:00.000Z' },
      new Date('2026-11-24T10:00:00.000Z')
    ),
    false
  );

  assert.equal(
    isWarrantyEligible({ status: ItemStatus.DIAGNOSA, warrantyMonths: 3, warrantyUntil: until }),
    false
  );
  assert.equal(
    isWarrantyEligible({ status: ItemStatus.SELESAI, warrantyMonths: 0, warrantyUntil: null }),
    false
  );
});

test('BR-01 & Zod validation: normalisasi HP, nama mitra, VIN opsional, dan resi ekspedisi', () => {
  assert.equal(normalizePhone('0852-2319-4807'), '6285223194807');
  assert.equal(normalizeWorkshopName('Wahana Retro', CustomerType.PERORANGAN), null);
  assert.equal(normalizeWorkshopName('wahana retro', CustomerType.MITRA), 'Wahana Retro');

  const validCustomer = upsertCustomerSchema.safeParse({
    name: 'Kang Ujang',
    phone: '081320987654',
    type: CustomerType.MITRA,
    workshopName: 'Wahana Retro',
    vehicle: {
      brand: 'Honda',
      model: 'CR-V',
      year: 2016,
      plateNumber: 'Z 1184 KT',
      vin: 'MHRRM3850GJ001234',
    },
  });
  assert.equal(validCustomer.success, true);

  const invalidMitra = upsertCustomerSchema.safeParse({
    name: 'Kang Ujang',
    phone: '081320987654',
    type: CustomerType.MITRA,
    workshopName: '',
  });
  assert.equal(invalidMitra.success, false);

  const validOrder = upsertOrderSchema.safeParse({
    id: 'ord-1',
    publicId: 'pub12345',
    code: '4821',
    customerName: 'Asep Suryana',
    customerPhone: '085223194807',
    customerType: CustomerType.PERORANGAN,
    intakeType: IntakeType.MODUL_SAJA,
    entryMethod: EntryMethod.EKSPEDISI,
    trackingNumber: 'JNE12345678',
    receivedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        moduleName: 'ECU Engine Control Unit',
        complaint: 'Pin coil #2 tidak keluar trigger.',
        status: ItemStatus.DITERIMA,
        warrantyMonths: 3,
      },
    ],
    charges: [{ id: 'chg-1', kind: 'JASA', description: 'Diagnosa', qty: 1, unitPrice: 150_000 }],
    payments: [{ id: 'pay-1', amount: 150_000, method: PaymentMethod.TUNAI, paidAt: new Date().toISOString() }],
  });
  assert.equal(validOrder.success, true);

  const claimCheck = createWarrantyClaimSchema.safeParse({
    sourceOrderId: 'ord-3',
    sourceItemId: 'item-3',
  });
  assert.equal(claimCheck.success, true);
});

test('FR-D07: escapeCsvCell mencegah CSV formula injection dan quote rusak', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A5)'), "'=SUM(A1:A5)");
  assert.equal(escapeCsvCell('+6281234'), "'+6281234");
  assert.equal(escapeCsvCell('@cmd'), "'@cmd");
  assert.equal(escapeCsvCell('Avanza "Veloz", AT'), '"Avanza ""Veloz"", AT"');
});
