import { prisma } from '@/lib/db';
import { CustomerType } from '@prisma/client';
import { AdminCustomersClient, CustomerRow } from './AdminCustomersClient';

const FALLBACK_CUSTOMERS: CustomerRow[] = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    phone: '6281234565678',
    type: CustomerType.PERORANGAN,
    workshopName: null,
    address: 'Jl. HZ. Mustofa No. 45, Tasikmalaya',
    vehicles: [
      { id: 'v1', brand: 'Toyota', model: 'Avanza 1.3 Veloz', year: 2018, plateNumber: 'Z 1842 KEM' },
    ],
    _count: { serviceOrders: 2 },
  },
  {
    id: 'c2',
    name: 'Pak Hendra',
    phone: '6289876544321',
    type: CustomerType.MITRA,
    workshopName: 'Bengkel Maju Motor Tasik',
    address: 'Jl. Sutisna Senjaya No. 88, Tasikmalaya',
    vehicles: [
      { id: 'v2', brand: 'Honda', model: 'Jazz RS GK5', year: 2019, plateNumber: 'D 5678 CD' },
      { id: 'v3', brand: 'Mitsubishi', model: 'Pajero Sport', year: 2017, plateNumber: 'Z 7301 DA' },
    ],
    _count: { serviceOrders: 5 },
  },
  {
    id: 'c3',
    name: 'CV Sinar Priangan',
    phone: '6282111226140',
    type: CustomerType.MITRA,
    workshopName: 'Divisi Maintenance CV Sinar Priangan',
    address: 'Kawasan Industri Indihiang, Tasikmalaya',
    vehicles: [
      { id: 'v4', brand: 'Deep Sea', model: 'Genset Controller DSE7320', year: 2021, plateNumber: null },
    ],
    _count: { serviceOrders: 1 },
  },
];

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
    return customers.length > 0 ? customers : FALLBACK_CUSTOMERS;
  } catch {
    return FALLBACK_CUSTOMERS;
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return <AdminCustomersClient customers={customers} />;
}
