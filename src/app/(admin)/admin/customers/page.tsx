import { AdminCustomersClient, CustomerRow } from './AdminCustomersClient';
import { getServerDataset } from '@/lib/dataset-store';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const dataset = getServerDataset();

  return <AdminCustomersClient customers={dataset.customers as CustomerRow[]} />;
}
