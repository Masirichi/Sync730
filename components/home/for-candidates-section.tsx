// components/home/for-candidates-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { homeCopy } from '@/content/home';
import { Check, ArrowRight } from 'lucide-react';

export interface LatestJobItem {
  id: string;
  title: string;
  company: string;
  location_rule?: string;
  posted_relative: string;
}

interface ForCandidatesSectionProps {
  latestRoles?: LatestJobItem[];
}

export function ForCandidatesSection({ latestRoles = [] }: ForCandidatesSectionProps) {
  const candidates = homeCopy.candidates;

  return (
    <section
      id="for-candidates"
      aria-labelledby="for-candidates-heading"
      className="scroll-mt-20 border-b border-border/70 bg-secondary/50 text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Main 2-Column Grid */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-start">
          {/* Left Column: Eyebrow, H2, Body, 3 Points, Reassurance, and CTAs */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                <span>{candidates.eyebrow}</span>
              </div>

              <h2
                id="for-candidates-heading"
                className="mt-6 text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl sm:leading-[1.08] lg:text-6xl text-foreground"
              >
                {candidates.h2}
              </h2>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                {candidates.body}
              </p>
            </div>

            {/* 3 Points: Title + Line */}
            <div className="divide-y divide-border/70 border-y border-border/70 py-2">
              {candidates.points.map((pt, idx) => (
                <div key={idx} className="py-4 sm:py-5 flex items-start gap-3.5">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {pt.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-6 text-muted-foreground">
                      {pt.line}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassurance Note */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-4 text-xs sm:text-sm leading-relaxed text-foreground/80 shadow-xs">
              <span className="font-semibold text-foreground">{candidates.reassurancePrefix}</span>
              {candidates.reassurance}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3.5 pt-2 sm:flex-row sm:items-center">
              <Link
                href={candidates.ctaPrimaryHref}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {candidates.ctaPrimary}
              </Link>
              <Link
                href={candidates.ctaSecondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                <span>{candidates.ctaSecondary}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Existing Sample Candidate Profile Card labelled "Sample" */}
          <div className="flex items-center justify-center lg:justify-end lg:pt-8">
            <div className="w-full max-w-md border border-border bg-background p-6 sm:p-8 rounded-2xl shadow-[12px_12px_0_hsl(var(--secondary))] sm:shadow-[16px_16px_0_hsl(var(--secondary))]">
              {/* Card Header with "Sample" Tag */}
              {/* Example profile - Sample */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm font-semibold text-foreground">
                  {candidates.sampleCard.header}
                </span>
                <span className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {candidates.sampleCard.badge}
                </span>
              </div>

              {/* Profile Details */}
              <div className="space-y-5 py-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    {candidates.sampleCard.roleLabel}
                  </p>
                  <p className="mt-1 text-lg font-medium text-foreground">
                    {candidates.sampleCard.roleValue}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    {candidates.sampleCard.strengthsLabel}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {candidates.sampleCard.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground rounded-lg"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    {candidates.sampleCard.locationLabel}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {candidates.sampleCard.locationValue}
                  </p>
                </div>
              </div>

              {/* Apply-ready Indicator */}
              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between text-xs font-medium mb-2">
                  <span className="text-muted-foreground">{candidates.sampleCard.applyReadyLabel}</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {candidates.sampleCard.applyReadySteps}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: '85.7%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
