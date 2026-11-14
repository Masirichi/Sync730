// components/home/for-candidates-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';

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

const jobHuntFeatures = [
  {
    number: '01',
    title: 'Résumé generator and evaluator',
    description:
      'Build a résumé from your profile, then see how it scores for the roles you want.',
  },
  {
    number: '02',
    title: 'Job application tracker',
    description:
      'Keep every application, status and next step in one place.',
  },
  {
    number: '03',
    title: 'Your own dashboard',
    description:
      'Curated roles tailored to your profile, waiting each time you sign in.',
  },
  {
    number: '04',
    title: 'AI interview simulator',
    description:
      'Practice with an AI interviewer before the real one, and see where to improve.',
  },
];

export function ForCandidatesSection({ latestRoles = [] }: ForCandidatesSectionProps) {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;

  // Rule: Hide latest roles sub-block if fewer than 3 qualify
  const showLatestRoles = latestRoles.length >= 3;

  return (
    <section
      id="for-candidates"
      className="scroll-mt-20 border-b border-border/70 bg-secondary/60 text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Main 2-Column Hero for Candidates */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Copy & Actions */}
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>FOR CANDIDATES</span>
            </div>

            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-foreground">
              Your next move starts with a better signal.
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Create one profile that reflects the whole you. We’ll bring you curated roles that fit it, and give you everything you need for your job hunt in one place.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-full border border-foreground bg-background px-7 text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Create your free profile
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-12 items-center text-sm font-semibold text-foreground hover:underline px-3"
              >
                See open roles →
              </Link>
            </div>

            {/* Optional WhatsApp / Telegram Channel Links */}
            {(whatsappUrl || telegramUrl) && (
              <div className="mt-6 flex flex-wrap items-center gap-5 text-xs font-medium text-muted-foreground">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground underline transition-colors"
                  >
                    Join our WhatsApp channel
                  </a>
                )}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground underline transition-colors"
                  >
                    Join our Telegram channel
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sample Candidate Profile Card (No lightning icon) */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md border border-border bg-background p-6 sm:p-8 rounded shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm font-semibold text-foreground">
                  Example profile
                </span>
                <span className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sample
                </span>
              </div>

              <div className="space-y-5 py-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    ROLE
                  </p>
                  <p className="mt-1 text-lg font-medium text-foreground">
                    Frontend developer
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                    STRENGTHS
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <span className="border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground rounded">
                      React
                    </span>
                    <span className="border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground rounded">
                      Accessibility
                    </span>
                    <span className="border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground rounded">
                      Testing
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between text-xs font-medium mb-2">
                  <span className="text-muted-foreground">Apply-ready</span>
                  <span className="text-foreground font-semibold tabular-nums">6 of 7 steps</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: '85.7%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-block: YOUR JOB HUNT, IN ONE PLACE */}
        <div className="mt-24 border-t border-border/70 pt-16">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
            <span>YOUR JOB HUNT, IN ONE PLACE</span>
          </div>

          <h3 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need, so you don’t need another tool.
          </h3>

          <div className="mt-12 grid gap-px border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
            {jobHuntFeatures.map((feat) => (
              <div key={feat.number} className="bg-background p-7 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                    {feat.number}
                  </span>
                  <h4 className="mt-8 text-base font-semibold tracking-tight text-foreground">
                    {feat.title}
                  </h4>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-block: LATEST ROLES (Hidden if fewer than 3 qualify) */}
        {showLatestRoles && (
          <div className="mt-20 border-t border-border/70 pt-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  LATEST ROLES
                </p>
                <h4 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  Recently posted opportunities
                </h4>
              </div>
              <Link
                href="/jobs"
                className="text-sm font-semibold text-foreground hover:underline hidden sm:inline-flex"
              >
                View all roles →
              </Link>
            </div>

            <div className="divide-y divide-border/70 border-y border-border/70 bg-background rounded">
              {latestRoles.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-secondary/40 transition-colors"
                >
                  <div>
                    <h5 className="text-base font-semibold text-foreground">
                      {job.title}
                    </h5>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.company}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {job.location_rule && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-secondary text-foreground border border-border">
                        {job.location_rule}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {job.posted_relative}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:hidden">
              <Link href="/jobs" className="text-sm font-semibold text-foreground hover:underline">
                View all roles →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
