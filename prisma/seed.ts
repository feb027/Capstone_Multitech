import { PrismaClient, ChargeKind, LogKind } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SERVICE_ORDERS,
  normalizePhone,
} from '../src/lib/frontend-mock';

const SEED_MODULE_TYPES = [
  { id: 'm1', name: 'ECU (Engine Control Unit)', description: 'Komputer utama mesin & injeksi', defaultWarrantyMonths: 3, isActive: true },
  { id: 'm2', name: 'BCM (Body Control Module)', description: 'Kelistrikan bodi, lampu & central lock', defaultWarrantyMonths: 2, isActive: true },
  { id: 'm3', name: 'EPS (Electric Power Steering)', description: 'Modul motor power steering elektrik', defaultWarrantyMonths: 3, isActive: true },
  { id: 'm4', name: 'Speedometer / Cluster', description: 'Panel instrumen, jarum, LCD & odometer', defaultWarrantyMonths: 1, isActive: true },
  { id: 'm5', name: 'ABS Module', description: 'Modul kontrol rem anti-lock braking', defaultWarrantyMonths: 2, isActive: true },
  { id: 'm6', name: 'TCM (Transmission Control)', description: 'Modul kontrol transmisi matik/CVT', defaultWarrantyMonths: 3, isActive: true },
  { id: 'm7', name: 'Modul Kontrol Genset / AMF', description: 'Panel kontrol genset & sistem industri', defaultWarrantyMonths: 2, isActive: true },
  { id: 'm8', name: 'SRS Airbag Module', description: 'Modul sensor & aktivasi kantung udara', defaultWarrantyMonths: 1, isActive: true },
  { id: 'm9', name: 'Immobilizer & Smart Key', description: 'Modul penerima kunci kontak pintar & chip RFID', defaultWarrantyMonths: 1, isActive: true },
];

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Multitech...');

  // 1. Default Admin
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@multitech.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.admin.create({
      data: {
        name: 'Admin Multitech',
        email: adminEmail,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`Created default admin: ${admin.email}`);
  } else {
    console.log(`Admin ${adminEmail} already exists`);
  }

  // 2. Seed Module Types
  const moduleIdMap = new Map<string, string>();
  let fallbackModuleId = '';

  for (const mt of SEED_MODULE_TYPES) {
    const record = await prisma.moduleType.upsert({
      where: { name: mt.name },
      update: {
        description: mt.description,
        defaultWarrantyMonths: mt.defaultWarrantyMonths,
        isActive: mt.isActive,
      },
      create: {
        name: mt.name,
        description: mt.description,
        defaultWarrantyMonths: mt.defaultWarrantyMonths,
        isActive: mt.isActive,
      },
    });
    moduleIdMap.set(mt.id, record.id);
    moduleIdMap.set(mt.name.toLowerCase(), record.id);
    if (!fallbackModuleId) fallbackModuleId = record.id;
  }
  console.log(`Seeded ${SEED_MODULE_TYPES.length} module types.`);

  // 3. Seed Customers & Vehicles
  const customerMap = new Map<string, { customerId: string; primaryVehicleId: string | null }>();

  for (const cust of INITIAL_CUSTOMERS) {
    const phone = normalizePhone(cust.phone);
    const record = await prisma.customer.upsert({
      where: { phone },
      update: {
        name: cust.name,
        type: cust.type,
        workshopName: cust.workshopName,
        address: cust.address,
      },
      create: {
        name: cust.name,
        phone,
        type: cust.type,
        workshopName: cust.workshopName,
        address: cust.address,
      },
    });

    const existingVehicles = await prisma.vehicle.findMany({
      where: { customerId: record.id },
    });

    let primaryVehicleId = existingVehicles[0]?.id ?? null;
    for (const v of cust.vehicles) {
      const alreadyExists = existingVehicles.find(
        (ev) =>
          (v.plateNumber && ev.plateNumber === v.plateNumber) ||
          (ev.brand === v.brand && ev.model === v.model)
      );
      if (!alreadyExists) {
        const createdVehicle = await prisma.vehicle.create({
          data: {
            customerId: record.id,
            brand: v.brand,
            model: v.model,
            year: v.year,
            plateNumber: v.plateNumber,
          },
        });
        if (!primaryVehicleId) primaryVehicleId = createdVehicle.id;
      }
    }

    customerMap.set(phone, { customerId: record.id, primaryVehicleId });
  }
  console.log(`Seeded ${INITIAL_CUSTOMERS.length} customers.`);

  // 4. Seed Service Orders, Items, Logs, Charges & Payments
  for (const ord of INITIAL_SERVICE_ORDERS) {
    const existingOrder = await prisma.serviceOrder.findUnique({
      where: { publicId: ord.publicId },
    });
    if (existingOrder) continue;

    const phone = normalizePhone(ord.customerPhone);
    const matchedCust = customerMap.get(phone);
    if (!matchedCust) continue;

    await prisma.serviceOrder.create({
      data: {
        publicId: ord.publicId,
        code: ord.code,
        customerId: matchedCust.customerId,
        vehicleId: matchedCust.primaryVehicleId,
        intakeType: ord.intakeType,
        entryMethod: ord.entryMethod,
        trackingNumber: ord.trackingNumber ?? null,
        conditionNotes: ord.conditionNotes ?? null,
        receivedAt: new Date(ord.receivedAt),
        estimatedDoneAt: ord.estimatedDoneAt ? new Date(ord.estimatedDoneAt) : null,
        items: {
          create: ord.items.map((it) => {
            const matchedModId =
              moduleIdMap.get(it.moduleTypeId) ||
              moduleIdMap.get(it.moduleName.toLowerCase()) ||
              fallbackModuleId;

            return {
              moduleTypeId: matchedModId,
              moduleDetail: it.moduleDetail || null,
              complaint: it.complaint,
              status: it.status,
              warrantyMonths: it.warrantyMonths,
              progressLogs: {
                create: it.logs.map((lg) => ({
                  kind: LogKind.STATUS,
                  toStatus: it.status,
                  note: lg.note,
                  isPublic: lg.isPublic,
                  createdAt: new Date(lg.createdAt),
                })),
              },
            };
          }),
        },
        charges: {
          create: ord.charges.map((ch) => ({
            kind: ch.kind as ChargeKind,
            description: ch.description,
            qty: ch.qty,
            unitPrice: ch.unitPrice,
          })),
        },
        payments: {
          create: ord.payments.map((pay) => ({
            amount: pay.amount,
            method: pay.method,
            paidAt: new Date(pay.paidAt),
            note: pay.note ?? null,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${INITIAL_SERVICE_ORDERS.length} service orders.`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
