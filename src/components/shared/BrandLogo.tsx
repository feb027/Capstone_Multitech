import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
}

export function BrandLogo({ href = '/', compact = false }: BrandLogoProps) {
  const logoImg = (
    <img
      src="/images/multitech-logo.png"
      alt="Logo CV Multitech"
      className={compact ? 'block h-7 w-auto object-contain' : 'block h-8 w-auto object-contain'}
    />
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
