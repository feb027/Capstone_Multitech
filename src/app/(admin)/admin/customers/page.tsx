import { prisma } from '@/lib/db';
import { CustomerForm } from './CustomerForm';
import { CustomerType } from '@prisma/client';
import { Phone, Car } from 'lucide-react';

async function getCustomers() {
  try {
    return await prisma.customer.findMany({
      include: {
        vehicles: true,
        _count: {
          select: { serviceOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Failed to query customers:', err);
    return [];
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Master Data Pelanggan
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar pemilik kendaraan dan bengkel mitra langganan Multitech
          </p>
        </div>
        <CustomerForm />
      </div>

      <div className="mt-6">
        {customers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Belum ada data pelanggan yang tersimpan.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Gunakan tombol di atas untuk mendaftarkan pelanggan pertama.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        c.type === CustomerType.MITRA
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {c.type === CustomerType.MITRA ? 'Bengkel Mitra' : 'Perorangan'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {c._count.serviceOrders} Total Servis
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </h3>

                  {c.workshopName && (
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
                      {c.workshopName}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">+{c.phone}</span>
                  </div>

                  {c.address && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {c.address}
                    </p>
                  )}

                  {/* Registered Vehicles */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Kendaraan Terdaftar ({c.vehicles.length}):
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {c.vehicles.length > 0 ? (
                        c.vehicles.map((v) => (
                          <span
                            key={v.id}
                            className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {v.brand} {v.model} {v.plateNumber ? `• ${v.plateNumber}` : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] italic text-slate-400">
                          Belum ada kendaraan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
