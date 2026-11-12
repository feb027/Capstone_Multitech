import { ItemStatus } from '@prisma/client';
import { ArrowUpRight, Cpu } from 'lucide-react';
import { getStatusMeta } from '@/lib/status';

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
  unitCategory?: 'OTOMOTIF' | 'GENSET_INDUSTRI';
  receivedAt: Date | string;
  items: QueueItem[];
  onSelect?: () => void;
}

export function QueueCard({
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  intakeType,
  unitCategory,
  items,
  onSelect,
}: QueueCardProps) {
  const brandTitle =
    vehicleBrand && vehicleModel
      ? `${vehicleBrand} ${vehicleModel}`
      : 'Modul Lepasan';

  const subInfo =
    unitCategory === 'GENSET_INDUSTRI'
      ? vehicleYear
        ? `${vehicleYear} · Genset / Industri`
        : 'Genset / Industri'
      : vehicleYear
      ? `${vehicleYear}`
      : intakeType === 'MOBIL_UTUH'
      ? 'Mobil'
      : 'Modul';

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full cursor-pointer overflow-hidden rounded-[26px] border border-black/[0.05] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:hover:border-white/20"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#C9182B] dark:text-[#F87171]">
              {vehicleBrand || 'MODUL'}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-600" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              {subInfo}
            </span>
          </div>

          <h3 className="mt-1 text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            {brandTitle}
          </h3>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-[#0B2545] group-hover:text-white dark:bg-white/10 dark:text-slate-300 dark:group-hover:bg-white dark:group-hover:text-black">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5">
        {items.map((item) => {
          const badge = getStatusMeta(item.status);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-[#F2F2F7] px-3 py-2 text-xs transition-colors dark:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-2 pr-2">
                <Cpu className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                  {item.moduleName}
                </span>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} aria-hidden="true" />
                {badge.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}
