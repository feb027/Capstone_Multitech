import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Multitech — Pelacakan Servis Elektronik Mobil',
  description:
    'Sistem manajemen dan pelacakan progres perbaikan modul elektronik mobil (ECU, BCM, EPS, Speedometer) Multitech Tasikmalaya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-light text-slate-900 transition-colors duration-200 dark:bg-surface-dark dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
