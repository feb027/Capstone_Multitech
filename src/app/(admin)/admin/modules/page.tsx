import { prisma } from '@/lib/db';
import { ModuleTypeForm } from './ModuleTypeForm';
import { toggleModuleTypeAction } from './actions';

const FALLBACK_MODULES = [
  { id: 'm1', name: 'ECU (Engine Control Unit)', description: 'Komputer utama mesin & injeksi', defaultWarrantyMonths: 3, isActive: true, _count: { serviceItems: 14 } },
  { id: 'm2', name: 'BCM (Body Control Module)', description: 'Kelistrikan bodi, lampu & central lock', defaultWarrantyMonths: 2, isActive: true, _count: { serviceItems: 8 } },
  { id: 'm3', name: 'EPS (Electric Power Steering)', description: 'Modul motor power steering elektrik', defaultWarrantyMonths: 3, isActive: true, _count: { serviceItems: 9 } },
  { id: 'm4', name: 'Speedometer / Cluster', description: 'Panel instrumen, jarum, LCD & odometer', defaultWarrantyMonths: 1, isActive: true, _count: { serviceItems: 12 } },
  { id: 'm5', name: 'ABS Module', description: 'Modul kontrol rem anti-lock braking', defaultWarrantyMonths: 2, isActive: true, _count: { serviceItems: 4 } },
  { id: 'm6', name: 'TCM (Transmission Control)', description: 'Modul kontrol transmisi matik/CVT', defaultWarrantyMonths: 3, isActive: true, _count: { serviceItems: 5 } },
];

async function getModuleTypes() {
  try {
    const modules = await prisma.moduleType.findMany({
      include: {
        _count: {
          select: { serviceItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return modules.length > 0 ? modules : FALLBACK_MODULES;
  } catch {
    return FALLBACK_MODULES;
  }
}

export default async function ModuleTypesPage() {
  const moduleTypes = await getModuleTypes();

  return (
    <div className="mx-auto max-w-lg px-5 pt-4 sm:max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Jenis Modul
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Katalog komponen servis elektronika
          </p>
        </div>
        <ModuleTypeForm />
      </div>

      <div className="mt-5 space-y-2.5">
        {moduleTypes.map((mt) => (
          <div
            key={mt.id}
            className="flex items-center justify-between rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {mt.name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mt.isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}
                >
                  {mt.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {mt.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                {mt.defaultWarrantyMonths} bln
              </span>
              <form
                action={async () => {
                  'use server';
                  await toggleModuleTypeAction(mt.id, mt.isActive);
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-[#F2F2F7] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 tap-bounce dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                >
                  {mt.isActive ? 'Ubah' : 'Aktifkan'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
