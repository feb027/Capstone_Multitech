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
  { id: 'm7', name: 'Modul Kontrol Genset / AMF', description: 'Panel kontrol genset & sistem industri', defaultWarrantyMonths: 2, isActive: true, _count: { serviceItems: 3 } },
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Katalog Jenis Modul
          </h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Daftar modul elektronika otomotif & genset beserta masa garansi standar.
          </p>
        </div>
        <ModuleTypeForm />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {moduleTypes.map((mt) => (
          <div
            key={mt.id}
            className="flex items-center justify-between gap-3 rounded-[24px] border border-black/[0.04] bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {mt.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    mt.isActive
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {mt.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              {mt.description && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {mt.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
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
                  className="inline-flex min-h-[44px] items-center rounded-full bg-[#F2F2F7] px-4 text-xs font-semibold text-slate-900 hover:bg-slate-200/70 tap-bounce dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {mt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
