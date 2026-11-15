// components/home/differentiators-section.tsx
'use client';

import React from 'react';
import { HOME_CONTENT } from '@/src/content/home';

export function DifferentiatorsSection() {
  return (
    <section
      id="difference"
      aria-label="The Sync730 difference"
      className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>{HOME_CONTENT.differentiators.label}</span>
        </div>

        {/* H2 */}
        <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground">
          {HOME_CONTENT.differentiators.h2}
        </h2>

        {/* 4 Differentiator Cards (Grid: 1 col on mobile, 2 col on tablet, 4 col on desktop) */}
        <div className="mt-14 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_CONTENT.differentiators.items.map((item) => (
            <div
              key={item.number}
              className="bg-background p-7 sm:p-9 flex flex-col justify-between"
            >
              <div>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {item.number}
                </p>
                <h3 className="mt-8 text-xl font-medium tracking-tight text-foreground">
                  {item.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Muted line beneath cards */}
        <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
          {HOME_CONTENT.differentiators.mutedLine}
        </p>
      </div>
    </section>
  );
}
