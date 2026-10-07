import { PublicHeader } from '@/components/public/PublicHeader';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-light text-slate-900 dark:bg-surface-dark dark:text-slate-100">
      <PublicHeader />
      <main className="flex-1 pb-16">{children}</main>
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-5xl px-4">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Multitech Auto Electronics — Tasikmalaya
          </p>
          <p className="mt-1">
            Spesialis Servis Modul Komputer Mobil: ECU, BCM, EPS, Speedometer & Kelistrikan Otomotif.
          </p>
        </div>
      </footer>
    </div>
  );
}
