import { ItemStatus } from '@prisma/client';

export interface StatusMeta {
  key: ItemStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotClass: string;
}

export const ITEM_STATUS_LIST: StatusMeta[] = [
  {
    key: ItemStatus.DITERIMA,
    label: 'Diterima',
    shortLabel: 'Diterima',
    badgeClass:
      'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]',
    dotClass: 'bg-[#475569] dark:bg-[#94A3B8]',
  },
  {
    key: ItemStatus.DIAGNOSA,
    label: 'Diagnosa',
    shortLabel: 'Diagnosa',
    badgeClass:
      'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#451A03] dark:text-[#FCD34D] dark:border-[#78350F]',
    dotClass: 'bg-[#B45309] dark:bg-[#FCD34D]',
  },
  {
    key: ItemStatus.MENUNGGU_PERSETUJUAN,
    label: 'Konfirmasi Biaya',
    shortLabel: 'Konfirmasi',
    badgeClass:
      'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] dark:bg-[#451A03] dark:text-[#FCD34D] dark:border-[#78350F]',
    dotClass: 'bg-[#D97706] dark:bg-[#FCD34D]',
  },
  {
    key: ItemStatus.MENUNGGU_SPAREPART,
    label: 'Tunggu Komponen',
    shortLabel: 'Sparepart',
    badgeClass:
      'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA] dark:bg-[#431407] dark:text-[#FDBA74] dark:border-[#7C2D12]',
    dotClass: 'bg-[#C2410C] dark:bg-[#FDBA74]',
  },
  {
    key: ItemStatus.PERBAIKAN,
    label: 'Perbaikan',
    shortLabel: 'Pengerjaan',
    badgeClass:
      'bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE] dark:bg-[#1E1B4B] dark:text-[#A5B4FC] dark:border-[#312E81]',
    dotClass: 'bg-[#4338CA] dark:bg-[#A5B4FC]',
  },
  {
    key: ItemStatus.UJI_QC,
    label: 'Uji / QC',
    shortLabel: 'Uji & QC',
    badgeClass:
      'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF] dark:bg-[#3B0764] dark:text-[#D8B4FE] dark:border-[#581C87]',
    dotClass: 'bg-[#7E22CE] dark:bg-[#D8B4FE]',
  },
  {
    key: ItemStatus.SIAP_DIAMBIL,
    label: 'Siap Diambil',
    shortLabel: 'Siap Ambil',
    badgeClass:
      'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0] dark:bg-[#052E16] dark:text-[#86EFAC] dark:border-[#14532D]',
    dotClass: 'bg-[#15803D] dark:bg-[#86EFAC]',
  },
  {
    key: ItemStatus.SELESAI,
    label: 'Selesai',
    shortLabel: 'Selesai',
    badgeClass:
      'bg-[#E2E8F0] text-[#0F172A] border-[#CBD5E1] dark:bg-[#1F2937] dark:text-[#F9FAFB] dark:border-[#374151]',
    dotClass: 'bg-[#0F172A] dark:bg-[#F9FAFB]',
  },
  {
    key: ItemStatus.BATAL,
    label: 'Dibatalkan',
    shortLabel: 'Batal',
    badgeClass:
      'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#450A0A] dark:text-[#FCA5A5] dark:border-[#7F1D1D]',
    dotClass: 'bg-[#B91C1C] dark:bg-[#FCA5A5]',
  },
];

export function getStatusMeta(status: ItemStatus): StatusMeta {
  return (
    ITEM_STATUS_LIST.find((item) => item.key === status) ?? {
      key: status,
      label: status,
      shortLabel: status,
      badgeClass:
        'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]',
      dotClass: 'bg-[#475569] dark:bg-[#94A3B8]',
    }
  );
}

export const PROGRESS_STEPS = [
  { key: ItemStatus.DITERIMA, label: 'Diterima' },
  { key: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { key: ItemStatus.PERBAIKAN, label: 'Perbaikan' },
  { key: ItemStatus.UJI_QC, label: 'Uji / QC' },
  { key: ItemStatus.SIAP_DIAMBIL, label: 'Siap Ambil' },
];

export function getProgressStepIndex(status: ItemStatus): number {
  switch (status) {
    case ItemStatus.DITERIMA:
      return 0;
    case ItemStatus.DIAGNOSA:
    case ItemStatus.MENUNGGU_PERSETUJUAN:
    case ItemStatus.MENUNGGU_SPAREPART:
      return 1;
    case ItemStatus.PERBAIKAN:
      return 2;
    case ItemStatus.UJI_QC:
      return 3;
    case ItemStatus.SIAP_DIAMBIL:
    case ItemStatus.SELESAI:
      return 4;
    default:
      return 0;
  }
}

export const WORKSHOP_PROFILE = {
  name: 'CV Multitech',
  city: 'Tasikmalaya',
  address:
    'Jl. Noenoeng Tisnasaputra, Kahuripan, Kec. Tawang, Kab. Tasikmalaya, Jawa Barat 46115',
  focus:
    'Bengkel Spesialis Perbaikan Elektronik Otomotif (ECU, BCM, EPS, Digital Speedometer) & Modul Genset/Industri',
  whatsappNumber: '6281234567890',
};

export function getVehicleHeroImage(
  brand?: string | null,
  model?: string | null,
  unitCategory?: string
): {
  src: string;
  caption: string;
  badge: string;
} {
  const fullName = `${brand || ''} ${model || ''}`.trim();
  const normalized = fullName.toLowerCase();

  if (
    unitCategory === 'GENSET_INDUSTRI' ||
    normalized.includes('genset') ||
    normalized.includes('deep sea') ||
    normalized.includes('dse')
  ) {
    return {
      src: '/images/vehicles/genset-unit.jpg',
      caption: fullName || 'Unit Genset / Panel AMF',
      badge: 'Foto Unit Genset',
    };
  }

  if (normalized.includes('pajero') || normalized.includes('fortuner') || normalized.includes('cr-v') || normalized.includes('rush') || normalized.includes('terios')) {
    return {
      src: '/images/vehicles/pajero-sport.jpg',
      caption: fullName || 'Unit SUV / Mobil',
      badge: 'Foto Kendaraan',
    };
  }

  if (normalized.includes('jazz') || normalized.includes('brio') || normalized.includes('yaris') || normalized.includes('agya') || normalized.includes('ayla') || normalized.includes('swift')) {
    return {
      src: '/images/vehicles/honda-jazz.jpg',
      caption: fullName || 'Unit Hatchback / Mobil',
      badge: 'Foto Kendaraan',
    };
  }

  if (normalized.includes('ertiga') || normalized.includes('xl7') || normalized.includes('suzuki') || normalized.includes('xpander') || normalized.includes('livina')) {
    return {
      src: '/images/vehicles/suzuki-ertiga.jpg',
      caption: fullName || 'Unit MPV / Mobil',
      badge: 'Foto Kendaraan',
    };
  }

  return {
    src: '/images/vehicles/toyota-avanza.jpg',
    caption: fullName || 'Unit Kendaraan Servis',
    badge: 'Foto Kendaraan',
  };
}

export function getUnitModelImage(moduleName?: string, unitCategory?: string): {
  src: string;
  caption: string;
} {
  const name = (moduleName || '').toLowerCase();
  if (unitCategory === 'GENSET_INDUSTRI' || name.includes('genset') || name.includes('amf') || name.includes('dse')) {
    return {
      src: '/images/units/genset-dse7320.png',
      caption: 'Panel Kontrol Genset / AMF',
    };
  }
  if (name.includes('speedo') || name.includes('cluster') || name.includes('odometer')) {
    return {
      src: '/images/units/speedometer-cluster.jpg',
      caption: 'Unit Speedometer / Instrument Cluster',
    };
  }
  if (name.includes('eps') || name.includes('bcm') || name.includes('steering') || name.includes('body')) {
    return {
      src: '/images/units/eps-bcm-module.jpg',
      caption: 'Modul EPS / BCM Kelistrikan',
    };
  }
  return {
    src: '/images/units/ecu-module.jpg',
    caption: 'Modul ECU (Engine Control Unit)',
  };
}
