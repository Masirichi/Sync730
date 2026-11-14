// components/home/hero-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

export function HeroSection({ onOpenDemo }: HeroSectionProps) {
  const handleDemoClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'hero' });
    onOpenDemo();
  };

  const handleJobsClick = () => {
    trackEvent({ name: 'cta_find_work_click' });
  };

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28 items-center">
        {/* Left Column: Headlines & Positioning */}
        <div className="max-w-3xl">
          {/* Eyebrow with leading rule line */}
          <div className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-px w-8 bg-foreground" aria-hidden="true" />
            <span>EMPOWERING RECRUITMENT IN THE AGE OF AI</span>
          </div>

          {/* H1 with exactly one italic word on "best" */}
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-7xl lg:text-[84px] text-foreground">
            Interview every applicant. Review only the <em className="italic font-serif">best</em>.
          </h1>

          {/* Subhead */}
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
            Smart, AI-powered recruitment for organizations: you post a role, everyone who applies takes an AI-moderated video interview within 48 hours, and you review a ranked, evidence-backed shortlist.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleDemoClick}
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              Book a demo
            </button>
            <Link
              href="/jobs"
              onClick={handleJobsClick}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              Find your next move
            </Link>
          </div>

          {/* Plain text items separated by thin vertical dividers (No checkmark icons) */}
          <div className="mt-12 flex flex-wrap items-center gap-y-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Free for candidates</span>
            <span className="mx-3.5 h-3.5 w-px bg-border/80" aria-hidden="true" />
            <span>AI scores, humans decide</span>
            <span className="mx-3.5 h-3.5 w-px bg-border/80" aria-hidden="true" />
            <span>Built for how Africa hires</span>
          </div>
        </div>

        {/* Right Column: Hero Graphic with Light-Gray Circles, Offset Block, and Sample Interview Report */}
        <div className="relative flex min-h-[440px] items-center justify-center lg:min-h-[540px] lg:justify-end">
          {/* Light-gray circles behind card */}
          <div className="absolute left-4 top-6 h-60 w-60 rounded-full border border-border/80 sm:h-72 sm:w-72" aria-hidden="true" />
          <div className="absolute left-16 top-16 h-60 w-60 rounded-full bg-secondary sm:h-72 sm:w-72" aria-hidden="true" />

          {/* Black Card in existing style with offset shadow */}
          <div className="relative z-10 w-full max-w-sm border border-foreground bg-foreground p-6 sm:p-7 text-background shadow-[16px_16px_0_hsl(var(--secondary))]">
            {/* Card Header: Eyebrow + Sample tag (No sparkle icon) */}
            <div className="flex items-center justify-between border-b border-background/20 pb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-background/60">
                SAMPLE INTERVIEW REPORT
              </span>
              <span className="rounded border border-background/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background/80">
                Sample
              </span>
            </div>

            {/* Role & Candidate Code */}
            <div className="pt-5 pb-4">
              <p className="text-xl font-bold tracking-tight text-background">
                Senior Backend Engineer
              </p>
              <p className="text-xs text-background/70 mt-0.5">
                Candidate #A7F2
              </p>
            </div>

            {/* Scored Metric Rows with thin bars */}
            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs text-background/80 mb-1.5 font-medium">
                  <span>Technical depth</span>
                  <span className="tabular-nums font-semibold">91 / 100</span>
                </div>
                <div className="h-1.5 w-full bg-background/20 rounded-full overflow-hidden">
                  <div className="h-full bg-background rounded-full" style={{ width: '91%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-background/80 mb-1.5 font-medium">
                  <span>Communication</span>
                  <span className="tabular-nums font-semibold">88 / 100</span>
                </div>
                <div className="h-1.5 w-full bg-background/20 rounded-full overflow-hidden">
                  <div className="h-full bg-background rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            {/* Evidence & Assessment Note */}
            <div className="mt-4 border-t border-background/20 pt-4">
              <p className="text-xs leading-5 text-background/75">
                Strong on retries and reconciliation. Gap: distributed tracing.
              </p>
            </div>

            {/* Card Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-background/20 pt-3 text-[11px] text-background/80">
              <span>Identity verified, 0 integrity flags</span>
              <span className="text-[10px] uppercase tracking-wider text-background/75">Evaluation advisory</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
