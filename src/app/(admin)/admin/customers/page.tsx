import { prisma } from '@/lib/db';
import { CustomerForm } from './CustomerForm';
import { CustomerType } from '@prisma/client';

const FALLBACK_CUSTOMERS = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    phone: '6281234567890',
    type: CustomerType.PERORANGAN,
    workshopName: null,
    address: 'Jl. HZ. Mustofa No. 45, Tasikmalaya',
    vehicles: [
      { id: 'v1', brand: 'Toyota', model: 'Avanza 1.3 Veloz', year: 2018, plateNumber: 'Z 1234 AB' },
    ],
    _count: { serviceOrders: 2 },
  },
  {
    id: 'c2',
    name: 'Pak Hendra (Mitra)',
    phone: '6289876543210',
    type: CustomerType.MITRA,
    workshopName: 'Bengkel Maju Motor',
    address: 'Jl. Sutisna Senjaya No. 88, Tasikmalaya',
    vehicles: [
      { id: 'v2', brand: 'Honda', model: 'Jazz RS GK5', year: 2019, plateNumber: 'D 5678 CD' },
      { id: 'v3', brand: 'Mitsubishi', model: 'Pajero Sport', year: 2017, plateNumber: 'Z 9999 DA' },
    ],
    _count: { serviceOrders: 5 },
  },
];

async function getCustomers() {
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

  return (
    <div className="mx-auto max-w-lg px-5 pt-4 sm:max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Pelanggan
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Perorangan & Bengkel Mitra
          </p>
        </div>
        <CustomerForm />
      </div>

      <div className="mt-5 space-y-3">
        {customers.map((c) => (
          <div
            key={c.id}
            className="rounded-[24px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.type === CustomerType.MITRA
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {c.type === CustomerType.MITRA ? 'Mitra B2B' : 'Perorangan'}
                  </span>
                </div>
                {c.workshopName && (
                  <p className="mt-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {c.workshopName}
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
                  +{c.phone}
                </p>
              </div>

              <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                {c._count.serviceOrders} Servis
              </span>
            </div>

            {/* Vehicles */}
            {c.vehicles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-black/[0.03] dark:border-white/[0.04]">
                {c.vehicles.map((v) => (
                  <span
                    key={v.id}
                    className="rounded-lg bg-[#F2F2F7] px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    {v.brand} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
