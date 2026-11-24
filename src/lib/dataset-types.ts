import { CustomerType, EntryMethod, IntakeType, ItemStatus, PaymentMethod } from '@prisma/client';

export const PARTNER_WORKSHOPS = [
  'Wahana Retro',
  'Merdeka Motor',
  'Kurnia',
  'Edis Motor',
  'Fals Motor',
  'Tridaya Motor',
  'Eko Motor',
  'Aci Motor',
] as const;
export type PartnerWorkshopName = (typeof PARTNER_WORKSHOPS)[number];

export const NEW_WORKSHOP_OPTION = '__NEW_WORKSHOP__';

export function createUniqueId(prefix: string): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 12)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePhone(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function normalizeWorkshopName(
  workshopName?: string | null,
  customerType?: CustomerType
): string | null {
  if (customerType !== CustomerType.MITRA) return null;
  const trimmed = (workshopName || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const matchedPreset = PARTNER_WORKSHOPS.find(
    (preset) => preset.toLowerCase() === lower
  );
  return matchedPreset || trimmed;
}

export function getWorkshopOptions(
  customers: Array<{ type: CustomerType; workshopName?: string | null }> = [],
  orders: Array<{ customerType: CustomerType; workshopName?: string | null }> = []
): string[] {
  const seen = new Map<string, string>();
  for (const preset of PARTNER_WORKSHOPS) {
    seen.set(preset.toLowerCase(), preset);
  }
  for (const c of customers) {
    if (c.type !== CustomerType.MITRA || !c.workshopName) continue;
    const clean = c.workshopName.trim().replace(/\s+/g, ' ');
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.set(clean.toLowerCase(), clean);
    }
  }
  for (const o of orders) {
    if (o.customerType !== CustomerType.MITRA || !o.workshopName) continue;
    const clean = o.workshopName.trim().replace(/\s+/g, ' ');
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.set(clean.toLowerCase(), clean);
    }
  }
  return Array.from(seen.values());
}

export interface MockProgressLog {
  id: string;
  createdAt: string;
  stage?: ItemStatus | null;
  note: string;
  isPublic: boolean;
  photoUrl?: string | null;
}

export interface MockServiceItem {
  id: string;
  moduleTypeId: string;
  moduleName: string;
  moduleDetail: string;
  complaint: string;
  status: ItemStatus;
  warrantyMonths: number;
  warrantyUntil?: string | null;
  cancelReason?: string | null;
  overrideReason?: string | null;
  finishedAt?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  beforeCaption?: string | null;
  afterCaption?: string | null;
  logs: MockProgressLog[];
}

export function getDefaultBeforeAfter(
  moduleName?: string,
  unitCategory?: string
): {
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  beforeCaption: string;
  afterCaption: string;
} {
  const name = (moduleName || '').toLowerCase();

  if (
    unitCategory === 'GENSET_INDUSTRI' ||
    name.includes('genset') ||
    name.includes('amf') ||
    name.includes('dse')
  ) {
    return {
      beforePhotoUrl: '/images/units/genset-dse7320.png',
      afterPhotoUrl: '/images/shop/multitech-genset-units.jpg',
      beforeCaption: 'Kondisi awal panel controller blank & regulator DC-DC 24V putus.',
      afterCaption: 'Penggantian IC regulator DC-DC & re-soldering jalur power, display normal.',
    };
  }

  if (name.includes('speedometer') || name.includes('cluster') || name.includes('odometer')) {
    return {
      beforePhotoUrl: '/images/units/speedometer-cluster.jpg',
      afterPhotoUrl: '/images/units/speedometer-cluster.jpg',
      beforeCaption: 'Kondisi awal layar LCD redup & jarum RPM tidak stabil.',
      afterCaption: 'Penggantian IC regulator 5V, kapasitor filter, dan kalibrasi jarum RPM.',
    };
  }

  if (name.includes('eps') || name.includes('bcm')) {
    return {
      beforePhotoUrl: '/images/units/eps-bcm-module.jpg',
      afterPhotoUrl: '/images/units/eps-bcm-module.jpg',
      beforeCaption: 'Kondisi awal soket & jalur relay modul mengalami korosi / pin lemah.',
      afterCaption: 'Penggantian relay dual-coil Omron & pembersihan PCB, bench test lolos QC.',
    };
  }

  return {
    beforePhotoUrl: '/images/units/ecu-module.jpg',
    afterPhotoUrl: '/images/units/ecu-module.jpg',
    beforeCaption: 'Kondisi awal transistor driver coil & jalur PCB bermasalah (drop tegangan).',
    afterCaption: 'Penggantian IC driver baru, reballing & uji osiloskop sinyal output normal.',
  };
}

export interface MockChargeLine {
  id: string;
  kind: 'JASA' | 'SPAREPART' | 'DIAGNOSA';
  description: string;
  qty: number;
  unitPrice: number;
}

export interface MockPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note?: string;
}

export interface MockServiceOrder {
  id: string;
  publicId: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  workshopName?: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  plateNumber?: string | null;
  unitCategory: 'OTOMOTIF' | 'GENSET_INDUSTRI';
  intakeType: IntakeType;
  entryMethod: EntryMethod;
  trackingNumber?: string | null;
  conditionNotes?: string | null;
  priorityNote?: string | null;
  customPhotoUrl?: string | null;
  receivedAt: string;
  estimatedDoneAt: string | null;
  handedOverAt?: string | null;
  isWarrantyClaim?: boolean;
  warrantySourceItemId?: string | null;
  warrantySourceCode?: string | null;
  items: MockServiceItem[];
  charges: MockChargeLine[];
  payments: MockPayment[];
}

export interface MockCustomerRow {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  workshopName: string | null;
  address: string | null;
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number | null;
    plateNumber: string | null;
    vin?: string | null;
  }>;
  _count: { serviceOrders: number };
}

export interface UpsertCustomerPayload {
  id?: string;
  previousPhone?: string;
  name: string;
  phone: string;
  type: CustomerType;
  workshopName?: string | null;
  address?: string | null;
  vehicle?: {
    brand: string;
    model: string;
    year: number | null;
    plateNumber: string | null;
    vin?: string | null;
  } | null;
}

export interface UpdateVehiclePayload {
  customerId: string;
  vehicleId: string;
  brand: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  vin?: string | null;
}

export interface DeleteVehiclePayload {
  customerId: string;
  vehicleId: string;
}
