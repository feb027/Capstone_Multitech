import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getServerDataset } from '@/lib/dataset-store';
import { TrackingDetailClient } from './TrackingDetailClient';

export const dynamic = 'force-dynamic';

interface TrackPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function TrackingDetailPage({ params }: TrackPageProps) {
  const { publicId } = await params;

  let orderData: {
    id: string;
    publicId: string;
    code: string;
    customer: {
      name: string;
      phone: string;
      type: string;
      workshopName: string | null;
    };
    vehicle: {
      brand: string;
      model: string;
      year: number | null;
    } | null;
    intakeType: string;
    unitCategory?: string;
    receivedAt: string | Date;
    estimatedDoneAt: string | Date | null;
    conditionNotes: string | null;
    items: Array<{
      id: string;
      moduleType: { name: string };
      moduleDetail: string | null;
      complaint: string;
      status: string;
      warrantyMonths: number | null;
      logs: Array<{
        id: string;
        createdAt: string | Date;
        note: string | null;
        photoUrl: string | null;
      }>;
    }>;
    charges: Array<{
      id: string;
      description: string;
      qty: number;
      unitPrice: number;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      method: string;
      paidAt: string | Date;
    }>;
  } | null = null;

  try {
    const dbOrder = await prisma.serviceOrder.findUnique({
      where: { publicId },
      include: {
        customer: true,
        vehicle: true,
        items: {
          include: {
            moduleType: true,
            progressLogs: {
              where: { isPublic: true },
              orderBy: { createdAt: 'desc' },
              include: { media: true },
            },
          },
        },
        charges: true,
        payments: true,
      },
    });

    if (dbOrder) {
      orderData = {
        id: dbOrder.id,
        publicId: dbOrder.publicId,
        code: dbOrder.code,
        customer: {
          name: dbOrder.customer.name,
          phone: dbOrder.customer.phone.replace(/(\d{4})\d+(\d{4})/, '$1****$2'),
          type: dbOrder.customer.type,
          workshopName: dbOrder.customer.workshopName,
        },
        // plateNumber sengaja tidak dikirim ke tampilan publik demi privasi pelanggan
        vehicle: dbOrder.vehicle
          ? {
              brand: dbOrder.vehicle.brand,
              model: dbOrder.vehicle.model,
              year: dbOrder.vehicle.year,
            }
          : null,
        intakeType: dbOrder.intakeType,
        receivedAt: dbOrder.receivedAt,
        estimatedDoneAt: dbOrder.estimatedDoneAt,
        conditionNotes: dbOrder.conditionNotes,
        items: dbOrder.items.map((it) => ({
          id: it.id,
          moduleType: { name: it.moduleType.name },
          moduleDetail: it.moduleDetail,
          complaint: it.complaint,
          status: it.status,
          warrantyMonths: it.warrantyMonths,
          logs: it.progressLogs.map((pl) => ({
            id: pl.id,
            createdAt: pl.createdAt,
            note: pl.note,
            photoUrl: pl.media.find((m) => m.isPublic)?.filePath || null,
          })),
        })),
        charges: dbOrder.charges.map((c) => ({
          id: c.id,
          description: c.description,
          qty: c.qty,
          unitPrice: c.unitPrice,
        })),
        payments: dbOrder.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          paidAt: p.paidAt,
        })),
      };
    }
  } catch {
    // Fallback ke preview lokal jika DB belum terhubung
  }

  if (!orderData) {
    const datasetOrders = getServerDataset().orders;
    const mock =
      datasetOrders.find((o) => o.publicId === publicId) ??
      (publicId.includes('4821') || publicId === 'demo' ? datasetOrders[0] : null);

    if (mock) {
      orderData = {
        id: mock.id,
        publicId: mock.publicId,
        code: mock.code,
        customer: {
          name: mock.customerName,
          phone: mock.customerPhone.replace(/(\d{4})\d+(\d{4})/, '$1****$2'),
          type: mock.customerType,
          workshopName: mock.workshopName ?? null,
        },
        vehicle: {
          brand: mock.vehicleBrand,
          model: mock.vehicleModel,
          year: mock.vehicleYear,
        },
        intakeType: mock.intakeType,
        unitCategory: mock.unitCategory,
        receivedAt: mock.receivedAt,
        estimatedDoneAt: mock.estimatedDoneAt,
        conditionNotes: mock.conditionNotes ?? null,
        items: mock.items.map((it) => ({
          id: it.id,
          moduleType: { name: it.moduleName },
          moduleDetail: it.moduleDetail,
          complaint: it.complaint,
          status: it.status,
          warrantyMonths: it.warrantyMonths,
          logs: it.logs
            .filter((l) => l.isPublic)
            .map((l) => ({
              id: l.id,
              createdAt: l.createdAt,
              note: l.note,
              photoUrl: l.photoUrl ?? null,
            })),
        })),
        charges: mock.charges.map((c) => ({
          id: c.id,
          description: c.description,
          qty: c.qty,
          unitPrice: c.unitPrice,
        })),
        payments: mock.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          paidAt: p.paidAt,
        })),
      };
    }
  }

  if (!orderData) {
    return notFound();
  }

  return <TrackingDetailClient order={orderData} />;
}
