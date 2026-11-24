import { ItemStatus } from '@prisma/client';
import { MockServiceOrder, normalizePhone } from '@/lib/frontend-mock';
import { getStatusMeta, WORKSHOP_PROFILE } from '@/lib/status';

export const STATUS_FILTER_OPTIONS: Array<{ value: 'ALL' | ItemStatus; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: ItemStatus.DITERIMA, label: 'Diterima' },
  { value: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { value: ItemStatus.MENUNGGU_SPAREPART, label: 'Tunggu Komponen' },
  { value: ItemStatus.PERBAIKAN, label: 'Pengerjaan' },
  { value: ItemStatus.UJI_QC, label: 'Uji & QC' },
  { value: ItemStatus.SIAP_DIAMBIL, label: 'Siap Diambil' },
  { value: ItemStatus.SELESAI, label: 'Selesai' },
  { value: ItemStatus.BATAL, label: 'Dibatalkan' },
];

export type IntakeChoice = 'MOBIL_UTUH' | 'MODUL_SAJA' | 'GENSET_INDUSTRI';

export const INTAKE_CHOICES: Array<{ value: IntakeChoice; label: string; hint: string }> = [
  { value: 'MOBIL_UTUH', label: 'Mobil Utuh', hint: 'Unit kendaraan masuk bengkel' },
  { value: 'MODUL_SAJA', label: 'Modul Saja', hint: 'Modul lepasan / kirim ekspedisi' },
  { value: 'GENSET_INDUSTRI', label: 'Genset / Industri', hint: 'Panel AMF / controller genset' },
];

export const VEHICLE_PRESETS: Array<{
  label: string;
  brand: string;
  model: string;
  year: string;
  choice: IntakeChoice;
}> = [
  { label: 'Toyota Avanza', brand: 'Toyota', model: 'Avanza 1.3 Veloz', year: '2018', choice: 'MOBIL_UTUH' },
  { label: 'Honda Jazz', brand: 'Honda', model: 'Jazz RS GK5', year: '2019', choice: 'MOBIL_UTUH' },
  { label: 'Mitsubishi Pajero', brand: 'Mitsubishi', model: 'Pajero Sport Dakar', year: '2017', choice: 'MOBIL_UTUH' },
  { label: 'Suzuki Ertiga', brand: 'Suzuki', model: 'Ertiga GX', year: '2019', choice: 'MOBIL_UTUH' },
  { label: 'Genset DSE', brand: 'Deep Sea', model: 'Genset Controller DSE', year: '2021', choice: 'GENSET_INDUSTRI' },
];

export function calcTotalPaid(order: MockServiceOrder): number {
  return (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

export function calcTotalCharges(order: MockServiceOrder): number {
  return (order.charges || []).reduce((sum, c) => sum + c.qty * c.unitPrice, 0);
}

export function getActiveWorkInfo(order: MockServiceOrder) {
  const activeItem =
    order.items.find(
      (it) => it.status !== ItemStatus.SELESAI && it.status !== ItemStatus.BATAL
    ) || order.items[0];

  const latestLog = activeItem?.logs?.[0];
  let workText = '';
  if (latestLog?.note) {
    workText = latestLog.note.replace(/^\[[^\]]+\]\s*/, '').trim();
  }

  if (!workText) {
    workText = activeItem?.complaint || order.conditionNotes || 'Pemeriksaan modul di meja teknisi.';
  }

  return {
    activeItem,
    workText,
  };
}

export function readFileAsDataUrl(file: File, onDone: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onDone(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

export function getWaLink(order: MockServiceOrder) {
  const waNumber = normalizePhone(order.customerPhone);
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const primaryItem = order.items[0];
  const statusLabel = primaryItem ? getStatusMeta(primaryItem.status).label : '';
  const msg = `Halo ${order.customerName}, update dari ${WORKSHOP_PROFILE.name} untuk unit ${order.vehicleBrand || ''} ${order.vehicleModel || ''} (Kode: #${order.code}). Status saat ini: ${statusLabel}. Pantau progres langsung di: ${origin}/track/${order.publicId}`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}
