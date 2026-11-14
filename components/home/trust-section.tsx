// components/home/trust-section.tsx
import React from 'react';
import Link from 'next/link';

export function TrustSection() {
  const trustCells = [
    {
      title: 'Every score points to evidence.',
      description:
        'All AI evaluations cite exact interview timestamps and transcript passages. You see the evidence behind every metric.',
    },
    {
      title: 'You make the hiring decision.',
      description:
        'Scores guide your review and never reject anyone on their own. Humans lead all interviews, advancements, and job offers.',
    },
    {
      title: 'Candidates control their data.',
      description:
        'Consent, visibility, and deletion are built in by design under the Nigeria Data Protection Act 2023.',
    },
  ];

  return (
    <section className="border-b border-border/70 bg-secondary/60 text-foreground py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading black dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>TRUST</span>
        </div>

        {/* H2 */}
        <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-foreground">
          AI scores. Humans decide.
        </h2>

        {/* Three Bordered Cells Grid */}
        <div className="mt-14 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-3">
          {trustCells.map((cell, idx) => (
            <div key={idx} className="bg-background p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {cell.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {cell.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance and Governance Links */}
        <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-semibold text-foreground">
          <Link
            href="/scoring-methodology"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <span>Scoring Methodology</span>
            <span aria-hidden="true">→</span>
          </Link>
          <span className="h-4 w-px bg-border/80 hidden sm:inline-block" aria-hidden="true" />
          <Link
            href="/scoring-methodology"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <span>AI Transparency (NDPA)</span>
            <span aria-hidden="true">→</span>
          </Link>
          <span className="h-4 w-px bg-border/80 hidden sm:inline-block" aria-hidden="true" />
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <span>Privacy Policy</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
