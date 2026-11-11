import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
  className?: string;
  showText?: boolean;
}

export function BrandLogo({
  href = '/',
  inverted = false,
  compact = false,
  className = '',
  showText = true,
}: BrandLogoProps) {
  const logo = (
    <span
      className={`inline-flex items-center gap-2 select-none group ${className}`}
      aria-label="Sync730"
      title="Sync730"
    >
      {showText && (
        <span
          className={`tracking-tight font-extrabold ${
            compact ? 'text-lg' : 'text-xl'
          }`}
        >
          <span className={inverted ? 'text-white' : 'text-black dark:text-white'}>
            Sync
          </span>
          <span
            className={`font-semibold ${
              inverted
                ? 'text-neutral-400'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            730
          </span>
        </span>
      )}
      <img
        src={
          inverted
            ? '/assets/logo/sync730_icon_white.png'
            : '/assets/logo/sync730_icon_black.png'
        }
        alt="Sync730"
        className={compact ? 'h-6 w-6 object-contain' : 'h-7 w-7 object-contain'}
      />
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center">
      {logo}
    </Link>
  ) : (
    logo
  );
}
