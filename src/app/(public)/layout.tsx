import { PublicHeader } from '@/components/public/PublicHeader';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E5E5EA]/40 dark:bg-[#0A0A0C]">
      {/* Centered Mobile-First App Shell */}
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-[#F2F2F7] shadow-2xl transition-colors dark:bg-black sm:border-x sm:border-black/[0.04] sm:dark:border-white/[0.08]">
        <PublicHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 px-5 pt-4 pb-28">{children}</main>

        {/* Floating Bottom Action Bar (Thumb Ergonomics ala Apple) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="mx-auto max-w-lg px-2 pointer-events-auto">
            <div className="flex items-center gap-2 rounded-[26px] border border-black/[0.06] bg-white/85 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]/85">
              <Link
                href="/cek"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0B2545] py-3.5 text-xs font-bold text-white shadow-md transition-transform tap-bounce dark:bg-white dark:text-black"
              >
                <span>Cek Kode Servis</span>
                <span className="text-[10px] font-mono opacity-60">#4-DIGIT</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
