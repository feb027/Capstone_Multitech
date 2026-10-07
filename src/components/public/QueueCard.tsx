import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { ItemStatus } from '@prisma/client';

export interface QueueCardProps {
  publicId: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  intakeType: 'MOBIL_UTUH' | 'MODUL_SAJA';
  receivedAt: Date | string;
  items: {
    id: string;
    moduleName: string;
    status: ItemStatus;
  }[];
}

function getStatusBadge(status: ItemStatus) {
  switch (status) {
    case 'DITERIMA':
      return {
        label: 'Diterima',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'DIAGNOSA':
      return {
        label: 'Diagnosa',
        className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
      };
    case 'MENUNGGU_PERSETUJUAN':
      return {
        label: 'Menunggu Persetujuan',
        className: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
      };
    case 'MENUNGGU_SPAREPART':
      return {
        label: 'Tunggu Komponen',
        className: 'bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900',
      };
    case 'PERBAIKAN':
      return {
        label: 'Perbaikan / Solder',
        className: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900',
      };
    case 'UJI_QC':
      return {
        label: 'Uji & Kalibrasi',
        className: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900',
      };
    case 'SIAP_DIAMBIL':
      return {
        label: 'Siap Diambil',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
      };
    case 'BATAL':
      return {
        label: 'Dibatalkan',
        className: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}

export function QueueCard({
  publicId,
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  intakeType,
  receivedAt,
  items,
}: QueueCardProps) {
  const title =
    vehicleBrand && vehicleModel
      ? `${vehicleBrand} ${vehicleModel} ${vehicleYear ? `(${vehicleYear})` : ''}`
      : 'Modul Servis (Tanpa Data Mobil)';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle transition-all duration-200 hover:border-slate-300 hover:shadow-card dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        {/* Header Kartu: Tanggal & Tipe */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium tracking-wide">
            Masuk: {formatDate(receivedAt)}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {intakeType === 'MOBIL_UTUH' ? 'Mobil Utuh' : 'Modul Saja'}
          </span>
        </div>

        {/* Judul Kendaraan */}
        <h3 className="mt-3 text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>

        {/* Daftar Modul & Status */}
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2 text-xs dark:bg-slate-800/50"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.moduleName}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tombol Aksi Akses Cek Progres */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <Link
          href={`/cek?p=${publicId}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-navy py-2.5 text-center text-xs font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
        >
          Cek Progres Detail
        </Link>
      </div>
    </div>
  );
}
