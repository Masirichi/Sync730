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

export function FinalCtaSection({ onOpenDemo, talents = 137 }: FinalCtaSectionProps) {
  const content = homeCopy.closing;

  const handleRecruiterClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'final' });
    onOpenDemo();
  };

  return (
    <section
      id="closing-cta"
      aria-label="Join Sync730"
      className="bg-foreground text-background px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-4xl text-center">
        {/* H2 */}
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-background">
          {content.h2}
        </h2>

        {/* Subline with live number */}
        <p className="mx-auto mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-background/70">
          {content.bodyPrefix}
          <span className="tabular-nums font-semibold text-background">
            {talents.toLocaleString()}
          </span>
          {content.bodySuffix}
        </p>

        {/* Action Buttons: "Create your free profile" & "I'm hiring in Africa" */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={content.ctaPrimaryHref}
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full bg-background px-7 text-sm font-semibold text-foreground hover:bg-background/90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            {content.ctaPrimary}
          </Link>

          <button
            type="button"
            onClick={handleRecruiterClick}
            className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-7 text-sm font-semibold text-background hover:bg-background/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
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
