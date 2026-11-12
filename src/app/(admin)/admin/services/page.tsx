import { Suspense } from 'react';
import { AdminServicesClient } from '@/components/admin/AdminServicesClient';

export default function AdminServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 text-xs text-slate-600 shadow-sm dark:border-white/[0.06] dark:bg-[#1C1C1E] dark:text-slate-400">
          Memuat daftar unit servis...
        </div>
      }
    >
      <AdminServicesClient />
    </Suspense>
  );
}
