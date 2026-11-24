import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';
import { z } from 'zod';
import { normalizePhone, normalizeWorkshopName } from './dataset-types';

export class DatasetRuleError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'DatasetRuleError';
    this.statusCode = statusCode;
  }
}

export const vehicleInputSchema = z.object({
  brand: z.string().trim().max(80).default(''),
  model: z.string().trim().max(80).default(''),
  year: z.number().int().min(1960).max(2100).nullable().optional(),
  plateNumber: z.string().trim().max(24).nullable().optional(),
  vin: z.string().trim().max(30).nullable().optional(),
});

export const upsertCustomerSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    previousPhone: z.string().trim().optional(),
    name: z.string().trim().min(1, 'Nama pelanggan wajib diisi.').max(120),
    phone: z.string().trim().min(1, 'Nomor WhatsApp wajib diisi.').max(25),
    type: z.nativeEnum(CustomerType).default(CustomerType.PERORANGAN),
    workshopName: z.string().trim().max(120).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    vehicle: vehicleInputSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const cleanPhone = normalizePhone(data.phone);
    if (cleanPhone.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nomor WhatsApp minimal 9 digit angka.',
        path: ['phone'],
      });
    }
    if (data.type === CustomerType.MITRA) {
      const workshop = normalizeWorkshopName(data.workshopName, CustomerType.MITRA);
      if (!workshop) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nama bengkel mitra wajib diisi.',
          path: ['workshopName'],
        });
      }
    }
  });

export const addVehicleSchema = z.object({
  customerId: z.string().trim().min(1),
  vehicle: vehicleInputSchema.refine(
    (v) => Boolean(v.brand || v.model || v.plateNumber),
    'Isi minimal merek, model, atau nomor polisi kendaraan.'
  ),
});

export const updateVehicleSchema = z.object({
  customerId: z.string().trim().min(1),
  vehicleId: z.string().trim().min(1),
  brand: z.string().trim().max(80).default(''),
  model: z.string().trim().max(80).default(''),
  year: z.number().int().min(1960).max(2100).nullable().optional(),
  plateNumber: z.string().trim().max(24).nullable().optional(),
  vin: z.string().trim().max(30).nullable().optional(),
});

export const deleteVehicleSchema = z.object({
  customerId: z.string().trim().min(1),
  vehicleId: z.string().trim().min(1),
});

export const progressLogSchema = z.object({
  id: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  stage: z.nativeEnum(ItemStatus).nullable().optional(),
  note: z.string().max(1500).default(''),
  isPublic: z.boolean().default(true),
  photoUrl: z.string().max(1_500_000).nullable().optional(),
});

export const serviceItemSchema = z.object({
  id: z.string().trim().min(1),
  moduleTypeId: z.string().trim().default(''),
  moduleName: z.string().trim().min(1, 'Nama modul wajib diisi.').max(120),
  moduleDetail: z.string().trim().max(150).default(''),
  complaint: z.string().trim().min(1, 'Keluhan modul wajib diisi.').max(1000),
  status: z.nativeEnum(ItemStatus),
  warrantyMonths: z.number().int().min(0).max(60).default(0),
  warrantyUntil: z.string().nullable().optional(),
  cancelReason: z.string().trim().max(500).nullable().optional(),
  overrideReason: z.string().trim().max(500).nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  beforePhotoUrl: z.string().max(1_500_000).nullable().optional(),
  afterPhotoUrl: z.string().max(1_500_000).nullable().optional(),
  beforeCaption: z.string().max(400).nullable().optional(),
  afterCaption: z.string().max(400).nullable().optional(),
  logs: z.array(progressLogSchema).default([]),
});

export const chargeLineSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(['JASA', 'SPAREPART', 'DIAGNOSA']),
  description: z.string().trim().min(1, 'Deskripsi biaya wajib diisi.').max(200),
  qty: z.number().int().min(1).max(999).default(1),
  unitPrice: z.number().nonnegative().max(1_000_000_000),
});

export const paymentSchema = z.object({
  id: z.string().trim().min(1),
  amount: z.number().positive('Nominal pembayaran harus lebih dari 0.').max(1_000_000_000),
  method: z.nativeEnum(PaymentMethod),
  paidAt: z.string().trim().min(1),
  note: z.string().max(300).nullable().optional(),
});

export const upsertOrderSchema = z
  .object({
    id: z.string().trim().min(1),
    publicId: z.string().trim().min(4).max(32),
    code: z.string().trim().regex(/^\d{4}$/, 'Kode servis harus 4 digit angka.'),
    customerName: z.string().trim().min(1, 'Nama pelanggan wajib diisi.').max(120),
    customerPhone: z.string().trim().min(1, 'Nomor WhatsApp wajib diisi.').max(25),
    customerType: z.nativeEnum(CustomerType),
    workshopName: z.string().trim().max(120).nullable().optional(),
    vehicleBrand: z.string().trim().max(80).default(''),
    vehicleModel: z.string().trim().max(80).default(''),
    vehicleYear: z.number().int().min(1960).max(2100).nullable().optional(),
    plateNumber: z.string().trim().max(24).nullable().optional(),
    unitCategory: z.enum(['OTOMOTIF', 'GENSET_INDUSTRI']).default('OTOMOTIF'),
    intakeType: z.nativeEnum(IntakeType),
    entryMethod: z.nativeEnum(EntryMethod).default(EntryMethod.DATANG),
    trackingNumber: z.string().trim().max(80).nullable().optional(),
    conditionNotes: z.string().trim().max(1500).nullable().optional(),
    priorityNote: z.string().trim().max(300).nullable().optional(),
    customPhotoUrl: z.string().max(1_500_000).nullable().optional(),
    receivedAt: z.string().trim().min(1),
    estimatedDoneAt: z.string().nullable().optional(),
    handedOverAt: z.string().nullable().optional(),
    isWarrantyClaim: z.boolean().optional(),
    warrantySourceItemId: z.string().nullable().optional(),
    warrantySourceCode: z.string().nullable().optional(),
    items: z.array(serviceItemSchema).min(1, 'Minimal harus terdapat 1 modul servis.'),
    charges: z.array(chargeLineSchema).default([]),
    payments: z.array(paymentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (normalizePhone(data.customerPhone).length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nomor WhatsApp pelanggan minimal 9 digit angka.',
        path: ['customerPhone'],
      });
    }
    if (data.customerType === CustomerType.MITRA) {
      const workshop = normalizeWorkshopName(data.workshopName, CustomerType.MITRA);
      if (!workshop) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nama bengkel mitra wajib diisi.',
          path: ['workshopName'],
        });
      }
    }
  });

export const createWarrantyClaimSchema = z.object({
  sourceOrderId: z.string().trim().min(1),
  sourceItemId: z.string().trim().min(1),
  complaint: z.string().trim().min(3, 'Keluhan klaim garansi minimal 3 karakter.').max(1000).optional(),
});
