// components/home/how-it-works-section.tsx
import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Post a role',
    description:
      'Paste your job description. We turn it into interview questions and a scoring rubric you can edit.',
  },
  {
    number: '02',
    title: 'Candidates apply and interview within 48 hours',
    description:
      'Everyone who applies through Sync730 takes an AI-moderated video interview within 48 hours, on any device.',
  },
  {
    number: '03',
    title: 'Review ranked reports',
    description:
      'Open a shortlist with scores, evidence from the interview, and side-by-side comparison.',
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Eyebrow with leading black dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>HOW IT WORKS</span>
        </div>

        {/* H2 */}
        <h2 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-foreground">
          From job post to scored shortlist in three steps.
        </h2>

        {/* Three Bordered Cells Grid */}
        <div className="mt-16 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="bg-background p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {step.number}
                </p>
                <h3 className="mt-12 text-xl font-medium tracking-tight text-foreground">
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
