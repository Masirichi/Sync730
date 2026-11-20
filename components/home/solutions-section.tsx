// components/home/solutions-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Rocket,
  Globe2,
  Code,
  ArrowRight,
  Check,
  TrendingUp,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { homeCopy } from '@/content/home';

export function SolutionsSection() {
  const solutions = homeCopy.solutions || {
    label: 'TAILORED RECRUITMENT SOLUTIONS',
    h2: 'Engineered for how top engineering teams hire.',
    sub: 'Whether you are an early-stage startup or a global remote enterprise, Sync730 reduces your cost and time-to-hire by over 70%.',
    items: [],
  };

  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="scroll-mt-20 border-b border-border/70 bg-secondary/30 text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span>{solutions.label}</span>
            </div>
            <h2
              id="solutions-heading"
              className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground"
            >
              Engineered for how top engineering teams{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                hire.
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {solutions.sub}
            </p>
          </div>

          <Link
            href="/solutions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline underline-offset-4"
          >
            <span>Compare all solutions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 Solutions Cards */}
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {/* Solution 1: Startups */}
          <div className="rounded-2xl border border-border/80 bg-background p-8 flex flex-col justify-between shadow-xs transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Seed to Series B
                </span>
                <span className="text-xs font-semibold text-muted-foreground">0% Agency Fees</span>
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                For High-Growth Startups
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Scale your core technical team without burning weeks on resumes or paying $25,000 agency recruitment markups.
              </p>

              <div className="mt-6 rounded-xl border border-border/70 bg-secondary/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-bold">72 Hours Average Time-to-Hire</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Pre-screened senior engineers ready to start building immediately.
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground/90">
                {[
                  'Zero upfront search retainers or lock-in contracts',
                  'Calibrated technical assessment replays & code rubrics',
                  'Transparent token top-up model for flexible scaling',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/70">
              <Link
                href="/solutions#startups"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline"
              >
                Startup solutions <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Solution 2: Global Remote Teams */}
          <div className="rounded-2xl border border-border/80 bg-background p-8 flex flex-col justify-between shadow-xs transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Global Remote
                </span>
                <span className="text-xs font-semibold text-muted-foreground">WAT · CAT · EAT</span>
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                For Global Distributed Teams
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Hire elite African software engineers with verified regional eligibility, strong timezone alignment, and zero compliance friction.
              </p>

              <div className="mt-6 rounded-xl border border-border/70 bg-secondary/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Globe2 className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-bold">10,000+ Vetted African Engineers</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Hubs across Nigeria, Kenya, South Africa, and Ghana.
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground/90">
                {[
                  'Overlapping working hours with UK, Europe, and US East Coast',
                  'Pre-cleared identities and verified African remote work legality',
                  'NDPA and GDPR compliant data storage & privacy protection',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/70">
              <Link
                href="/solutions#global-teams"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline"
              >
                Global team solutions <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Solution 3: Engineering Leaders & CTOs */}
          <div className="rounded-2xl border border-border/80 bg-card p-8 flex flex-col justify-between shadow-xs transition-all hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  CTOs & Tech Leads
                </span>
                <span className="text-xs font-semibold text-orange-500">94.6% Pass Rate</span>
              </div>

              <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                For CTOs & Engineering Leaders
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Stop wasting valuable developer hours on screening calls. Receive pre-evaluated code portfolios and STAR rubrics upfront.
              </p>

              <div className="mt-6 rounded-xl border border-border/70 bg-secondary/40 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-bold">94.6% Final Round Candidate Pass Rate</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Senior engineers review candidate recordings before the final sync.
                </p>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground/90">
                {[
                  'Objective rubric scoring on technical depth and architecture',
                  'Live debugging and algorithm challenge breakdowns',
                  'Human-in-the-loop: your team makes 100% of final hiring choices',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/70">
              <Link
                href="/solutions#engineering"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 dark:text-orange-400 hover:underline"
              >
                Engineering solutions <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}