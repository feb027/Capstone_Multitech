import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ItemStatus, CustomerType, IntakeType } from '@prisma/client';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  FileText, 
  MessageSquare, 
  Calendar,
  Layers,
  ChevronRight,
  Car
} from 'lucide-react';
import { TrackingDetailClient } from './TrackingDetailClient';

// Realistic fallback tracking datasets for local dev or offline mode
const FALLBACK_TRACKING_ORDERS: Record<string, any> = {
  'avanza-4821': {
    id: 'ord-4821',
    publicId: 'avanza-4821',
    code: '4821',
    customer: {
      name: 'Budi Santoso',
      phone: '0812****5678',
      type: CustomerType.PERORANGAN,
      workshopName: null,
    },
    vehicle: {
      brand: 'Toyota',
      model: 'Avanza 1.3 Veloz',
      year: 2018,
      plateNumber: 'B 1842 KEM',
    },
    intakeType: 'MOBIL_UTUH',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 28), // yesterday morning
    estimatedDoneAt: new Date(Date.now() + 1000 * 60 * 60 * 20), // tomorrow
    conditionNotes: 'Mesin pincang saat putaran idle, lampu check engine berkedip. Speedometer terkadang mati mendadak.',
    items: [
      {
        id: 'item-1',
        moduleType: { name: 'ECU (Engine Control Unit)' },
        moduleDetail: 'Bosch ME17.9.11',
        complaint: 'Hilang pengapian silinder 2 & 4, error DTC P0302/P0304',
        status: ItemStatus.PERBAIKAN,
        warrantyMonths: 3,
        logs: [
          {
            id: 'log-1',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
            note: 'Penyolderan ulang jalur transistor driver coil 30343 dan penggantian kapasitor bypass filter 47uF.',
            photoUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: 'log-2',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
            note: 'Hasil diagnosa osiloskop: sinyal trigger ignition coil silinder 2 drop di 1.2V (tegangan normal 5V).',
            photoUrl: null,
          },
          {
            id: 'log-3',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 27),
            note: 'Modul diterima & inspeksi fisik casing luar mulus tanpa bekas korosi air.',
            photoUrl: null,
          },
        ],
      },
      {
        id: 'item-2',
        moduleType: { name: 'Speedometer / Cluster' },
        moduleDetail: 'Denso Instrument Cluster Digital',
        complaint: 'Layar LCD odometer redup & jarum RPM meloncat tidak stabil',
        status: ItemStatus.UJI_QC,
        warrantyMonths: 1,
        logs: [
          {
            id: 'log-4',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
            note: 'Pengujian bench test 12V simulasi sinyal pulse RPM selama 3 jam, layar stabil dan terang merata.',
            photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          },
          {
            id: 'log-5',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
            note: 'Penggantian IC regulator 5V speedometer dan re-soldering pin soket fleksibel.',
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-1', description: 'Diagnosa & Uji Komparasi CAN Bus', qty: 1, unitPrice: 150000 },
      { id: 'c-2', description: 'IC Driver Ignition Coil Bosch + Pasang', qty: 1, unitPrice: 450000 },
      { id: 'c-3', description: 'Servis Re-soldering Cluster Speedometer & IC 5V', qty: 1, unitPrice: 350000 },
    ],
    payments: [
      { id: 'p-1', amount: 300000, method: 'TRANSFER', paidAt: new Date(Date.now() - 1000 * 60 * 60 * 26) },
    ],
  },
  'jazz-9102': {
    id: 'ord-9102',
    publicId: 'jazz-9102',
    code: '9102',
    customer: {
      name: 'Pak Hendra',
      phone: '0898****4321',
      type: CustomerType.MITRA,
      workshopName: 'Bengkel Maju Motor Tasik',
    },
    vehicle: {
      brand: 'Honda',
      model: 'Jazz RS GK5',
      year: 2019,
      plateNumber: 'D 5678 CD',
    },
    intakeType: 'MOBIL_UTUH',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 14),
    estimatedDoneAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    conditionNotes: 'Setir berat sebelah kanan, indikator EPS menyala kuning.',
    items: [
      {
        id: 'item-3',
        moduleType: { name: 'EPS (Electric Power Steering)' },
        moduleDetail: 'Showa EPS Module GK5',
        complaint: 'Kemudi kaku dan berat, indikator EPS aktif',
        status: ItemStatus.DIAGNOSA,
        warrantyMonths: 3,
        logs: [
          {
            id: 'log-6',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
            note: 'Pemeriksaan relay power EPS & sensor torsi (torque sensor) dengan scanner OBD2.',
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-4', description: 'Diagnosa Komprehensif Modul EPS Showa', qty: 1, unitPrice: 150000 },
    ],
    payments: [],
  },
};

interface TrackPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function TrackingDetailPage({ params }: TrackPageProps) {
  const { publicId } = await params;

  let orderData: any = null;

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
        vehicle: dbOrder.vehicle
          ? {
              brand: dbOrder.vehicle.brand,
              model: dbOrder.vehicle.model,
              year: dbOrder.vehicle.year,
              plateNumber: dbOrder.vehicle.plateNumber,
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
    // Graceful fallback during local dev
  }

  // Fallback to sample mockup dataset if not found in db
  if (!orderData) {
    orderData = FALLBACK_TRACKING_ORDERS[publicId] || null;
  }

  // If still not found, allow default sample view for 4821 or 404
  if (!orderData) {
    if (publicId.includes('4821') || publicId === 'demo') {
      orderData = FALLBACK_TRACKING_ORDERS['avanza-4821'];
    } else {
      return notFound();
    }
  }

  return <TrackingDetailClient order={orderData} />;
}
