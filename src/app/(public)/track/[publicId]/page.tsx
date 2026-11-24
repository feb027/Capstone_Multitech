import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAdminSession, verifyTrackSessionToken } from '@/lib/auth';
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
    entryMethod?: string;
    trackingNumber?: string | null;
    unitCategory?: string;
    customPhotoUrl?: string | null;
    isWarrantyClaim?: boolean;
    warrantySourceCode?: string | null;
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
      warrantyUntil?: string | Date | null;
      cancelReason?: string | null;
      beforePhotoUrl?: string | null;
      afterPhotoUrl?: string | null;
      beforeCaption?: string | null;
      afterCaption?: string | null;
      logs: Array<{
        id: string;
        createdAt: string | Date;
        stage?: string | null;
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

  let useDatasetFallback = !process.env.DATABASE_URL;

  if (!useDatasetFallback) {
    try {
      const dbOrder = await prisma.serviceOrder.findUnique({
        where: { publicId },
        include: {
          warrantySourceItem: {
            include: {
              order: { select: { code: true } },
            },
          },
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
          entryMethod: dbOrder.entryMethod,
          trackingNumber: dbOrder.trackingNumber,
          unitCategory: dbOrder.unitCategory,
          customPhotoUrl: dbOrder.customPhotoUrl,
          isWarrantyClaim: Boolean(dbOrder.warrantySourceItemId),
          warrantySourceCode: dbOrder.warrantySourceItem?.order?.code ?? null,
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
            warrantyUntil: it.warrantyUntil,
            cancelReason: it.cancelReason,
            beforePhotoUrl: it.beforePhotoUrl,
            afterPhotoUrl: it.afterPhotoUrl,
            beforeCaption: it.beforeCaption,
            afterCaption: it.afterCaption,
            logs: it.progressLogs.map((pl) => ({
              id: pl.id,
              createdAt: pl.createdAt,
              stage: pl.toStatus ?? null,
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
      useDatasetFallback = true;
    }
  }

  if (useDatasetFallback && !orderData) {
    const datasetOrders = (await getServerDataset()).orders;
    const mock = datasetOrders.find((o) => o.publicId === publicId);

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
        entryMethod: mock.entryMethod,
        trackingNumber: mock.trackingNumber ?? null,
        unitCategory: mock.unitCategory,
        customPhotoUrl: mock.customPhotoUrl ?? null,
        isWarrantyClaim: Boolean(mock.isWarrantyClaim),
        warrantySourceCode: mock.warrantySourceCode ?? null,
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
          warrantyUntil: it.warrantyUntil ?? null,
          cancelReason: it.cancelReason ?? null,
          beforePhotoUrl: it.beforePhotoUrl ?? null,
          afterPhotoUrl: it.afterPhotoUrl ?? null,
          beforeCaption: it.beforeCaption ?? null,
          afterCaption: it.afterCaption ?? null,
          logs: it.logs
            .filter((l) => l.isPublic)
            .map((l) => ({
              id: l.id,
              createdAt: l.createdAt,
              stage: l.stage ?? null,
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

  const cookieStore = await cookies();
  const trackCookie = cookieStore.get(`track_session_${orderData.publicId}`)?.value;
  const isVerifiedTrackSession = await verifyTrackSessionToken(
    trackCookie,
    orderData.publicId
  );
  const adminSession = await getAdminSession();

  if (!isVerifiedTrackSession && !adminSession) {
    redirect('/cek');
  }

  return <TrackingDetailClient order={orderData} />;
}
