import Link from 'next/link';
import { ItemStatus } from '@prisma/client';

export interface QueueItem {
  id: string;
  moduleName: string;
  status: ItemStatus;
}

export interface QueueCardProps {
  publicId: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  intakeType: 'MOBIL_UTUH' | 'MODUL_SAJA';
  receivedAt: Date | string;
  items: QueueItem[];
}

function getStatusStyle(status: ItemStatus) {
  switch (status) {
    case 'DITERIMA':
      return {
        label: 'Diterima',
        bg: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
    case 'DIAGNOSA':
      return {
        label: 'Diagnosa',
        bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'MENUNGGU_PERSETUJUAN':
      return {
        label: 'Konfirmasi',
        bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'MENUNGGU_SPAREPART':
      return {
        label: 'Tunggu Komponen',
        bg: 'bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-400',
        dot: 'bg-orange-500',
      };
    case 'PERBAIKAN':
      return {
        label: 'Perbaikan',
        bg: 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400',
        dot: 'bg-blue-500 animate-pulse',
      };
    case 'UJI_QC':
      return {
        label: 'Uji Kalibrasi',
        bg: 'bg-purple-500/10 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400',
        dot: 'bg-purple-500',
      };
    case 'SIAP_DIAMBIL':
      return {
        label: 'Siap Diambil',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

function formatRelativeTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Masuk hari ini';
  if (diffDays === 1) return 'Masuk kemarin';
  return `${diffDays} hari lalu`;
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
      ? `${vehicleBrand} ${vehicleModel}`
      : 'Modul Lepasan';

  const sub = vehicleYear ? `${vehicleYear}` : intakeType === 'MOBIL_UTUH' ? 'Unit Mobil' : 'Kirim Ekspedisi';

  return (
    <Link
      href={`/cek?p=${publicId}`}
      className="group block rounded-[24px] border border-black/[0.04] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] dark:border-white/[0.06] dark:bg-[#1C1C1E]"
    >
      {/* Card Header: Vehicle & Time */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {sub} • {formatRelativeTime(receivedAt)}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {items.length} Modul
        </span>
      </div>

      {/* Module Chips with Apple status dots */}
      <div className="mt-3.5 space-y-1.5">
        {items.map((item) => {
          const style = getStatusStyle(item.status);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs transition-colors dark:bg-white/[0.04]"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                {item.moduleName}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
