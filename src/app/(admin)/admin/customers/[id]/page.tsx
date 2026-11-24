import { getCachedServerDataset } from '@/lib/dataset-store';
import type { CustomerRow } from '../customer-utils';
import { CustomerDetailClient } from './CustomerDetailClient';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await getCachedServerDataset();

  return (
    <CustomerDetailClient
      customerId={decodeURIComponent(id)}
      initialCustomers={dataset.customers as CustomerRow[]}
      initialOrders={dataset.orders}
    />
  );
}
