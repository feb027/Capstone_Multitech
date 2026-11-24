import { ItemStatus } from '@prisma/client';
import { MockServiceOrder, normalizePhone } from '@/lib/frontend-mock';
import { getStatusMeta, WORKSHOP_PROFILE } from '@/lib/status';

export const STATUS_FILTER_OPTIONS: Array<{ value: 'ALL' | ItemStatus; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: ItemStatus.DITERIMA, label: 'Diterima' },
  { value: ItemStatus.DIAGNOSA, label: 'Diagnosa' },
  { value: ItemStatus.MENUNGGU_PERSETUJUAN, label: 'Konfirmasi Biaya' },
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

async function compressImageFile(file: File): Promise<{ blob: Blob; filename: string; dataUrl: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, atau WebP).');
  }

  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal memproses file gambar.'));
      }
    };
    reader.readAsDataURL(file);
  });

  const compressedUrl = await new Promise<string>((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(rawUrl);
    img.onload = () => {
      const maxDim = 1280;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const webpUrl = canvas.toDataURL('image/webp', 0.78);
      if (webpUrl.startsWith('data:image/webp') && webpUrl.length < rawUrl.length) {
        resolve(webpUrl);
        return;
      }
      const jpegUrl = canvas.toDataURL('image/jpeg', 0.78);
      resolve(jpegUrl.length < rawUrl.length ? jpegUrl : rawUrl);
    };
    img.src = rawUrl;
  });

  const mimeMatch = compressedUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  const mime = mimeMatch?.[1] || file.type || 'image/webp';
  const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'service-photo';

  const res = await fetch(compressedUrl);
  const blob = await res.blob();
  return {
    blob,
    filename: `${baseName}.${ext}`,
    dataUrl: compressedUrl,
  };
}

export function readFileAsDataUrl(
  file: File,
  onDone: (dataUrl: string) => void,
  onError?: (message: string) => void
) {
  compressImageFile(file)
    .then((result) => onDone(result.dataUrl))
    .catch((err) => onError?.(err instanceof Error ? err.message : 'Gagal memproses file gambar.'));
}

export async function uploadServicePhoto(file: File): Promise<string> {
  const { blob, filename } = await compressImageFile(file);
  if (blob.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran gambar setelah kompresi masih melebihi 2 MB.');
  }

  const formData = new FormData();
  formData.append('file', blob, filename);

  const response = await fetch('/api/media', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !data?.url) {
    throw new Error(data?.error || 'Gagal mengunggah foto ke penyimpanan server.');
  }

  return data.url;
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
