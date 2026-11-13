import { prisma } from '@/lib/db';
import { ItemStatus } from '@prisma/client';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { getServerDataset } from '@/lib/dataset-store';
import { MockServiceOrder } from '@/lib/frontend-mock';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const dataset = getServerDataset();
  try {
    const [totalActive, totalCustomers, totalModules, itemsByStatus] = await Promise.all([
      prisma.serviceOrder.count({
        where: {
          items: {
            some: {
              status: {
                notIn: [ItemStatus.SELESAI, ItemStatus.BATAL],
              },
            },
          },
        },
      }),
      prisma.customer.count(),
      prisma.moduleType.count({ where: { isActive: true } }),
      prisma.serviceItem.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of itemsByStatus) {
      statusCounts[item.status] = item._count.id;
    }

    if (totalActive === 0) {
      return getFallbackDashboardData(dataset);
    }

    return {
      totalActive: Math.max(totalActive, dataset.orders.length),
      totalCustomers: Math.max(totalCustomers, dataset.customers.length),
      totalModules,
      statusCounts,
      recentOrders: dataset.orders,
      spareparts: dataset.spareparts,
    };
  } catch {
    return getFallbackDashboardData(dataset);
  }
}

function getFallbackDashboardData(dataset: ReturnType<typeof getServerDataset>) {
  const statusCounts: Record<string, number> = {};
  for (const order of dataset.orders) {
    for (const item of order.items) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    }
  }

  return {
    totalActive: dataset.orders.length,
    totalCustomers: dataset.customers.length,
    totalModules: 9,
    statusCounts,
    recentOrders: dataset.orders as MockServiceOrder[],
    spareparts: dataset.spareparts,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const lowStockParts = data.spareparts.filter((p) => p.stock <= p.minStock);

  return (
    <AdminDashboardClient
      totalActive={data.totalActive}
      totalCustomers={data.totalCustomers}
      totalModules={data.totalModules}
      statusCounts={data.statusCounts}
      recentOrders={data.recentOrders}
      lowStockParts={lowStockParts}
    />
  );
}
