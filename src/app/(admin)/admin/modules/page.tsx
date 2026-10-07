import { prisma } from '@/lib/db';
import { ModuleTypeForm } from './ModuleTypeForm';
import { toggleModuleTypeAction } from './actions';

async function getModuleTypes() {
  try {
    return await prisma.moduleType.findMany({
      include: {
        _count: {
          select: { serviceItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('Failed to query module types:', err);
    return [];
  }
}

export default async function ModuleTypesPage() {
  const moduleTypes = await getModuleTypes();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Katalog Jenis Modul Elektronik
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar komponen yang dapat dipilih saat penerimaan unit servis
          </p>
        </div>
        <ModuleTypeForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Nama Modul</th>
                <th className="px-5 py-3 font-semibold">Deskripsi</th>
                <th className="px-5 py-3 font-semibold">Garansi Default</th>
                <th className="px-5 py-3 font-semibold">Total Dikerjakan</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {moduleTypes.map((mt) => (
                <tr key={mt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                    {mt.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {mt.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {mt.defaultWarrantyMonths} Bulan
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {mt._count.serviceItems} Unit
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        mt.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {mt.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <form
                      action={async () => {
                        'use server';
                        await toggleModuleTypeAction(mt.id, mt.isActive);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {mt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
