import { prisma } from '@/lib/db';
import { AdminCustomersClient, CustomerRow } from './AdminCustomersClient';
import { getServerDataset } from '@/lib/dataset-store';

export const dynamic = 'force-dynamic';

async function getCustomers(): Promise<CustomerRow[]> {
  const dataset = getServerDataset();
  try {
    const customers = await prisma.customer.findMany({
      include: {
        vehicles: true,
        _count: {
          select: { serviceOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return customers.length > dataset.customers.length
      ? (customers as CustomerRow[])
      : (dataset.customers as CustomerRow[]);
  } catch {
    return dataset.customers as CustomerRow[];
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <AdminCustomersClient customers={customers} />;
}
