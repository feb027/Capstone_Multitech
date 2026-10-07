import { PublicHeader } from '@/components/public/PublicHeader';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E5E5EA]/40 transition-colors dark:bg-[#0A0A0C]">
      {/* Centered Mobile-First App Shell */}
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-[#F2F2F7] shadow-2xl transition-colors dark:bg-black sm:border-x sm:border-black/[0.04] sm:dark:border-white/[0.08]">
        <PublicHeader />
        
        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-3 pb-24 sm:px-5">{children}</main>
      </div>
    </div>
  );
}
