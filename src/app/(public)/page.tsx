import { prisma } from '@/lib/db';
import { ItemStatus } from '@prisma/client';
import { PublicQueueClient } from '@/components/public/PublicQueueClient';
import { QueueCardProps } from '@/components/public/QueueCard';
import { getServerDataset } from '@/lib/dataset-store';

export const dynamic = 'force-dynamic';

function isOrderActive(statuses: ItemStatus[]): boolean {
  return statuses.some((s) => s !== ItemStatus.SELESAI && s !== ItemStatus.BATAL);
}

async function getDatasetQueueSnapshot(): Promise<QueueCardProps[]> {
  const allOrders = (await getServerDataset()).orders;
  return allOrders
    .filter((o) => isOrderActive(o.items.map((i) => i.status)))
    .map((o) => ({
      publicId: o.publicId,
      vehicleBrand: o.vehicleBrand,
      vehicleModel: o.vehicleModel,
      vehicleYear: o.vehicleYear,
      intakeType: o.intakeType,
      unitCategory: o.unitCategory,
      receivedAt: o.receivedAt,
      items: o.items.map((i) => ({
        id: i.id,
        moduleName: i.moduleName,
        status: i.status,
      })),
    }));
}

async function getActiveOrders(): Promise<QueueCardProps[]> {
  if (!process.env.DATABASE_URL) {
    return getDatasetQueueSnapshot();
  }

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
        unitCategory: true,
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

    return orders.map((o) => ({
      publicId: o.publicId,
      intakeType: o.intakeType,
      unitCategory:
        o.unitCategory === 'GENSET_INDUSTRI' ||
        o.items.some((i) => i.moduleType.name.toLowerCase().includes('genset'))
          ? 'GENSET_INDUSTRI'
          : 'OTOMOTIF',
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
    return getDatasetQueueSnapshot();
  }
}

export default async function PublicQueuePage() {
  const orders = await getActiveOrders();

  return <PublicQueueClient initialOrders={orders} />;
}
