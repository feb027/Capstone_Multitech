import { prisma } from '@/lib/db';
import { ItemStatus } from '@prisma/client';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SERVICE_ORDERS,
  INITIAL_SPAREPARTS,
  MockServiceOrder,
} from '@/lib/frontend-mock';

async function getDashboardData() {
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

    if (totalActive === 0 && totalCustomers === 0) {
      return getFallbackDashboardData();
    }

    return {
      totalActive: totalActive || INITIAL_SERVICE_ORDERS.length,
      totalCustomers: totalCustomers || INITIAL_CUSTOMERS.length,
      totalModules,
      statusCounts,
      recentOrders: INITIAL_SERVICE_ORDERS,
    };
  } catch {
    return getFallbackDashboardData();
  }
}

function getFallbackDashboardData() {
  const statusCounts: Record<string, number> = {};
  for (const order of INITIAL_SERVICE_ORDERS) {
    for (const item of order.items) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    }
  }

  return {
    totalActive: INITIAL_SERVICE_ORDERS.length,
    totalCustomers: INITIAL_CUSTOMERS.length,
    totalModules: 9,
    statusCounts,
    recentOrders: INITIAL_SERVICE_ORDERS as MockServiceOrder[],
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const lowStockParts = INITIAL_SPAREPARTS.filter((p) => p.stock <= p.minStock);

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
