// components/home/start-where-you-are-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { DOORS_CONFIG, DoorItem } from '@/lib/config/doors';
import { trackEvent } from '@/lib/analytics';

interface StartWhereYouAreSectionProps {
  onOpenDemo: () => void;
  onOpenEnterprise: () => void;
}

export function StartWhereYouAreSection({
  onOpenDemo,
  onOpenEnterprise,
}: StartWhereYouAreSectionProps) {
  const handleItemClick = (door: DoorItem) => {
    trackEvent({ name: 'door_click', which: door.id });

    if (door.action === 'modal_demo') {
      onOpenDemo();
    } else if (door.action === 'modal_enterprise') {
      onOpenEnterprise();
    }
  };

  return (
    <section className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading black dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-12">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>START WHERE YOU ARE</span>
        </div>

        {/* Four Hairline Rows */}
        <div className="divide-y divide-border/70 border-y border-border/70">
          {DOORS_CONFIG.map((door) => {
            const isButton = door.action === 'modal_demo' || door.action === 'modal_enterprise';

            const rowContent = (
              <div className="group flex flex-col py-8 sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors hover:bg-secondary/30 px-3 -mx-3 rounded">
                <div className="sm:max-w-xl">
                  <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground group-hover:underline">
                    {door.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {door.promise}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                      door.status === 'Live'
                        ? 'bg-foreground text-background'
                        : 'border border-border text-muted-foreground bg-secondary/50'
                    }`}
                  >
                    {door.status}
                  </span>
                  <span className="text-base text-foreground font-sans transition-transform group-hover:translate-x-1" aria-hidden="true">
                    →
                  </span>
                </div>
              </div>
            );

            if (isButton) {
              return (
                <button
                  key={door.id}
                  type="button"
                  onClick={() => handleItemClick(door)}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
                >
                  {rowContent}
                </button>
              );
            }

            return (
              <Link
                key={door.id}
                href={door.href || '/'}
                onClick={() => handleItemClick(door)}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded"
              >
                {rowContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
