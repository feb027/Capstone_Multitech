import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import {
  ChargeKind,
  ItemStatus,
  LogKind,
  MediaKind,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SERVICE_ORDERS,
  MockCustomerRow,
  MockServiceOrder,
  UpdateVehiclePayload,
  UpsertCustomerPayload,
  DeleteVehiclePayload,
  applyAddVehicle,
  applyDeleteCustomer,
  applyDeleteOrder,
  applyDeleteVehicle,
  applyUpdateVehicle,
  applyUpsertCustomer,
  applyUpsertOrder,
  createUniqueId,
  getDefaultBeforeAfter,
  normalizePhone,
  normalizeWorkshopName,
  synchronizeDataset,
} from '@/lib/frontend-mock';
import {
  areAllItemsFinal,
  computeWarrantyUntil,
  generateUniqueOrderCode,
  isWarrantyEligible,
  isValidStatusTransition,
  validateOrderRules,
} from '@/lib/business-rules';
import {
  DatasetRuleError,
  addVehicleSchema,
  createWarrantyClaimSchema,
  deleteVehicleSchema,
  updateVehicleSchema,
  upsertCustomerSchema,
  upsertOrderSchema,
} from '@/lib/validation';
import { generatePublicId } from '@/lib/utils';

export interface ServerDataset {
  orders: MockServiceOrder[];
  customers: MockCustomerRow[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'multitech-dataset.json');

function getFallbackDataset(): ServerDataset {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const synced = synchronizeDataset(
        Array.isArray(parsed.orders) ? (parsed.orders as MockServiceOrder[]) : INITIAL_SERVICE_ORDERS,
        Array.isArray(parsed.customers) ? (parsed.customers as MockCustomerRow[]) : INITIAL_CUSTOMERS
      );
      return { orders: synced.orders, customers: synced.customers };
    }
  } catch {
    // Ignore file fallback read failure and return seed defaults
  }
  const synced = synchronizeDataset(INITIAL_SERVICE_ORDERS, INITIAL_CUSTOMERS);
  return { orders: synced.orders, customers: synced.customers };
}

function writeFallbackDataset(dataset: ServerDataset): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataset, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed writing fallback dataset file:', err);
  }
}

function guessMimeFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/png') || lower.endsWith('.png')) return 'image/png';
  if (lower.startsWith('data:image/jpeg') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'image/webp';
}

function chargesSnapshot(
  charges: Array<{ kind: string; description: string; qty: number; unitPrice: number }>
): string {
  return JSON.stringify(
    charges.map((c) => ({
      kind: c.kind,
      description: c.description.trim(),
      qty: c.qty,
      unitPrice: c.unitPrice,
    }))
  );
}

const fullOrderInclude = Prisma.validator<Prisma.ServiceOrderInclude>()({
  customer: true,
  vehicle: true,
  warrantySourceItem: {
    include: {
      order: {
        select: { code: true },
      },
    },
  },
  items: {
    include: {
      moduleType: true,
      progressLogs: {
        include: { media: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { id: 'asc' },
  },
  charges: {
    orderBy: { createdAt: 'asc' },
  },
  payments: {
    orderBy: { paidAt: 'desc' },
  },
});

type FullOrderRow = Prisma.ServiceOrderGetPayload<{ include: typeof fullOrderInclude }>;

function mapOrderRowToDto(row: FullOrderRow): MockServiceOrder {
  const unitCategory = row.unitCategory === 'GENSET_INDUSTRI' ? 'GENSET_INDUSTRI' : 'OTOMOTIF';

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code.trim(),
    customerName: row.customer.name,
    customerPhone: row.customer.phone,
    customerType: row.customer.type,
    workshopName: row.customer.workshopName,
    vehicleBrand: row.vehicle?.brand || '',
    vehicleModel: row.vehicle?.model || '',
    vehicleYear: row.vehicle?.year ?? null,
    plateNumber: row.vehicle?.plateNumber ?? null,
    unitCategory,
    intakeType: row.intakeType,
    entryMethod: row.entryMethod,
    trackingNumber: row.trackingNumber,
    conditionNotes: row.conditionNotes,
    priorityNote: row.priorityNote,
    customPhotoUrl: row.customPhotoUrl,
    receivedAt: row.receivedAt.toISOString(),
    estimatedDoneAt: row.estimatedDoneAt ? row.estimatedDoneAt.toISOString() : null,
    handedOverAt: row.handedOverAt ? row.handedOverAt.toISOString() : null,
    isWarrantyClaim: row.isWarrantyClaim,
    warrantySourceItemId: row.warrantySourceItemId,
    warrantySourceCode: row.warrantySourceItem?.order?.code?.trim() ?? null,
    items: row.items.map((it) => {
      const defaults = getDefaultBeforeAfter(it.moduleType.name, unitCategory);
      return {
        id: it.id,
        moduleTypeId: it.moduleTypeId,
        moduleName: it.moduleType.name,
        moduleDetail: it.moduleDetail || '',
        complaint: it.complaint,
        status: it.status,
        warrantyMonths: it.warrantyMonths ?? 0,
        warrantyUntil: it.warrantyUntil ? it.warrantyUntil.toISOString() : null,
        cancelReason: it.cancelReason,
        overrideReason: it.overrideReason,
        finishedAt: it.finishedAt ? it.finishedAt.toISOString() : null,
        beforePhotoUrl: it.beforePhotoUrl || defaults.beforePhotoUrl,
        afterPhotoUrl: it.afterPhotoUrl || defaults.afterPhotoUrl,
        beforeCaption: it.beforeCaption || defaults.beforeCaption,
        afterCaption: it.afterCaption || defaults.afterCaption,
        logs: it.progressLogs.map((pl) => ({
          id: pl.id,
          createdAt: pl.createdAt.toISOString(),
          stage: pl.toStatus ?? null,
          note: pl.note || '',
          isPublic: pl.isPublic,
          photoUrl: pl.media[0]?.filePath ?? null,
        })),
      };
    }),
    charges: row.charges.map((chg) => ({
      id: chg.id,
      kind: chg.kind,
      description: chg.description,
      qty: chg.qty,
      unitPrice: chg.unitPrice,
    })),
    payments: row.payments.map((pay) => ({
      id: pay.id,
      amount: pay.amount,
      method: pay.method,
      paidAt: pay.paidAt.toISOString(),
      note: pay.note ?? undefined,
    })),
  };
}

async function readDatasetFromPostgres(): Promise<ServerDataset> {
  const [customerRows, orderRows] = await Promise.all([
    prisma.customer.findMany({
      include: {
        vehicles: true,
        _count: { select: { serviceOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceOrder.findMany({
      include: fullOrderInclude,
      orderBy: { receivedAt: 'desc' },
    }),
  ]);

  const customers: MockCustomerRow[] = customerRows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    type: c.type,
    workshopName: c.workshopName,
    address: c.address,
    vehicles: c.vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      year: v.year,
      plateNumber: v.plateNumber,
      vin: v.vin,
    })),
    _count: { serviceOrders: c._count.serviceOrders },
  }));

  const orders = orderRows.map(mapOrderRowToDto);
  return { orders, customers };
}

export async function getServerDataset(): Promise<ServerDataset> {
  if (!process.env.DATABASE_URL) {
    return getFallbackDataset();
  }
  try {
    return await readDatasetFromPostgres();
  } catch (err) {
    console.warn('PostgreSQL read failed, falling back to local dataset snapshot:', err);
    return getFallbackDataset();
  }
}

export const getCachedServerDataset = cache((): Promise<ServerDataset> => getServerDataset());

export async function upsertServerOrder(
  rawOrder: MockServiceOrder,
  adminEmail?: string | null
): Promise<ServerDataset> {
  const parsed = upsertOrderSchema.safeParse(rawOrder);
  if (!parsed.success) {
    throw new DatasetRuleError(parsed.error.issues[0]?.message || 'Data servis tidak valid.');
  }

  const order = parsed.data;
  const ruleError = validateOrderRules(order);
  if (ruleError) {
    throw new DatasetRuleError(ruleError);
  }

  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyUpsertOrder(current.orders, current.customers, rawOrder);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  const cleanPhone = normalizePhone(order.customerPhone);
  const resolvedWorkshop = normalizeWorkshopName(order.workshopName, order.customerType);
  const cleanPlate = order.plateNumber ? order.plateNumber.trim().toUpperCase() : null;

  await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.serviceOrder.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        charges: true,
      },
    });

    if (existingOrder) {
      if (
        areAllItemsFinal(existingOrder.items) &&
        chargesSnapshot(existingOrder.charges) !== chargesSnapshot(order.charges)
      ) {
        throw new DatasetRuleError(
          'Servis yang seluruh modulnya sudah selesai atau batal tidak dapat mengubah rincian biaya (BR-07).'
        );
      }

      const prevItemsMap = new Map(existingOrder.items.map((it) => [it.id, it]));
      for (const incomingItem of order.items) {
        const prevItem = prevItemsMap.get(incomingItem.id);
        if (prevItem && !isValidStatusTransition(prevItem.status, incomingItem.status)) {
          throw new DatasetRuleError(
            `Perpindahan status "${prevItem.status}" langsung ke "${incomingItem.status}" tidak diizinkan (BR-03).`
          );
        }
      }
    }

    const customer = await tx.customer.upsert({
      where: { phone: cleanPhone },
      update: {
        name: order.customerName.trim(),
        type: order.customerType,
        workshopName: resolvedWorkshop,
      },
      create: {
        name: order.customerName.trim(),
        phone: cleanPhone,
        type: order.customerType,
        workshopName: resolvedWorkshop,
      },
      include: { vehicles: true },
    });

    let vehicleId: string | null = null;
    if (order.vehicleBrand.trim() || order.vehicleModel.trim() || cleanPlate) {
      const matchedVehicle = customer.vehicles.find(
        (v) =>
          (cleanPlate && v.plateNumber?.replace(/\s+/g, '').toUpperCase() === cleanPlate.replace(/\s+/g, '')) ||
          (v.brand.toLowerCase() === order.vehicleBrand.trim().toLowerCase() &&
            v.model.toLowerCase() === order.vehicleModel.trim().toLowerCase())
      );
      if (matchedVehicle) {
        vehicleId = matchedVehicle.id;
      } else {
        const createdVehicle = await tx.vehicle.create({
          data: {
            customerId: customer.id,
            brand: order.vehicleBrand.trim() || 'Unit',
            model: order.vehicleModel.trim() || cleanPlate || 'Kendaraan',
            year: order.vehicleYear ?? null,
            plateNumber: cleanPlate,
          },
        });
        vehicleId = createdVehicle.id;
      }
    }

    let finalCode = order.code.trim();
    let finalPublicId = order.publicId.trim();

    if (!existingOrder) {
      const existingCodes = await tx.serviceOrder.findMany({ select: { code: true } });
      const codeSet = new Set(existingCodes.map((r) => r.code.trim()));
      if (!/^\d{4}$/.test(finalCode) || codeSet.has(finalCode)) {
        finalCode = generateUniqueOrderCode(codeSet).code;
      }

      const publicCollision = await tx.serviceOrder.findUnique({
        where: { publicId: finalPublicId },
        select: { id: true },
      });
      if (publicCollision) {
        finalPublicId = generatePublicId();
      }
    }

    const now = new Date();
    const allFinished = order.items.every((it) => it.status === ItemStatus.SELESAI);
    const resolvedHandedOver = allFinished
      ? existingOrder?.handedOverAt ?? (order.handedOverAt ? new Date(order.handedOverAt) : now)
      : existingOrder?.handedOverAt ?? null;

    const savedOrder = existingOrder
      ? await tx.serviceOrder.update({
          where: { id: existingOrder.id },
          data: {
            customerId: customer.id,
            vehicleId,
            intakeType: order.intakeType,
            entryMethod: order.entryMethod,
            unitCategory: order.unitCategory,
            trackingNumber: order.trackingNumber?.trim() || null,
            conditionNotes: order.conditionNotes?.trim() || null,
            priorityNote: order.priorityNote?.trim() || null,
            customPhotoUrl: order.customPhotoUrl ?? null,
            estimatedDoneAt: order.estimatedDoneAt ? new Date(order.estimatedDoneAt) : null,
            handedOverAt: resolvedHandedOver,
          },
        })
      : await tx.serviceOrder.create({
          data: {
            id: order.id,
            publicId: finalPublicId,
            code: finalCode,
            customerId: customer.id,
            vehicleId,
            intakeType: order.intakeType,
            entryMethod: order.entryMethod,
            unitCategory: order.unitCategory,
            trackingNumber: order.trackingNumber?.trim() || null,
            conditionNotes: order.conditionNotes?.trim() || null,
            priorityNote: order.priorityNote?.trim() || null,
            customPhotoUrl: order.customPhotoUrl ?? null,
            receivedAt: new Date(order.receivedAt),
            estimatedDoneAt: order.estimatedDoneAt ? new Date(order.estimatedDoneAt) : null,
            handedOverAt: resolvedHandedOver,
            isWarrantyClaim: Boolean(order.isWarrantyClaim),
            warrantySourceItemId: order.warrantySourceItemId || null,
            createdBy: adminEmail ?? null,
          },
        });

    const prevItemsMap = new Map((existingOrder?.items || []).map((it) => [it.id, it]));
    const incomingItemIds = order.items.map((it) => it.id);

    await tx.serviceItem.deleteMany({
      where: {
        orderId: savedOrder.id,
        id: { notIn: incomingItemIds },
      },
    });

    for (const item of order.items) {
      const moduleType = await tx.moduleType.upsert({
        where: { name: item.moduleName.trim() },
        update: {},
        create: {
          name: item.moduleName.trim(),
          defaultWarrantyMonths: item.warrantyMonths || 1,
          isActive: true,
        },
      });

      const prevItem = prevItemsMap.get(item.id);
      const isDone = item.status === ItemStatus.SELESAI;
      const isWarrantyReady =
        item.status === ItemStatus.SIAP_DIAMBIL || item.status === ItemStatus.SELESAI;

      const finishedAt = isDone ? prevItem?.finishedAt ?? now : null;
      let warrantyUntil: Date | null = null;
      if (isWarrantyReady && item.warrantyMonths > 0) {
        const computedIso = computeWarrantyUntil(finishedAt ?? now, item.warrantyMonths);
        warrantyUntil = computedIso ? new Date(computedIso) : null;
      }

      const savedItem = await tx.serviceItem.upsert({
        where: { id: item.id },
        update: {
          moduleTypeId: moduleType.id,
          moduleDetail: item.moduleDetail.trim() || null,
          complaint: item.complaint.trim(),
          status: item.status,
          warrantyMonths: item.warrantyMonths,
          warrantyUntil,
          cancelReason: item.status === ItemStatus.BATAL ? item.cancelReason?.trim() || null : null,
          overrideReason: item.overrideReason?.trim() || null,
          finishedAt,
          beforePhotoUrl: item.beforePhotoUrl ?? null,
          afterPhotoUrl: item.afterPhotoUrl ?? null,
          beforeCaption: item.beforeCaption ?? null,
          afterCaption: item.afterCaption ?? null,
        },
        create: {
          id: item.id,
          orderId: savedOrder.id,
          moduleTypeId: moduleType.id,
          moduleDetail: item.moduleDetail.trim() || null,
          complaint: item.complaint.trim(),
          status: item.status,
          warrantyMonths: item.warrantyMonths,
          warrantyUntil,
          cancelReason: item.status === ItemStatus.BATAL ? item.cancelReason?.trim() || null : null,
          overrideReason: item.overrideReason?.trim() || null,
          finishedAt,
          beforePhotoUrl: item.beforePhotoUrl ?? null,
          afterPhotoUrl: item.afterPhotoUrl ?? null,
          beforeCaption: item.beforeCaption ?? null,
          afterCaption: item.afterCaption ?? null,
        },
      });

      await tx.progressLog.deleteMany({ where: { itemId: savedItem.id } });
      for (const lg of item.logs) {
        await tx.progressLog.create({
          data: {
            id: lg.id,
            itemId: savedItem.id,
            kind: LogKind.STATUS,
            toStatus: lg.stage ?? item.status,
            note: lg.note,
            isPublic: lg.isPublic,
            createdBy: adminEmail ?? null,
            createdAt: new Date(lg.createdAt),
            media: lg.photoUrl
              ? {
                  create: [
                    {
                      filePath: lg.photoUrl,
                      mimeType: guessMimeFromUrl(lg.photoUrl),
                      kind: MediaKind.FOTO,
                      sizeBytes: 0,
                      isPublic: lg.isPublic,
                    },
                  ],
                }
              : undefined,
          },
        });
      }
    }

    if (!existingOrder || !areAllItemsFinal(existingOrder.items)) {
      await tx.chargeLine.deleteMany({ where: { orderId: savedOrder.id } });
      if (order.charges.length > 0) {
        await tx.chargeLine.createMany({
          data: order.charges.map((chg) => ({
            id: chg.id,
            orderId: savedOrder.id,
            kind: chg.kind as ChargeKind,
            description: chg.description.trim(),
            qty: chg.qty || 1,
            unitPrice: chg.unitPrice,
          })),
        });
      }
    }

    await tx.payment.deleteMany({ where: { orderId: savedOrder.id } });
    if (order.payments.length > 0) {
      await tx.payment.createMany({
        data: order.payments.map((pay) => ({
          id: pay.id,
          orderId: savedOrder.id,
          amount: pay.amount,
          method: pay.method,
          paidAt: new Date(pay.paidAt),
          note: pay.note ?? null,
          createdBy: adminEmail ?? null,
        })),
      });
    }
  });

  return getServerDataset();
}

export async function createServerWarrantyClaim(
  rawPayload: unknown,
  adminEmail?: string | null
): Promise<{ dataset: ServerDataset; createdOrder: MockServiceOrder }> {
  const parsed = createWarrantyClaimSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new DatasetRuleError(parsed.error.issues[0]?.message || 'Permintaan klaim garansi tidak valid.');
  }

  const { sourceOrderId, sourceItemId, complaint } = parsed.data;

  if (!process.env.DATABASE_URL) {
    throw new DatasetRuleError('Database PostgreSQL wajib aktif untuk membuat klaim garansi.');
  }

  const createdOrderId = createUniqueId('ord');

  await prisma.$transaction(async (tx) => {
    const sourceOrder = await tx.serviceOrder.findUnique({
      where: { id: sourceOrderId },
      include: {
        items: { include: { moduleType: true } },
      },
    });
    if (!sourceOrder) {
      throw new DatasetRuleError('Order servis asal tidak ditemukan.', 404);
    }

    const sourceItem = sourceOrder.items.find((it) => it.id === sourceItemId);
    if (!sourceItem) {
      throw new DatasetRuleError('Modul servis asal tidak ditemukan.', 404);
    }

    if (!isWarrantyEligible(sourceItem)) {
      throw new DatasetRuleError(
        `Modul "${sourceItem.moduleType.name}" tidak memenuhi syarat klaim garansi (garansi habis atau unit belum selesai, BR-08).`
      );
    }

    const existingCodes = await tx.serviceOrder.findMany({ select: { code: true } });
    const { code } = generateUniqueOrderCode(existingCodes.map((c) => c.code));

    let publicId = generatePublicId();
    while (await tx.serviceOrder.findUnique({ where: { publicId }, select: { id: true } })) {
      publicId = generatePublicId();
    }

    const defaults = getDefaultBeforeAfter(sourceItem.moduleType.name, sourceOrder.unitCategory);
    const resolvedComplaint =
      complaint?.trim() ||
      `Klaim garansi dari nota #${sourceOrder.code.trim()}: ${sourceItem.complaint}`;

    await tx.serviceOrder.create({
      data: {
        id: createdOrderId,
        publicId,
        code,
        customerId: sourceOrder.customerId,
        vehicleId: sourceOrder.vehicleId,
        intakeType: sourceOrder.intakeType,
        entryMethod: sourceOrder.entryMethod,
        unitCategory: sourceOrder.unitCategory,
        conditionNotes: `Klaim Garansi dari Nota #${sourceOrder.code.trim()} (${sourceItem.moduleType.name})`,
        isWarrantyClaim: true,
        warrantySourceItemId: sourceItem.id,
        createdBy: adminEmail ?? null,
        receivedAt: new Date(),
        estimatedDoneAt: new Date(Date.now() + 86400000 * 2),
        items: {
          create: [
            {
              id: createUniqueId('item'),
              moduleTypeId: sourceItem.moduleTypeId,
              moduleDetail: sourceItem.moduleDetail,
              complaint: resolvedComplaint,
              status: ItemStatus.DITERIMA,
              warrantyMonths: 0,
              beforePhotoUrl: defaults.beforePhotoUrl,
              afterPhotoUrl: defaults.afterPhotoUrl,
              beforeCaption: defaults.beforeCaption,
              afterCaption: defaults.afterCaption,
              progressLogs: {
                create: [
                  {
                    id: createUniqueId('log'),
                    kind: LogKind.STATUS,
                    toStatus: ItemStatus.DITERIMA,
                    note: `Unit diterima sebagai klaim garansi dari nota #${sourceOrder.code.trim()}.`,
                    isPublic: true,
                    createdBy: adminEmail ?? null,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });

  const dataset = await getServerDataset();
  const createdOrder = dataset.orders.find((o) => o.id === createdOrderId);
  if (!createdOrder) {
    throw new DatasetRuleError('Order klaim garansi tidak ditemukan setelah disimpan.', 500);
  }
  return { dataset, createdOrder };
}

export async function deleteServerOrder(orderId: string): Promise<ServerDataset> {
  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyDeleteOrder(current.orders, current.customers, orderId);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  await prisma.serviceOrder.delete({ where: { id: orderId } });
  return getServerDataset();
}

export async function upsertServerCustomer(payload: UpsertCustomerPayload): Promise<ServerDataset> {
  const parsed = upsertCustomerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new DatasetRuleError(parsed.error.issues[0]?.message || 'Data pelanggan tidak valid.');
  }
  const data = parsed.data;
  const cleanPhone = normalizePhone(data.phone);
  const resolvedWorkshop = normalizeWorkshopName(data.workshopName, data.type);

  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyUpsertCustomer(current.orders, current.customers, payload);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  await prisma.$transaction(async (tx) => {
    const existingById = data.id
      ? await tx.customer.findUnique({ where: { id: data.id } })
      : null;

    const duplicatePhoneOwner = await tx.customer.findUnique({ where: { phone: cleanPhone } });
    if (duplicatePhoneOwner && (!existingById || duplicatePhoneOwner.id !== existingById.id)) {
      throw new DatasetRuleError(
        `Nomor WA +${cleanPhone} sudah terdaftar atas nama ${duplicatePhoneOwner.name}.`
      );
    }

    const customer = existingById
      ? await tx.customer.update({
          where: { id: existingById.id },
          data: {
            name: data.name.trim(),
            phone: cleanPhone,
            type: data.type,
            workshopName: resolvedWorkshop,
            address: data.address !== undefined ? data.address?.trim() || null : existingById.address,
          },
        })
      : await tx.customer.create({
          data: {
            ...(data.id ? { id: data.id } : {}),
            name: data.name.trim(),
            phone: cleanPhone,
            type: data.type,
            workshopName: resolvedWorkshop,
            address: data.address?.trim() || null,
          },
        });

    if (
      data.vehicle &&
      (data.vehicle.brand.trim() || data.vehicle.model.trim() || data.vehicle.plateNumber?.trim())
    ) {
      const plate = data.vehicle.plateNumber ? data.vehicle.plateNumber.trim().toUpperCase() : null;
      await tx.vehicle.create({
        data: {
          customerId: customer.id,
          brand: data.vehicle.brand.trim() || 'Unit',
          model: data.vehicle.model.trim() || plate || 'Kendaraan',
          year: data.vehicle.year ?? null,
          plateNumber: plate,
          vin: data.vehicle.vin?.trim() || null,
        },
      });
    }
  });

  return getServerDataset();
}

export async function addServerVehicle(
  customerId: string,
  vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null; vin?: string | null }
): Promise<ServerDataset> {
  const parsed = addVehicleSchema.safeParse({ customerId, vehicle });
  if (!parsed.success) {
    throw new DatasetRuleError(parsed.error.issues[0]?.message || 'Data kendaraan tidak valid.');
  }

  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyAddVehicle(current.orders, current.customers, customerId, vehicle);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  const plate = parsed.data.vehicle.plateNumber
    ? parsed.data.vehicle.plateNumber.trim().toUpperCase()
    : null;

  await prisma.vehicle.create({
    data: {
      customerId: parsed.data.customerId,
      brand: parsed.data.vehicle.brand.trim() || 'Unit',
      model: parsed.data.vehicle.model.trim() || plate || 'Kendaraan',
      year: parsed.data.vehicle.year ?? null,
      plateNumber: plate,
      vin: parsed.data.vehicle.vin?.trim() || null,
    },
  });

  return getServerDataset();
}

export async function updateServerVehicle(payload: UpdateVehiclePayload): Promise<ServerDataset> {
  const parsed = updateVehicleSchema.safeParse(payload);
  if (!parsed.success) {
    throw new DatasetRuleError(parsed.error.issues[0]?.message || 'Data kendaraan tidak valid.');
  }

  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyUpdateVehicle(current.orders, current.customers, payload);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  const plate = parsed.data.plateNumber ? parsed.data.plateNumber.trim().toUpperCase() : null;
  await prisma.vehicle.updateMany({
    where: {
      id: parsed.data.vehicleId,
      customerId: parsed.data.customerId,
    },
    data: {
      brand: parsed.data.brand.trim() || 'Unit',
      model: parsed.data.model.trim() || plate || 'Kendaraan',
      year: parsed.data.year ?? null,
      plateNumber: plate,
      vin: parsed.data.vin?.trim() || null,
    },
  });

  return getServerDataset();
}

export async function deleteServerVehicle(payload: DeleteVehiclePayload): Promise<ServerDataset> {
  const parsed = deleteVehicleSchema.safeParse(payload);
  if (!parsed.success) {
    throw new DatasetRuleError('Permintaan hapus kendaraan tidak valid.');
  }

  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyDeleteVehicle(current.orders, current.customers, payload);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  await prisma.vehicle.deleteMany({
    where: {
      id: parsed.data.vehicleId,
      customerId: parsed.data.customerId,
    },
  });

  return getServerDataset();
}

export async function deleteServerCustomer(customerId: string): Promise<ServerDataset> {
  if (!process.env.DATABASE_URL) {
    const current = getFallbackDataset();
    const synced = applyDeleteCustomer(current.orders, current.customers, customerId);
    writeFallbackDataset({ orders: synced.orders, customers: synced.customers });
    return { orders: synced.orders, customers: synced.customers };
  }

  const count = await prisma.serviceOrder.count({ where: { customerId } });
  if (count > 0) {
    throw new DatasetRuleError(
      'Pelanggan yang masih memiliki riwayat servis tidak dapat dihapus.'
    );
  }

  await prisma.customer.delete({ where: { id: customerId } });
  return getServerDataset();
}
