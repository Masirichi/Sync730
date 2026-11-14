// components/home/for-recruiters-section.tsx
'use client';

import React from 'react';
import { trackEvent } from '@/lib/analytics';

interface ForRecruitersSectionProps {
  onOpenDemo: () => void;
}

const recruiterCells = [
  {
    number: '01',
    title: 'Every applicant interviewed',
    description:
      'Each candidate who applies takes the same AI-moderated video interview within 48 hours, so you compare like with like.',
  },
  {
    number: '02',
    title: 'A ranked shortlist',
    description:
      'Scores point to evidence from the interview, so you know why someone ranks where they do.',
  },
  {
    number: '03',
    title: 'Decisions your team shares',
    description:
      'Reviewers watch interviews and leave notes in one place, from screen to signed.',
  },
];

export function ForRecruitersSection({ onOpenDemo }: ForRecruitersSectionProps) {
  const handleDemoClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'recruiters' });
    onOpenDemo();
  };

  return (
    <section
      id="for-recruiters"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header Grid: Eyebrow, H2, Right Paragraph & CTA */}
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>FOR RECRUITERS</span>
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-foreground">
              Meet the person behind the résumé.
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-lg leading-8 text-muted-foreground">
              Sync730 interviews every candidate on video and gives your team scored, evidence-backed reports, so you see more than a CV.
            </p>
            <div>
              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Book a demo
              </button>
            </div>
          </div>
        </div>

        {/* Three Bordered Metric Cells */}
        <div className="mt-16 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-3">
          {recruiterCells.map((cell) => (
            <div key={cell.number} className="bg-background p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                  {cell.number}
                </p>
                <h3 className="mt-12 text-xl font-medium tracking-tight text-foreground">
                  {cell.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {cell.description}
              </p>
            </div>
          ))}
        </div>

        {/* Two Bordered Product Blocks with Faithful HTML Recreations of Real Product Screens */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Product Block 1: The AI Interviewer */}
          <div className="border border-border/70 bg-background p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product Surface 01
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 border border-border rounded text-muted-foreground">
                  Candidate Interface
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                The AI Interviewer
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Adaptive questions based on the role. Video on any device. Identity and integrity checks.
              </p>
            </div>

            {/* Faithful HTML UI Recreation of Interviewer Screen */}
            <div className="mt-8 rounded-lg border border-border/80 bg-[#111] p-4 text-white font-mono text-xs">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-sans font-medium text-neutral-300">REC · 02:45 / 03:00</span>
                </div>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400 font-sans">
                  Question 2 of 4
                </span>
              </div>

              <div className="my-4 rounded bg-neutral-900/90 p-3.5 border border-neutral-800">
                <p className="text-[11px] font-sans text-neutral-400 uppercase tracking-wider mb-1 font-semibold">
                  Prompt
                </p>
                <p className="font-sans text-sm text-neutral-100 font-medium leading-relaxed">
                  “Describe an architectural trade-off you made between immediate delivery speed and long-term data consistency.”
                </p>
              </div>

              {/* Simulated video frame with waveform audio & proctoring check */}
              <div className="relative rounded bg-neutral-950 h-36 border border-neutral-800 flex flex-col justify-between p-3 overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <span className="bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] text-neutral-300 font-sans">
                    Camera & Mic Active
                  </span>
                  <span className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-sans">
                    Identity verified
                  </span>
                </div>

                {/* Simulated Audio Waveform */}
                <div className="flex items-center justify-center gap-1 my-auto">
                  <span className="w-1 bg-emerald-500 h-4 rounded-full animate-pulse" />
                  <span className="w-1 bg-emerald-400 h-8 rounded-full" />
                  <span className="w-1 bg-emerald-400 h-6 rounded-full" />
                  <span className="w-1 bg-emerald-500 h-10 rounded-full animate-pulse" />
                  <span className="w-1 bg-emerald-400 h-5 rounded-full" />
                  <span className="w-1 bg-emerald-500 h-8 rounded-full" />
                  <span className="w-1 bg-emerald-400 h-3 rounded-full" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans z-10">
                  <span>Candidate: Verified Token #C4D8</span>
                  <span>0 integrity flags</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Block 2: The Talent Evaluator */}
          <div className="border border-border/70 bg-background p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product Surface 02
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 border border-border rounded text-muted-foreground">
                  Recruiter Console
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                The Talent Evaluator
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Scored reports with evidence, a ranked shortlist, and side-by-side comparison.
              </p>
            </div>

            {/* Faithful HTML UI Recreation of Scored Report Screen */}
            <div className="mt-8 rounded-lg border border-border/80 bg-secondary/50 p-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-semibold text-foreground text-sm">
                  Senior Backend Shortlist (Ranked)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  3 Candidates Evaluated
                </span>
              </div>

              {/* Shortlist row 1: Top Candidate */}
              <div className="my-3 rounded border border-foreground/20 bg-background p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground">Candidate #A7F2</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background font-semibold">
                      Rank 1 · 91/100
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Interviewed 4h ago</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-secondary/70 p-1.5 rounded">
                    <span className="text-muted-foreground">Technical Depth:</span>{' '}
                    <strong className="text-foreground">91</strong>
                  </div>
                  <div className="bg-secondary/70 p-1.5 rounded">
                    <span className="text-muted-foreground">Communication:</span>{' '}
                    <strong className="text-foreground">88</strong>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Citation [03:14]:</span> Detailed explanation of distributed locking & idempotent payment processing.
                </p>
              </div>

              {/* Shortlist row 2 */}
              <div className="rounded border border-border bg-background p-3 opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">Candidate #C4D8</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-border text-foreground font-semibold">
                      Rank 2 · 86/100
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Interviewed 1d ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
