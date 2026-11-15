// components/home/belief-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HOME_CONTENT } from '@/src/content/home';

export function BeliefSection() {
  const { belief } = HOME_CONTENT;

  return (
    <section
      id="belief"
      aria-labelledby="belief-heading"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 items-start">
          {/* Left Column: Eyebrow with black dot & Large H2 */}
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>{belief.label}</span>
            </div>

            <h2
              id="belief-heading"
              className="mt-6 text-3xl font-semibold leading-[1.12] tracking-[-0.04em] sm:text-5xl sm:leading-[1.08] lg:text-6xl text-foreground"
            >
              {belief.h2}
            </h2>
          </div>

          {/* Right Column: Narrative Body Paragraphs & Link */}
          <div className="space-y-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
            {belief.paragraphs.map((p, idx) => {
              // Highlight the short punchy sentences or distinct takeaways
              if (idx === 2) {
                return (
                  <p
                    key={idx}
                    className="text-lg sm:text-xl font-semibold text-foreground tracking-tight pt-1"
                  >
                    {p}
                  </p>
                );
              }
              if (idx === 4) {
                return (
                  <p
                    key={idx}
                    className="text-lg sm:text-xl font-semibold text-foreground tracking-tight pt-1"
                  >
                    {p}
                  </p>
                );
              }
              return (
                <p key={idx} className="leading-8">
                  {p}
                </p>
              );
            })}

            {/* Read how we verify roles link */}
            <div className="pt-4">
              <Link
                href={belief.linkHref}
                className="group inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground hover:underline underline-offset-4 transition-colors"
              >
                <span>{belief.linkLabel}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
