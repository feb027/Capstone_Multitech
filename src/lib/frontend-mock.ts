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
): PartnerWorkshopName | null {
  if (customerType !== CustomerType.MITRA) return null;
  const raw = (workshopName || '').trim().toLowerCase();
  if (raw.includes('merdeka')) return 'Merdeka Motor';
  if (raw.includes('kurnia')) return 'Kurnia';
  if (raw.includes('edis')) return 'Edis Motor';
  if (raw.includes('fals')) return 'Fals Motor';
  if (raw.includes('tridaya')) return 'Tridaya Motor';
  if (raw.includes('eko')) return 'Eko Motor';
  if (raw.includes('aci')) return 'Aci Motor';
  if (raw.includes('wahana')) return 'Wahana Retro';
  return 'Wahana Retro';
}

export interface MockProgressLog {
  id: string;
  createdAt: string;
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
  items: MockServiceItem[];
  charges: MockChargeLine[];
  payments: MockPayment[];
}

export interface SparepartItem {
  id: string;
  sku: string;
  name: string;
  category: 'IC & Driver' | 'Power & Regulator' | 'Kapasitor & SMD' | 'Relay & Sensor' | 'Display & Flex';
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  location: string;
  updatedAt: string;
}

export const INITIAL_SERVICE_ORDERS: MockServiceOrder[] = [
  {
    id: 'ord-4821',
    publicId: 'avanza-4821',
    code: '4821',
    customerName: 'Budi Santoso',
    customerPhone: '6281234565678',
    customerType: CustomerType.PERORANGAN,
    workshopName: null,
    vehicleBrand: 'Toyota',
    vehicleModel: 'Avanza 1.3 Veloz',
    vehicleYear: 2018,
    plateNumber: 'Z 1842 KEM',
    unitCategory: 'OTOMOTIF',
    intakeType: IntakeType.MOBIL_UTUH,
    entryMethod: EntryMethod.DATANG,
    conditionNotes:
      'Mesin pincang saat putaran idle, lampu check engine berkedip. Speedometer terkadang mati mendadak.',
    priorityNote: 'Cek ulang bench test cluster setelah soldering IC 5V sebelum serah unit.',
    receivedAt: '2026-11-11T09:15:00.000Z',
    estimatedDoneAt: '2026-11-13T16:00:00.000Z',
    items: [
      {
        id: 'item-1',
        moduleTypeId: 'm1',
        moduleName: 'ECU (Engine Control Unit)',
        moduleDetail: 'Bosch ME17.9.11',
        complaint: 'Hilang pengapian silinder 2 & 4, error DTC P0302/P0304',
        status: ItemStatus.PERBAIKAN,
        warrantyMonths: 3,
        logs: [
          {
            id: 'log-1',
            createdAt: '2026-11-12T10:30:00.000Z',
            note: 'Penyolderan ulang jalur transistor driver coil 30343 dan penggantian kapasitor bypass filter 47uF.',
            isPublic: true,
            photoUrl: null,
          },
          {
            id: 'log-2',
            createdAt: '2026-11-11T15:20:00.000Z',
            note: 'Hasil diagnosa osiloskop: sinyal trigger ignition coil silinder 2 drop di 1.2V (tegangan normal 5V).',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
      {
        id: 'item-2',
        moduleTypeId: 'm4',
        moduleName: 'Speedometer / Cluster',
        moduleDetail: 'Denso Instrument Cluster Digital',
        complaint: 'Layar LCD odometer redup & jarum RPM meloncat tidak stabil',
        status: ItemStatus.UJI_QC,
        warrantyMonths: 1,
        logs: [
          {
            id: 'log-3',
            createdAt: '2026-11-12T08:45:00.000Z',
            note: 'Pengujian bench test 12V simulasi sinyal pulse RPM, layar stabil dan terang merata.',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-1', kind: 'DIAGNOSA', description: 'Diagnosa & Uji Komparasi CAN Bus', qty: 1, unitPrice: 150000 },
      { id: 'c-2', kind: 'SPAREPART', description: 'IC Driver Ignition Coil Bosch + Pasang', qty: 1, unitPrice: 450000 },
      { id: 'c-3', kind: 'JASA', description: 'Servis Re-soldering Cluster Speedometer & IC 5V', qty: 1, unitPrice: 350000 },
    ],
    payments: [
      { id: 'p-1', amount: 300000, method: PaymentMethod.TRANSFER, paidAt: '2026-11-11T10:00:00.000Z', note: 'DP awal' },
    ],
  },
  {
    id: 'ord-9102',
    publicId: 'jazz-9102',
    code: '9102',
    customerName: 'Pak Hendra',
    customerPhone: '6289876544321',
    customerType: CustomerType.MITRA,
    workshopName: 'Wahana Retro',
    vehicleBrand: 'Honda',
    vehicleModel: 'Jazz RS GK5',
    vehicleYear: 2019,
    plateNumber: 'D 5678 CD',
    unitCategory: 'OTOMOTIF',
    intakeType: IntakeType.MOBIL_UTUH,
    entryMethod: EntryMethod.DATANG,
    conditionNotes: 'Setir berat sebelah kanan, indikator EPS menyala kuning.',
    receivedAt: '2026-11-11T14:00:00.000Z',
    estimatedDoneAt: '2026-11-13T17:00:00.000Z',
    items: [
      {
        id: 'item-3',
        moduleTypeId: 'm3',
        moduleName: 'EPS (Electric Power Steering)',
        moduleDetail: 'Showa EPS Module GK5',
        complaint: 'Kemudi kaku dan berat, indikator EPS aktif',
        status: ItemStatus.DIAGNOSA,
        warrantyMonths: 3,
        logs: [
          {
            id: 'log-4',
            createdAt: '2026-11-12T09:15:00.000Z',
            note: 'Pemeriksaan relay power EPS & sensor torsi menggunakan scanner OBD2.',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-4', kind: 'DIAGNOSA', description: 'Diagnosa Komprehensif Modul EPS Showa', qty: 1, unitPrice: 150000 },
    ],
    payments: [],
  },
  {
    id: 'ord-7301',
    publicId: 'pajero-7301',
    code: '7301',
    customerName: 'Deni Kurniawan',
    customerPhone: '6281322119999',
    customerType: CustomerType.MITRA,
    workshopName: 'Kurnia',
    vehicleBrand: 'Mitsubishi',
    vehicleModel: 'Pajero Sport Dakar',
    vehicleYear: 2017,
    plateNumber: 'Z 7301 DA',
    unitCategory: 'OTOMOTIF',
    intakeType: IntakeType.MODUL_SAJA,
    entryMethod: EntryMethod.EKSPEDISI,
    trackingNumber: 'JNE-TSM-8829104',
    conditionNotes: 'Modul ECU kiriman ekspedisi dari Garut, segel aman tanpa retak.',
    priorityNote: 'Konfirmasi resi kirim balik JNE ke bengkel Kurnia hari ini.',
    receivedAt: '2026-11-10T11:00:00.000Z',
    estimatedDoneAt: '2026-11-12T15:00:00.000Z',
    items: [
      {
        id: 'item-4',
        moduleTypeId: 'm1',
        moduleName: 'ECU 4N15 Diesel',
        moduleDetail: 'Denso 1860C729',
        complaint: 'No-start setelah aki tekor, komunikasi CAN hilang',
        status: ItemStatus.SIAP_DIAMBIL,
        warrantyMonths: 3,
        logs: [
          {
            id: 'log-5',
            createdAt: '2026-11-12T11:10:00.000Z',
            note: 'Penggantian transceiver CAN TJA1042 dan bench test komunikasi penuh berhasil. Unit siap diambil/dikirim.',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-5', kind: 'SPAREPART', description: 'IC Transceiver CAN TJA1042 Original', qty: 1, unitPrice: 275000 },
      { id: 'c-6', kind: 'JASA', description: 'Perbaikan Jalur PCB & Bench Test ECU Diesel', qty: 1, unitPrice: 650000 },
    ],
    payments: [
      { id: 'p-2', amount: 925000, method: PaymentMethod.QRIS, paidAt: '2026-11-12T11:45:00.000Z', note: 'Lunas' },
    ],
  },
  {
    id: 'ord-5520',
    publicId: 'ertiga-5520',
    code: '5520',
    customerName: 'Rina Marlina',
    customerPhone: '6285299881234',
    customerType: CustomerType.PERORANGAN,
    workshopName: null,
    vehicleBrand: 'Suzuki',
    vehicleModel: 'All New Ertiga',
    vehicleYear: 2019,
    plateNumber: 'Z 5520 TB',
    unitCategory: 'OTOMOTIF',
    intakeType: IntakeType.MOBIL_UTUH,
    entryMethod: EntryMethod.DATANG,
    conditionNotes: 'Central lock pintu kanan & lampu sein kanan sering mati sendiri.',
    priorityNote: 'Follow up supplier untuk relay Omron G8ND-2S siang ini.',
    receivedAt: '2026-11-09T13:20:00.000Z',
    estimatedDoneAt: '2026-11-13T12:00:00.000Z',
    items: [
      {
        id: 'item-5',
        moduleTypeId: 'm2',
        moduleName: 'BCM Modul Kelistrikan',
        moduleDetail: 'Continental BCM-SZK-19',
        complaint: 'Relay central lock lemah dan jalur sein terputus saat panas',
        status: ItemStatus.MENUNGGU_SPAREPART,
        warrantyMonths: 2,
        logs: [
          {
            id: 'log-6',
            createdAt: '2026-11-11T16:10:00.000Z',
            note: 'Menunggu kedatangan relay dual-coil Omron G8ND-2S untuk penggantian di board BCM.',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [
      { id: 'c-7', kind: 'DIAGNOSA', description: 'Inspeksi & Uji Beban Jalur BCM', qty: 1, unitPrice: 125000 },
    ],
    payments: [],
  },
  {
    id: 'ord-6140',
    publicId: 'genset-6140',
    code: '6140',
    customerName: 'CV Sinar Priangan',
    customerPhone: '6282111226140',
    customerType: CustomerType.MITRA,
    workshopName: 'Merdeka Motor',
    vehicleBrand: 'Deep Sea',
    vehicleModel: 'Genset Controller DSE7320',
    vehicleYear: 2021,
    plateNumber: null,
    unitCategory: 'GENSET_INDUSTRI',
    intakeType: IntakeType.MODUL_SAJA,
    entryMethod: EntryMethod.DATANG,
    conditionNotes: 'Panel kontrol genset mati total akibat lonjakan tegangan AMF.',
    receivedAt: '2026-11-12T08:30:00.000Z',
    estimatedDoneAt: '2026-11-14T16:00:00.000Z',
    items: [
      {
        id: 'item-6',
        moduleTypeId: 'm9',
        moduleName: 'Modul Kontrol Genset / AMF',
        moduleDetail: 'Deep Sea Electronics DSE7320 MKII',
        complaint: 'Layar panel blank dan tidak merespons input DC 24V',
        status: ItemStatus.DITERIMA,
        warrantyMonths: 2,
        logs: [
          {
            id: 'log-7',
            createdAt: '2026-11-12T08:35:00.000Z',
            note: 'Unit modul genset diterima di meja teknisi untuk pemeriksaan bagian power supply DC-DC 24V.',
            isPublic: true,
            photoUrl: null,
          },
        ],
      },
    ],
    charges: [],
    payments: [],
  },
];

export const INITIAL_SPAREPARTS: SparepartItem[] = [
  {
    id: 'sp-1',
    sku: 'IC-DRV-30343',
    name: 'IC Driver Ignition Coil Bosch 30343',
    category: 'IC & Driver',
    unit: 'pcs',
    stock: 14,
    minStock: 5,
    unitPrice: 185000,
    location: 'Rak A1',
    updatedAt: '2026-11-12T09:00:00.000Z',
  },
  {
    id: 'sp-2',
    sku: 'IC-CAN-TJA1042',
    name: 'IC Transceiver CAN Bus TJA1042T',
    category: 'IC & Driver',
    unit: 'pcs',
    stock: 4,
    minStock: 6,
    unitPrice: 75000,
    location: 'Rak A2',
    updatedAt: '2026-11-12T11:10:00.000Z',
  },
  {
    id: 'sp-3',
    sku: 'REG-5V-LM2940',
    name: 'Voltage Regulator 5V Automotive LDO',
    category: 'Power & Regulator',
    unit: 'pcs',
    stock: 22,
    minStock: 8,
    unitPrice: 45000,
    location: 'Rak B1',
    updatedAt: '2026-11-10T14:20:00.000Z',
  },
  {
    id: 'sp-4',
    sku: 'RLY-OMRON-G8ND',
    name: 'Relay Dual Coil Omron G8ND-2S (BCM/EPS)',
    category: 'Relay & Sensor',
    unit: 'pcs',
    stock: 0,
    minStock: 5,
    unitPrice: 95000,
    location: 'Rak C1',
    updatedAt: '2026-11-11T16:10:00.000Z',
  },
  {
    id: 'sp-5',
    sku: 'CAP-SMD-47UF',
    name: 'Kapasitor Tantalum SMD 47uF 35V',
    category: 'Kapasitor & SMD',
    unit: 'pcs',
    stock: 48,
    minStock: 15,
    unitPrice: 12000,
    location: 'Laci SMD-03',
    updatedAt: '2026-11-09T10:00:00.000Z',
  },
  {
    id: 'sp-6',
    sku: 'MOS-IRF-3205',
    name: 'MOSFET Power Driver EPS / Genset IRF3205',
    category: 'Power & Regulator',
    unit: 'pcs',
    stock: 3,
    minStock: 5,
    unitPrice: 55000,
    location: 'Rak B3',
    updatedAt: '2026-11-11T13:00:00.000Z',
  },
];

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
  }>;
  _count: { serviceOrders: number };
}

export const INITIAL_CUSTOMERS: MockCustomerRow[] = [
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
    _count: { serviceOrders: 1 },
  },
  {
    id: 'c2',
    name: 'Pak Hendra',
    phone: '6289876544321',
    type: CustomerType.MITRA,
    workshopName: 'Wahana Retro',
    address: 'Jl. Sutisna Senjaya No. 88, Tasikmalaya',
    vehicles: [
      { id: 'v2', brand: 'Honda', model: 'Jazz RS GK5', year: 2019, plateNumber: 'D 5678 CD' },
    ],
    _count: { serviceOrders: 1 },
  },
  {
    id: 'c3',
    name: 'Deni Kurniawan',
    phone: '6281322119999',
    type: CustomerType.MITRA,
    workshopName: 'Kurnia',
    address: 'Jl. Perintis Kemerdekaan No. 12, Tasikmalaya',
    vehicles: [
      { id: 'v4', brand: 'Mitsubishi', model: 'Pajero Sport Dakar', year: 2017, plateNumber: 'Z 7301 DA' },
    ],
    _count: { serviceOrders: 1 },
  },
  {
    id: 'c4',
    name: 'Rina Marlina',
    phone: '6285299881234',
    type: CustomerType.PERORANGAN,
    workshopName: null,
    address: 'Perum Cisalak Permai Blok B2, Tasikmalaya',
    vehicles: [
      { id: 'v5', brand: 'Suzuki', model: 'All New Ertiga', year: 2019, plateNumber: 'Z 5520 TB' },
    ],
    _count: { serviceOrders: 1 },
  },
  {
    id: 'c5',
    name: 'CV Sinar Priangan',
    phone: '6282111226140',
    type: CustomerType.MITRA,
    workshopName: 'Merdeka Motor',
    address: 'Kawasan Industri Indihiang, Tasikmalaya',
    vehicles: [
      { id: 'v6', brand: 'Deep Sea', model: 'Genset Controller DSE7320', year: 2021, plateNumber: null },
    ],
    _count: { serviceOrders: 1 },
  },
];

function normalizePlateKey(plate?: string | null): string {
  return (plate || '').replace(/\s+/g, '').toUpperCase();
}

function makeVehicleKey(brand: string, model: string, plateNumber?: string | null): string {
  const plateKey = normalizePlateKey(plateNumber);
  if (plateKey) return `plate:${plateKey}`;
  return `model:${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}`;
}

function getCustomerKey(phone?: string | null, name?: string | null): string {
  const cleanName = (name || '').trim().toLowerCase();
  if (cleanName) return `name:${cleanName}`;
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone) return `phone:${cleanPhone}`;
  return 'unknown';
}

export function synchronizeDataset(
  rawOrders: MockServiceOrder[],
  baseCustomers: MockCustomerRow[] = INITIAL_CUSTOMERS
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const seenOrderIds = new Set<string>();
  const seenOrderCodes = new Set<string>();
  const orders: MockServiceOrder[] = [];

  for (const raw of rawOrders) {
    const cleanCode = (raw.code || '').trim();
    if (!raw.id || seenOrderIds.has(raw.id)) continue;
    if (cleanCode && seenOrderCodes.has(cleanCode)) continue;

    seenOrderIds.add(raw.id);
    if (cleanCode) seenOrderCodes.add(cleanCode);

    orders.push({
      ...raw,
      customerName: (raw.customerName || '').trim(),
      customerPhone: normalizePhone(raw.customerPhone),
      workshopName: normalizeWorkshopName(raw.workshopName, raw.customerType),
      vehicleBrand: (raw.vehicleBrand || '').trim(),
      vehicleModel: (raw.vehicleModel || '').trim(),
      plateNumber: raw.plateNumber ? raw.plateNumber.trim().toUpperCase() : null,
      items: (raw.items || []).map((item) => {
        const defaults = getDefaultBeforeAfter(item.moduleName, raw.unitCategory);
        return {
          ...item,
          beforePhotoUrl: item.beforePhotoUrl || defaults.beforePhotoUrl,
          afterPhotoUrl: item.afterPhotoUrl || defaults.afterPhotoUrl,
          beforeCaption: item.beforeCaption || defaults.beforeCaption,
          afterCaption: item.afterCaption || defaults.afterCaption,
        };
      }),
    });
  }

  const customerMap = new Map<string, MockCustomerRow>();
  const nameToKey = new Map<string, string>();
  const seenGlobalPlates = new Set<string>();
  const baseIdByKey = new Map<string, string>();

  for (const base of baseCustomers) {
    const k = getCustomerKey(base.phone, base.name);
    if (k && !baseIdByKey.has(k)) baseIdByKey.set(k, base.id);
    const nKey = base.name.trim().toLowerCase();
    if (nKey && !baseIdByKey.has(`name:${nKey}`)) baseIdByKey.set(`name:${nKey}`, base.id);
  }

  const registerCustomer = (
    incoming: {
      id: string;
      name: string;
      phone: string;
      type: CustomerType;
      workshopName: string | null;
      address: string | null;
      vehicles: MockCustomerRow['vehicles'];
    },
    preferIncomingFields: boolean
  ) => {
    const cleanName = incoming.name.trim();
    const cleanPhone = normalizePhone(incoming.phone);
    const nameKey = cleanName.toLowerCase();
    // Distinct customer name always maps to a separate customer record
    const resolvedKey = nameKey
      ? `name:${nameKey}`
      : cleanPhone
      ? `phone:${cleanPhone}`
      : incoming.id;

    const existing = customerMap.get(resolvedKey);
    const normalizedType = incoming.type || existing?.type || CustomerType.PERORANGAN;
    const normalizedWorkshop = normalizeWorkshopName(
      preferIncomingFields
        ? incoming.workshopName ?? existing?.workshopName
        : existing?.workshopName ?? incoming.workshopName,
      normalizedType
    );

    const mergedVehicles: MockCustomerRow['vehicles'] = [];
    const localVehicleKeys = new Set<string>();
    const vehiclePool = preferIncomingFields
      ? [...incoming.vehicles, ...(existing?.vehicles || [])]
      : [...(existing?.vehicles || []), ...incoming.vehicles];

    for (const v of vehiclePool) {
      const brand = (v.brand || '').trim();
      const model = (v.model || '').trim();
      if (!brand && !model) continue;
      const plateUpper = v.plateNumber ? v.plateNumber.trim().toUpperCase() : null;
      const vKey = makeVehicleKey(brand, model, plateUpper);
      if (localVehicleKeys.has(vKey)) continue;
      localVehicleKeys.add(vKey);
      mergedVehicles.push({
        id: v.id,
        brand,
        model,
        year: v.year ?? null,
        plateNumber: plateUpper,
      });
    }

    const record: MockCustomerRow = {
      id:
        existing?.id ||
        baseIdByKey.get(resolvedKey) ||
        (nameKey ? baseIdByKey.get(`name:${nameKey}`) : undefined) ||
        incoming.id,
      name: preferIncomingFields ? cleanName || existing?.name || 'Pelanggan' : existing?.name || cleanName || 'Pelanggan',
      phone: preferIncomingFields ? cleanPhone || existing?.phone || '' : existing?.phone || cleanPhone || '',
      type: normalizedType,
      workshopName: normalizedWorkshop,
      address: preferIncomingFields ? incoming.address || existing?.address || null : existing?.address || incoming.address || null,
      vehicles: mergedVehicles,
      _count: { serviceOrders: 0 },
    };

    customerMap.set(resolvedKey, record);
    if (nameKey) nameToKey.set(nameKey, resolvedKey);
  };

  // Prioritize orders so latest edits/intakes win over stale base customer snapshots
  for (const ord of orders) {
    registerCustomer(
      {
        id: `cust-${ord.id}`,
        name: ord.customerName,
        phone: ord.customerPhone,
        type: ord.customerType,
        workshopName: ord.workshopName ?? null,
        address: null,
        vehicles:
          ord.vehicleBrand || ord.vehicleModel
            ? [
                {
                  id: `veh-${ord.id}`,
                  brand: ord.vehicleBrand,
                  model: ord.vehicleModel,
                  year: ord.vehicleYear,
                  plateNumber: ord.plateNumber ?? null,
                },
              ]
            : [],
      },
      true
    );
  }

  for (const base of baseCustomers) {
    registerCustomer(
      {
        id: base.id,
        name: base.name,
        phone: base.phone,
        type: base.type,
        workshopName: base.workshopName,
        address: base.address,
        vehicles: base.vehicles,
      },
      false
    );
  }

  // Enforce global plate uniqueness & compute exact serviceOrders count per customer
  const customers: MockCustomerRow[] = Array.from(customerMap.values()).map((cust) => {
    const uniqueVehicles: MockCustomerRow['vehicles'] = [];
    for (const v of cust.vehicles) {
      const plateKey = normalizePlateKey(v.plateNumber);
      if (plateKey) {
        if (seenGlobalPlates.has(plateKey)) continue;
        seenGlobalPlates.add(plateKey);
      }
      uniqueVehicles.push(v);
    }

    const custPhone = normalizePhone(cust.phone);
    const custName = cust.name.trim().toLowerCase();
    const orderCount = orders.filter((ord) => {
      const ordPhone = normalizePhone(ord.customerPhone);
      if (custPhone && ordPhone) return ordPhone === custPhone;
      return ord.customerName.trim().toLowerCase() === custName;
    }).length;

    return {
      ...cust,
      vehicles: uniqueVehicles,
      _count: { serviceOrders: orderCount },
    };
  });

  return { orders, customers };
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
  } | null;
}

export function applyUpsertOrder(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  incomingOrder: MockServiceOrder
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const prevOrder = currentOrders.find((o) => o.id === incomingOrder.id);
  const oldPhone = prevOrder ? normalizePhone(prevOrder.customerPhone) : '';
  const newPhone = normalizePhone(incomingOrder.customerPhone);
  const filteredOrders = currentOrders.filter((o) => o.id !== incomingOrder.id);

  // Sync phone/name change across other orders of the same customer if phone changed during edit
  const propagatedOrders =
    prevOrder && oldPhone && newPhone && oldPhone !== newPhone
      ? filteredOrders.map((o) =>
          normalizePhone(o.customerPhone) === oldPhone
            ? {
                ...o,
                customerName: incomingOrder.customerName,
                customerPhone: newPhone,
                customerType: incomingOrder.customerType,
                workshopName: normalizeWorkshopName(
                  incomingOrder.workshopName,
                  incomingOrder.customerType
                ),
              }
            : o
        )
      : filteredOrders;

  const updatedCustomers = currentCustomers.map((c) => {
    const cPhone = normalizePhone(c.phone);
    if ((oldPhone && cPhone === oldPhone) || (newPhone && cPhone === newPhone)) {
      return {
        ...c,
        name: incomingOrder.customerName.trim() || c.name,
        phone: newPhone || c.phone,
        type: incomingOrder.customerType,
        workshopName: normalizeWorkshopName(
          incomingOrder.workshopName,
          incomingOrder.customerType
        ),
      };
    }
    return c;
  });

  return synchronizeDataset([incomingOrder, ...propagatedOrders], updatedCustomers);
}

export function applyDeleteOrder(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  orderId: string
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const remainingOrders = currentOrders.filter((o) => o.id !== orderId);
  return synchronizeDataset(remainingOrders, currentCustomers);
}

export function applyUpsertCustomer(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  payload: UpsertCustomerPayload
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const cleanPhone = normalizePhone(payload.phone);
  const oldPhone = normalizePhone(payload.previousPhone || payload.phone);
  const cleanName = payload.name.trim();
  const resolvedType = payload.type || CustomerType.PERORANGAN;
  const resolvedWorkshop = normalizeWorkshopName(payload.workshopName, resolvedType);

  const matchedCustomer = currentCustomers.find(
    (c) =>
      (payload.id && c.id === payload.id) ||
      (oldPhone && normalizePhone(c.phone) === oldPhone) ||
      (cleanPhone && normalizePhone(c.phone) === cleanPhone) ||
      c.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  const newVehicle =
    payload.vehicle && payload.vehicle.brand.trim() && payload.vehicle.model.trim()
      ? [
          {
            id: `veh-${Date.now()}`,
            brand: payload.vehicle.brand.trim(),
            model: payload.vehicle.model.trim(),
            year: payload.vehicle.year ?? null,
            plateNumber: payload.vehicle.plateNumber
              ? payload.vehicle.plateNumber.trim().toUpperCase()
              : null,
          },
        ]
      : [];

  const updatedCustomer: MockCustomerRow = {
    id: matchedCustomer?.id || payload.id || `cust-${Date.now()}`,
    name: cleanName || matchedCustomer?.name || 'Pelanggan',
    phone: cleanPhone || matchedCustomer?.phone || '',
    type: resolvedType,
    workshopName: resolvedWorkshop,
    address:
      payload.address !== undefined
        ? payload.address?.trim() || null
        : matchedCustomer?.address || null,
    vehicles: [...newVehicle, ...(matchedCustomer?.vehicles || [])],
    _count: { serviceOrders: matchedCustomer?._count.serviceOrders || 0 },
  };

  // Propagate customer updates to matching service orders so dashboard/services/reports stay in sync
  const updatedOrders = currentOrders.map((ord) => {
    const ordPhone = normalizePhone(ord.customerPhone);
    const sameCustomer =
      (oldPhone && ordPhone === oldPhone) ||
      (cleanPhone && ordPhone === cleanPhone) ||
      (matchedCustomer && ord.customerName.trim().toLowerCase() === matchedCustomer.name.trim().toLowerCase());

    if (!sameCustomer) return ord;
    return {
      ...ord,
      customerName: updatedCustomer.name,
      customerPhone: updatedCustomer.phone || ord.customerPhone,
      customerType: updatedCustomer.type,
      workshopName: updatedCustomer.workshopName,
    };
  });

  const remainingCustomers = currentCustomers.filter((c) => c.id !== updatedCustomer.id);
  return synchronizeDataset(updatedOrders, [updatedCustomer, ...remainingCustomers]);
}

export function applyAddVehicle(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  customerId: string,
  vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null }
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const updatedCustomers = currentCustomers.map((c) => {
    if (c.id !== customerId) return c;
    return {
      ...c,
      vehicles: [
        {
          id: `veh-${Date.now()}`,
          brand: vehicle.brand.trim(),
          model: vehicle.model.trim(),
          year: vehicle.year ?? null,
          plateNumber: vehicle.plateNumber ? vehicle.plateNumber.trim().toUpperCase() : null,
        },
        ...c.vehicles,
      ],
    };
  });
  return synchronizeDataset(currentOrders, updatedCustomers);
}

