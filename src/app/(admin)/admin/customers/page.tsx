import { prisma } from '@/lib/db';
import { AdminCustomersClient, CustomerRow } from './AdminCustomersClient';
import { INITIAL_CUSTOMERS } from '@/lib/frontend-mock';

async function getCustomers(): Promise<CustomerRow[]> {
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
    return customers.length > 0 ? (customers as CustomerRow[]) : (INITIAL_CUSTOMERS as CustomerRow[]);
  } catch {
    return INITIAL_CUSTOMERS as CustomerRow[];
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <AdminCustomersClient customers={customers} />;
}
