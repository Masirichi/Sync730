// components/home/for-recruiters-section.tsx
'use client';

import React from 'react';
import { trackEvent } from '@/lib/analytics';
import { homeCopy } from '@/content/home';

interface ForRecruitersSectionProps {
  onOpenDemo: () => void;
}

export function ForRecruitersSection({ onOpenDemo }: ForRecruitersSectionProps) {
  const content = homeCopy.employers;

  const handleDemoClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'recruiters' });
    onOpenDemo();
  };

  const handleScrollToSample = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('sample-report');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id={content.id}
      aria-label="For recruiters"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header Grid: Eyebrow, H2, Right Paragraph & CTAs */}
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>{content.eyebrow}</span>
            </div>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground">
              {content.h2}
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              {content.body}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {content.ctaPrimary}
              </button>
              <a
                href="#sample-report"
                onClick={handleScrollToSample}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {content.ctaSecondary}
              </a>
            </div>
          </div>
        </div>

        {/* Three Bordered Metric / Value Proposition Cards */}
        <div className="mt-16 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-3">
          {content.points.map((point) => (
            <div key={point.number} className="bg-background p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {point.number}
                </p>
                <h3 className="mt-10 text-xl font-medium tracking-tight text-foreground">
                  {point.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {point.body}
              </p>
            </div>
          ))}
        </div>

        {/* Dark Sample Report Card */}
        <div id="sample-report" className="mt-16 max-w-2xl mx-auto scroll-mt-24">
          <div className="relative border border-foreground bg-foreground p-6 sm:p-8 text-background shadow-[12px_12px_0_hsl(var(--secondary))]">
            <div className="flex items-center justify-between border-b border-background/20 pb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-background/60">
                {/* SAMPLE INTERVIEW REPORT */}
                {content.sampleReport.header}
              </span>
              <span className="rounded border border-background/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background/80">
                {content.sampleReport.badge}
              </span>
            </div>

            <div className="pt-5 pb-4">
              <p className="text-xl font-bold tracking-tight text-background">
                {content.sampleReport.role}
              </p>
              <p className="text-xs text-background/70 mt-0.5 font-mono">
                {content.sampleReport.candidateId}
              </p>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs text-background/80 mb-1.5 font-medium">
                  <span>{content.sampleReport.techDepth}</span>
                  <span className="tabular-nums font-semibold">{content.sampleReport.techDepthScore}</span>
                </div>
                <div className="h-1.5 w-full bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-background rounded-full"
                    style={{ width: `${content.sampleReport.techDepthValue}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-background/80 mb-1.5 font-medium">
                  <span>{content.sampleReport.communication}</span>
                  <span className="tabular-nums font-semibold">{content.sampleReport.communicationScore}</span>
                </div>
                <div className="h-1.5 w-full bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-background rounded-full"
                    style={{ width: `${content.sampleReport.communicationValue}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-background/20 pt-4">
              <p className="text-xs leading-5 text-background/80 italic">
                “{content.sampleReport.quote}”
              </p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-background/20 pt-3 text-[11px] text-background/80">
              <span>{content.sampleReport.integrity}</span>
              <span className="text-[10px] uppercase tracking-wider text-background/70">
                {content.sampleReport.advisory}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
