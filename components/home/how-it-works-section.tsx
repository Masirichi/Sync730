// components/home/how-it-works-section.tsx
'use client';

import React from 'react';
import { HOME_CONTENT } from '@/src/content/home';

export function HowItWorksSection() {
  const { howItWorks } = HOME_CONTENT;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading black dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>{howItWorks.label}</span>
        </div>

        {/* H2 */}
        <h2
          id="how-it-works-heading"
          className="mt-6 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl sm:leading-[1.08] lg:text-6xl text-foreground"
        >
          {howItWorks.h2}
        </h2>

        {/* Four Bordered Cells Grid (4 cols on lg, 2 cols on sm, 1 col on mobile) */}
        <div className="mt-16 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step) => (
            <div
              key={step.number}
              className="bg-background p-8 sm:p-10 flex flex-col justify-between"
            >
              <div>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {step.number}
                </p>
                <h3 className="mt-10 text-xl font-medium tracking-tight text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
