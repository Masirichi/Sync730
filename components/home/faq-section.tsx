// components/home/faq-section.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { homeCopy } from '@/content/home';
import { cn } from '@/lib/utils';

export function FaqSection() {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        trackEvent({ name: 'faq_open', which: `faq-${index}` });
      }
      return next;
    });
  };

  // Structured Data for FAQPage JSON-LD
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeCopy.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className="border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>{homeCopy.faq.label}</span>
        </div>

        {/* H2 */}
        <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground">
          {homeCopy.faq.h2}
        </h2>

        {/* Accessible Accordion (Button Headers, aria-expanded, keyboard operable) */}
        <div
          role="region"
          aria-label="FAQ Accordion"
          className="mt-14 divide-y divide-border/70 border-y border-border/70"
        >
          {homeCopy.faq.items.map((item, idx) => {
            const isOpen = openIndices.has(idx);
            const headerId = `faq-header-${idx}`;
            const panelId = `faq-panel-${idx}`;

            return (
              <div key={idx} className="py-6">
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full cursor-pointer items-center justify-between text-left text-lg font-medium tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded px-1 transition-colors hover:text-foreground/80"
                >
                  <span className="pr-4">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'ml-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  >
                    <ChevronDown className="h-5 w-5 stroke-[1.5]" />
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  hidden={!isOpen}
                  className={cn(
                    'mt-4 text-sm leading-7 text-muted-foreground pr-8 space-y-2',
                    !isOpen && 'hidden'
                  )}
                >
                  <p>{item.answer}</p>
                  {item.question.includes('Role verified') && (
                    <p className="pt-1">
                      {/* href="/how-we-verify" */}
                      <Link
                        href={homeCopy.faq.linkHref}
                        className="inline-flex items-center text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                      >
                        {homeCopy.faq.linkText}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
