import { AdminCustomersClient, CustomerRow } from './AdminCustomersClient';
import { getCachedServerDataset } from '@/lib/dataset-store';
import { MockServiceOrder } from '@/lib/frontend-mock';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const dataset = await getCachedServerDataset();

  return (
    <AdminCustomersClient
      customers={dataset.customers as CustomerRow[]}
      initialOrders={dataset.orders as MockServiceOrder[]}
    />
  );
}
