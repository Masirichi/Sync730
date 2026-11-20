// components/home/products-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Video,
  Columns3,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BarChart3,
  Layers,
} from 'lucide-react';
import { homeCopy } from '@/content/home';

export function ProductsSection() {
  const products = homeCopy.products || {
    label: 'OUR SUITE OF AI TOOLS',
    h2: 'Full-cycle AI recruitment architecture.',
    sub: 'From automated sourcing to live video evaluation and pipeline management, Sync730 gives technical teams high-signal hiring with zero friction.',
    items: [],
  };

  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="scroll-mt-20 border-b border-border/70 bg-background text-foreground py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span>{products.label}</span>
            </div>
            <h2
              id="products-heading"
              className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl text-foreground"
            >
              {products.h2}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {products.sub}
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
          >
            <span>Explore all features</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 2x2 Bento Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {/* Card 1: AI Autonomous Sourcing */}
          <div className="group relative rounded-2xl border border-border/80 bg-card p-8 sm:p-10 transition-all hover:border-foreground/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  Smart Sourcing
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-tight text-foreground">
                AI Autonomous Sourcing & Matchmaker
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Eliminate manual keyword searches. Our AI parses technical specifications and scans GitHub histories, code repositories, and regional African talent pools for 94%+ semantic match relevance.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-border/70 pt-6">
                {[
                  'Deep semantic matching against tech stacks and framework depth',
                  'Pre-cleared African remote eligibility and verified work history',
                  'Instant shortlist ranking without agency middlemen',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/products#sourcing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
              >
                Learn about AI Sourcing <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: AI Video & Technical Interviewer */}
          <div className="group relative rounded-2xl border border-border/80 bg-card p-8 sm:p-10 transition-all hover:border-foreground/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                  <Video className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  Automated Screening
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-tight text-foreground">
                AI Video & Technical Interviewer
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Stop spending 80+ hours on repetitive first-round screens. Our conversational AI conducts 20-minute adaptive technical interviews with calibrated STAR scoring rubrics.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-border/70 pt-6">
                {[
                  'Calibrated STAR scoring across Technical Depth, Architecture & Systems Design',
                  'Objective code challenge sandboxing and debugging analysis',
                  'Timestamped video playback and evidence-backed candidate scorecards',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/products#interview"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
              >
                Explore Video Screening <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: SyncFlow ATS & Pipeline CRM */}
          <div className="group relative rounded-2xl border border-border/80 bg-card p-8 sm:p-10 transition-all hover:border-foreground/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                  <Columns3 className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  Pipeline ATS
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-tight text-foreground">
                SyncFlow ATS & Talent CRM
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A streamlined Kanban applicant tracking system purpose-built for fast-moving engineering teams. Manage candidates from Initial Sourced to Final Offer.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-border/70 pt-6">
                {[
                  'Drag-and-drop collaborative stages with multi-stakeholder scorecards',
                  'Candidate notes, interview recordings, and feedback in one unified view',
                  'Automated candidate status notifications and interview scheduling',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/products#syncflow"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
              >
                See SyncFlow ATS <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Direct Recruiter Messaging & Dossiers */}
          <div className="group relative rounded-2xl border border-border/80 bg-card p-8 sm:p-10 transition-all hover:border-foreground/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  Instant Connect
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-semibold tracking-tight text-foreground">
                Direct Recruiter Messaging & Dossiers
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No recruiter black boxes. Message pre-vetted engineers directly through your recruiter console, access unredacted dossiers, and make offers quickly.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-border/70 pt-6">
                {[
                  'Real-time in-app chat between hiring managers and vetted engineers',
                  'Instant access to verified GitHub repositories, portfolios, and phone lines',
                  'Zero middleman commission fees or restrictive agency contracts',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/products#chat"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
              >
                Learn about Direct Messaging <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}