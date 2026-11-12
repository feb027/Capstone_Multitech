import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ href = '/', compact = false }: BrandLogoProps) {
  const logoImg = (
    <div className="inline-flex items-center justify-center rounded-xl border border-black/[0.08] bg-white p-1 shadow-sm dark:border-white/[0.15]">
      <img
        src="/images/multitech-logo.png"
        alt="Logo CV Multitech"
        className={compact ? 'h-6 w-auto object-contain' : 'h-7 w-auto object-contain'}
      />
    </div>
  );

  if (!href) {
    return logoImg;
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center tap-bounce"
      aria-label="CV Multitech Beranda"
    >
      {logoImg}
    </Link>
  );
}
