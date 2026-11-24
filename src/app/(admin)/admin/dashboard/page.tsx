import { ItemStatus } from '@prisma/client';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { getServerDataset } from '@/lib/dataset-store';
import { MockCustomerRow, MockServiceOrder } from '@/lib/frontend-mock';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const dataset = getServerDataset();
  const totalActive = dataset.orders.filter((o) =>
    o.items.some((i) => i.status !== ItemStatus.SELESAI && i.status !== ItemStatus.BATAL)
  ).length;

  const statusCounts: Record<string, number> = {};
  for (const order of dataset.orders) {
    for (const item of order.items) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    }
  }

  return (
    <AdminDashboardClient
      totalActive={totalActive}
      totalCustomers={dataset.customers.length}
      statusCounts={statusCounts}
      recentOrders={dataset.orders as MockServiceOrder[]}
      initialCustomers={dataset.customers as MockCustomerRow[]}
    />
  );
}
