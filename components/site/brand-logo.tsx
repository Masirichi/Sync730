import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ href = '/', inverted = false, compact = false, className = '' }: BrandLogoProps) {
  const logo = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={compact
          ? inverted ? '/assets/logo/sync730_icon_white.png' : '/assets/logo/sync730_icon_black.png'
          : inverted ? '/assets/logo/sync730_wordmark_white.png' : '/assets/logo/sync730_wordmark_black.png'}
        alt="Sync730"
        className={compact ? 'h-8 w-8 object-contain' : 'h-7 w-auto object-contain'}
      />
    </span>
  );

  return href ? <Link href={href}>{logo}</Link> : logo;
}
