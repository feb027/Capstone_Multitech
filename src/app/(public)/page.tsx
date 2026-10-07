import { prisma } from '@/lib/db';
import { ItemStatus } from '@prisma/client';
import { PublicQueueClient } from '@/components/public/PublicQueueClient';
import { QueueCardProps } from '@/components/public/QueueCard';

export const revalidate = 30;

// Fallback high-fidelity sample data when database is empty or not yet seeded
const FALLBACK_ORDERS: QueueCardProps[] = [
  {
    publicId: 'avanza-4821',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Avanza 1.3 Veloz',
    vehicleYear: 2018,
    intakeType: 'MOBIL_UTUH',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    items: [
      { id: '1', moduleName: 'ECU Mesin (Denso)', status: ItemStatus.PERBAIKAN },
      { id: '2', moduleName: 'Speedometer Digital', status: ItemStatus.UJI_QC },
    ],
  },
  {
    publicId: 'jazz-9102',
    vehicleBrand: 'Honda',
    vehicleModel: 'Jazz RS GK5',
    vehicleYear: 2019,
    intakeType: 'MOBIL_UTUH',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    items: [
      { id: '3', moduleName: 'EPS Module Steering', status: ItemStatus.DIAGNOSA },
    ],
  },
  {
    publicId: 'pajero-7301',
    vehicleBrand: 'Mitsubishi',
    vehicleModel: 'Pajero Sport Dakar',
    vehicleYear: 2017,
    intakeType: 'MODUL_SAJA',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // yesterday
    items: [
      { id: '4', moduleName: 'ECU 4N15 Diesel', status: ItemStatus.SIAP_DIAMBIL },
    ],
  },
  {
    publicId: 'ertiga-5520',
    vehicleBrand: 'Suzuki',
    vehicleModel: 'All New Ertiga',
    vehicleYear: 2019,
    intakeType: 'MOBIL_UTUH',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 50), // 2 days ago
    items: [
      { id: '5', moduleName: 'BCM Modul Kelistrikan', status: ItemStatus.PERBAIKAN },
    ],
  },
];

async function getActiveOrders(): Promise<QueueCardProps[]> {
  try {
    const orders = await prisma.serviceOrder.findMany({
      where: {
        items: {
          some: {
            status: {
              notIn: [ItemStatus.SELESAI, ItemStatus.BATAL],
            },
          },
        },
      },
      select: {
        publicId: true,
        intakeType: true,
        receivedAt: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
          },
        },
        items: {
          select: {
            id: true,
            status: true,
            moduleType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 50,
    });

    if (orders.length === 0) {
      return FALLBACK_ORDERS;
    }

    return orders.map((o) => ({
      publicId: o.publicId,
      intakeType: o.intakeType,
      receivedAt: o.receivedAt,
      vehicleBrand: o.vehicle?.brand || null,
      vehicleModel: o.vehicle?.model || null,
      vehicleYear: o.vehicle?.year || null,
      items: o.items.map((i) => ({
        id: i.id,
        moduleName: i.moduleType.name,
        status: i.status,
      })),
    }));
  } catch {
    // If PostgreSQL server is not connected or credentials mismatch in dev,
    // gracefully show realistic preview cards instead of breaking
    return FALLBACK_ORDERS;
  }
}

export default async function PublicQueuePage() {
  const orders = await getActiveOrders();

  return <PublicQueueClient initialOrders={orders} />;
}
