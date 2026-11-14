// components/home/final-cta-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface FinalCtaSectionProps {
  onOpenDemo: () => void;
}

export function FinalCtaSection({ onOpenDemo }: FinalCtaSectionProps) {
  const handleDemoClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'final' });
    onOpenDemo();
  };

  return (
    <section className="bg-foreground text-background px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-4xl text-center">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-background/60">
          READY WHEN YOU ARE
        </p>

        {/* H2 */}
        <h2 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-background">
          The right work changes everything.
        </h2>

        {/* Subline */}
        <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-background/70">
          Hire with AI, or find work that fits. Start where you are.
        </p>

        {/* Buttons: light pill "Book a demo"; outlined light pill "Create your free profile"; small text link "Sign in". No icons. */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleDemoClick}
            className="inline-flex h-12 items-center justify-center rounded-full bg-background px-7 text-sm font-semibold text-foreground hover:bg-background/90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Book a demo
          </button>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-7 text-sm font-semibold text-background hover:bg-background/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Create your free profile
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center px-4 text-xs font-medium text-background/60 hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
