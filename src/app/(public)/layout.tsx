import { PublicHeader } from '@/components/public/PublicHeader';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#ECEEF2] transition-colors dark:bg-black">
      {/* Centered Mobile-First App Shell with neutral black backdrop */}
      <div className="ios-ambient-backdrop relative mx-auto flex min-h-screen max-w-lg flex-col overflow-x-clip shadow-2xl transition-colors sm:border-x sm:border-white/50 sm:dark:border-white/[0.08]">
        <PublicHeader />

        <main className="relative z-10 flex-1 px-4 pt-3 pb-24 sm:px-5">{children}</main>
      </div>
    </div>
  );
}
