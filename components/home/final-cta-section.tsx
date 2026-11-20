// components/home/final-cta-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { homeCopy } from '@/content/home';

interface FinalCtaSectionProps {
  onOpenDemo: () => void;
  talents?: number;
}

export function FinalCtaSection({ onOpenDemo, talents = 0 }: FinalCtaSectionProps) {
  const content = homeCopy.closing;

  const handleRecruiterClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'final' });
    onOpenDemo();
  };

  return (
    <section
      id="closing-cta"
      aria-label="Join Sync730"
      className="relative overflow-hidden bg-foreground text-background px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
    >
      {/* Outcrowd CoreShift ambient orange radiance */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Eyebrow: A — ACTION */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span>{content.eyebrow || 'A — ACTION · START HIRING IN 72 HOURS'}</span>
          </div>
        </div>

        {/* H2 */}
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-background">
          {content.h2}
        </h2>

        {/* Subline with live number */}
        <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-background/70">
          {content.bodyPrefix}
          <span className="tabular-nums font-semibold text-orange-400">
            {talents.toLocaleString()}
          </span>
          {content.bodySuffix}
        </p>

        {/* Action Buttons: Vibrant CoreShift Orange Primary */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={content.ctaPrimaryHref}
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {content.ctaPrimary}
          </Link>

          <button
            type="button"
            onClick={handleRecruiterClick}
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-8 text-sm font-semibold text-background hover:bg-background/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            {content.ctaSecondary}
          </button>
        </div>

        {/* Microcopy */}
        <p className="mt-5 text-xs text-background/60">
          {content.microcopy}
        </p>
      </div>
    </section>
  );
}
