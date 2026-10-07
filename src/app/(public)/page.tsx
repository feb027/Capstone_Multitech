import { prisma } from '@/lib/db';
import { QueueCard } from '@/components/public/QueueCard';
import { ItemStatus } from '@prisma/client';

export const revalidate = 30; // ISR cache revalidation every 30 seconds

async function getActiveOrders() {
  try {
    const orders = await prisma.serviceOrder.findMany({
      where: {
        items: {
          some: {
            status: {
              notIn: [ItemStatus.SELESAI, ItemStatus.BATAL],
            },
          },
        },
      },
      select: {
        id: true,
        publicId: true,
        intakeType: true,
        receivedAt: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
          },
        },
        items: {
          select: {
            id: true,
            status: true,
            moduleType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 50,
    });

    return orders.map((o) => ({
      id: o.id,
      publicId: o.publicId,
      intakeType: o.intakeType,
      receivedAt: o.receivedAt,
      vehicleBrand: o.vehicle?.brand || null,
      vehicleModel: o.vehicle?.model || null,
      vehicleYear: o.vehicle?.year || null,
      items: o.items.map((i) => ({
        id: i.id,
        moduleName: i.moduleType.name,
        status: i.status,
      })),
    }));
  } catch (err) {
    console.error('Failed to query active orders:', err);
    return [];
  }
}

export default async function PublicQueuePage() {
  const activeOrders = await getActiveOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white shadow-lg dark:bg-slate-900 sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-crimson/20 px-3 py-1 text-xs font-semibold text-crimson-dark tracking-wider uppercase">
            Transparansi Layanan Bengkel
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
            Papan Pantau Progres Servis Elektronik Mobil
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base leading-relaxed">
            Pantau status pengerjaan ECU, BCM, EPS, dan Speedometer Anda secara langsung tanpa perlu konfirmasi manual.
          </p>
        </div>
      </section>

      {/* Queue Board Section */}
      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Antrean Unit yang Sedang Diproses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {activeOrders.length} unit aktif • Data diperbarui berkala
            </p>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Saat ini belum ada unit antrean yang sedang aktif diproses.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Unit baru yang didaftarkan oleh bengkel akan otomatis muncul di papan ini.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => (
              <QueueCard
                key={order.id}
                publicId={order.publicId}
                vehicleBrand={order.vehicleBrand}
                vehicleModel={order.vehicleModel}
                vehicleYear={order.vehicleYear}
                intakeType={order.intakeType}
                receivedAt={order.receivedAt}
                items={order.items}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
