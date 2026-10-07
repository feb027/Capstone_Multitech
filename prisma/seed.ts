import { PrismaClient, CustomerType, IntakeType, EntryMethod, ItemStatus, LogKind } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Multitech...');

  // 1. Create Default Admin
  const adminEmail = 'admin@multitech.com';
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123456', 10);
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
  const moduleTypes = [
    { name: 'ECU (Engine Control Unit)', defaultWarrantyMonths: 3, description: 'Modul komputer utama pengatur mesin & injeksi' },
    { name: 'BCM (Body Control Module)', defaultWarrantyMonths: 2, description: 'Modul pengatur kelistrikan bodi, lampu & central lock' },
    { name: 'EPS (Electric Power Steering)', defaultWarrantyMonths: 3, description: 'Modul & motor power steering elektrik' },
    { name: 'Speedometer / Instrument Cluster', defaultWarrantyMonths: 1, description: 'Panel instrumen, jarum, LCD & odometer' },
    { name: 'ABS Module', defaultWarrantyMonths: 2, description: 'Modul kontrol rem anti-lock braking system' },
    { name: 'SRS Airbag Module', defaultWarrantyMonths: 1, description: 'Modul sensor & aktivasi kantung udara' },
    { name: 'TCM (Transmission Control)', defaultWarrantyMonths: 3, description: 'Modul kontrol transmisi matik / CVT' },
    { name: 'Immobilizer & Smart Key', defaultWarrantyMonths: 1, description: 'Modul penerima kunci kontak pintar & chip RFID' },
    { name: 'Lainnya', defaultWarrantyMonths: 1, description: 'Komponen elektronika otomotif lainnya' },
  ];

  for (const mt of moduleTypes) {
    await prisma.moduleType.upsert({
      where: { name: mt.name },
      update: {},
      create: mt,
    });
  }
  console.log(`Seeded ${moduleTypes.length} module types.`);

  // 3. Sample Customer & Vehicle
  const sampleCustomer = await prisma.customer.upsert({
    where: { phone: '6281234567890' },
    update: {},
    create: {
      name: 'Budi Santoso',
      phone: '6281234567890',
      type: CustomerType.PERORANGAN,
      address: 'Jl. HZ. Mustofa No. 45, Tasikmalaya',
      vehicles: {
        create: [
          {
            brand: 'Toyota',
            model: 'Avanza 1.3 Veloz',
            year: 2015,
            plateNumber: 'Z 1234 AB',
          },
        ],
      },
    },
  });

  const sampleMitra = await prisma.customer.upsert({
    where: { phone: '6289876543210' },
    update: {},
    create: {
      name: 'Pak Hendra (Bengkel Maju Motor)',
      phone: '6289876543210',
      type: CustomerType.MITRA,
      workshopName: 'Bengkel Maju Motor Tasik',
      address: 'Jl. Sutisna Senjaya No. 88, Tasikmalaya',
      vehicles: {
        create: [
          {
            brand: 'Honda',
            model: 'Jazz RS GK5',
            year: 2018,
            plateNumber: 'D 5678 CD',
          },
        ],
      },
    },
  });

  console.log('Seeded sample customers:', sampleCustomer.name, sampleMitra.name);
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
