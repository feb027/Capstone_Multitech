import { AdminReportsClient } from '@/components/admin/AdminReportsClient';
import { getCachedServerDataset } from '@/lib/dataset-store';
import { MockCustomerRow, MockServiceOrder } from '@/lib/frontend-mock';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const dataset = await getCachedServerDataset();
  return (
    <AdminReportsClient
      initialOrders={dataset.orders as MockServiceOrder[]}
      initialCustomers={dataset.customers as MockCustomerRow[]}
    />
  );
}
