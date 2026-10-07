import { prisma } from '@/lib/db';
import Link from 'next/link';
import { ItemStatus } from '@prisma/client';
import { PlusCircle, Wrench, Clock, CheckCircle2 } from 'lucide-react';

async function getDashboardData() {
  try {
    const [totalActive, totalCustomers, totalModules, itemsByStatus] = await Promise.all([
      prisma.serviceOrder.count({
        where: {
          items: {
            some: {
              status: {
                notIn: [ItemStatus.SELESAI, ItemStatus.BATAL],
              },
            },
          },
        },
      }),
      prisma.customer.count(),
      prisma.moduleType.count({ where: { isActive: true } }),
      prisma.serviceItem.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of itemsByStatus) {
      statusCounts[item.status] = item._count.id;
    }

    return {
      totalActive,
      totalCustomers,
      totalModules,
      statusCounts,
    };
  } catch (err) {
    console.error('Failed to get dashboard stats:', err);
    return {
      totalActive: 0,
      totalCustomers: 0,
      totalModules: 0,
      statusCounts: {},
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Header section with Title & CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Dashboard Operasional
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ringkasan antrean servis modul elektronik Multitech
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-light active:scale-[0.98] dark:bg-crimson dark:hover:bg-crimson-hover"
        >
          <PlusCircle className="h-4 w-4" />
          Penerimaan Servis Baru
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Unit Aktif Diproses
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {data.totalActive}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Sedang dalam tahap perbaikan / pengujian
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pelanggan Terdaftar
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {data.totalCustomers}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Perorangan & bengkel mitra terdaftar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Katalog Jenis Modul
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {data.totalModules}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            ECU, BCM, EPS, Speedometer, dll.
          </p>
        </div>
      </div>

      {/* Status Breakdown Kanban Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Distribusi Tahapan Modul
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diterima</span>
            <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-200">
              {data.statusCounts['DITERIMA'] || 0}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Diagnosa</span>
            <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
              {data.statusCounts['DIAGNOSA'] || 0}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-center dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Perbaikan</span>
            <p className="mt-1 text-2xl font-bold text-indigo-800 dark:text-indigo-200">
              {data.statusCounts['PERBAIKAN'] || 0}
            </p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-center dark:border-purple-900/40 dark:bg-purple-950/20">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Uji / QC</span>
            <p className="mt-1 text-2xl font-bold text-purple-800 dark:text-purple-200">
              {data.statusCounts['UJI_QC'] || 0}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Siap Diambil</span>
            <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {data.statusCounts['SIAP_DIAMBIL'] || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
