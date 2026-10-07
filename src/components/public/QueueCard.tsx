import { ItemStatus } from '@prisma/client';
import { ArrowUpRight, Cpu } from 'lucide-react';

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
  onSelect?: () => void;
}

function getStatusBadge(status: ItemStatus) {
  switch (status) {
    case 'DITERIMA':
      return {
        label: 'Diterima',
        bg: 'bg-slate-500/10 text-slate-700 dark:bg-white/10 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
    case 'DIAGNOSA':
      return {
        label: 'Diagnosa',
        bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'MENUNGGU_PERSETUJUAN':
      return {
        label: 'Konfirmasi',
        bg: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'MENUNGGU_SPAREPART':
      return {
        label: 'Tunggu Komponen',
        bg: 'bg-orange-500/10 text-orange-700 dark:bg-orange-400/15 dark:text-orange-400',
        dot: 'bg-orange-500',
      };
    case 'PERBAIKAN':
      return {
        label: 'Perbaikan',
        bg: 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400',
        dot: 'bg-blue-500',
      };
    case 'UJI_QC':
      return {
        label: 'Uji Kalibrasi',
        bg: 'bg-purple-500/10 text-purple-700 dark:bg-purple-400/15 dark:text-purple-400',
        dot: 'bg-purple-500',
      };
    case 'SIAP_DIAMBIL':
      return {
        label: 'Siap Diambil',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10 text-slate-700 dark:bg-white/10 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

export function QueueCard({
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  intakeType,
  items,
  onSelect,
}: QueueCardProps) {
  const brandTitle =
    vehicleBrand && vehicleModel
      ? `${vehicleBrand} ${vehicleModel}`
      : 'Modul Lepasan';

  const subInfo = vehicleYear
    ? `${vehicleYear}`
    : intakeType === 'MOBIL_UTUH'
    ? 'Mobil'
    : 'Modul';

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer overflow-hidden rounded-[26px] border border-black/[0.05] bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:hover:border-white/20"
    >
      {/* Top Header: Car Title & Arrow Action */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#E63946]">
              {vehicleBrand || 'MODUL'}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {subInfo}
            </span>
          </div>

          <h3 className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            {brandTitle}
          </h3>
        </div>

        {/* Apple-style action button */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#0B2545] group-hover:text-white dark:bg-white/10 dark:text-slate-300 dark:group-hover:bg-white dark:group-hover:text-black">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Module Chips with status dots */}
      <div className="mt-3.5 space-y-1.5">
        {items.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs transition-colors dark:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <Cpu className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.moduleName}
                </span>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.bg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
