import { prisma } from '@/lib/db';
import { ItemStatus } from '@prisma/client';
import { PublicQueueClient } from '@/components/public/PublicQueueClient';
import { QueueCardProps } from '@/components/public/QueueCard';
import { getServerDataset } from '@/lib/dataset-store';

export const dynamic = 'force-dynamic';

function isOrderActive(statuses: ItemStatus[]): boolean {
  return statuses.some((s) => s !== ItemStatus.SELESAI && s !== ItemStatus.BATAL);
}

function getDatasetQueueSnapshot(): {
  activeOrders: QueueCardProps[];
  allPublicIds: Set<string>;
} {
  const allOrders = getServerDataset().orders;
  const allPublicIds = new Set(allOrders.map((o) => o.publicId));
  const activeOrders = allOrders
    .filter((o) => isOrderActive(o.items.map((i) => i.status)))
    .map((o) => ({
      publicId: o.publicId,
      code: o.code,
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

  return { activeOrders, allPublicIds };
}

async function getActiveOrders(): Promise<QueueCardProps[]> {
  const { activeOrders: datasetActive, allPublicIds } = getDatasetQueueSnapshot();

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
        code: true,
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

    const dbOnlyOrders: QueueCardProps[] = orders
      .filter((o) => !allPublicIds.has(o.publicId))
      .map((o) => ({
        publicId: o.publicId,
        code: o.code,
        intakeType: o.intakeType,
        unitCategory: o.items.some((i) => i.moduleType.name.toLowerCase().includes('genset'))
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

    return [...datasetActive, ...dbOnlyOrders];
  } catch {
    return datasetActive;
  }
}

export default async function PublicQueuePage() {
  const orders = await getActiveOrders();

  return <PublicQueueClient initialOrders={orders} />;
}
