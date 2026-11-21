// app/hiring/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Video,
  MessageSquare,
  Users,
  MapPin,
  Clock,
  Zap,
  Building2,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Hiring — AI Recruitment Platform & Talent Engine | Sync730',
  description:
    'Hire Africa’s top 2% software engineers with rapid velocity. Powered by autonomous AI video screening, calibrated STAR rubrics, and direct recruiter chat. Headquartered in Abuja, Nigeria.',
  alternates: {
    canonical: 'https://sync730.com/hiring',
  },
};

export default function HiringPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      <SiteHeader />

      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/70 bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                <span>AI RECRUITMENT FOR EMPLOYERS</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl text-foreground">
                Hire Africa’s top 2% technical talent rapidly.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Sync730 replaces manual resume sorting with calibrated AI video interviews, real-world code evaluations, and verified candidate dossiers. Zero headhunter commissions.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link
                  href="/register/recruiter"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/console/talent"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Browse Vetted Talent Pool
                </Link>
              </div>

              {/* Sub-proof */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Rapid Avg. Time-to-Hire</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>0% Placement Commissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span>Abuja, Nigeria</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Hiring Workflow */}
        <section className="border-b border-border/70 py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                HOW RECRUITING WORKS
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                From role posting to verified hire in 4 steps.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">01</span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Define Role & Calibrate</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Set your seniority expectations, core tech stack (e.g. Go, React, Python, Kubernetes), and custom architecture interview rubrics.
                  </p>
                </div>
                <div className="mt-6 border-t border-border/70 pt-4 text-[11px] font-medium text-foreground">
                  Custom STAR scoring rubrics
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">02</span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Autonomous AI Screen</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Our AI conducts adaptive 20-minute video screens, testing system architecture and live coding with tamper-proof integrity checks.
                  </p>
                </div>
                <div className="mt-6 border-t border-border/70 pt-4 text-[11px] font-medium text-foreground">
                  Zero engineering hours spent
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">03</span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Review Ranked Dossiers</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Access transparent candidate scorecards, recorded video responses, verified GitHub repositories, and compensation expectations.
                  </p>
                </div>
                <div className="mt-6 border-t border-border/70 pt-4 text-[11px] font-medium text-foreground">
                  94.6% final interview pass rate
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">04</span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Direct Chat & Final Hire</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Chat directly with candidates through your recruiter console, schedule final culture syncs, and extend competitive offers.
                  </p>
                </div>
                <div className="mt-6 border-t border-border/70 pt-4 text-[11px] font-medium text-foreground">
                  Direct connection, 0% commission
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & Token Model */}
        <section id="pricing" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl text-center mx-auto">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                SIMPLE, TRANSPARENT PRICING
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pay only for verified talent matches.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                No $25,000 headhunter retainers. Unlock complete candidate dossiers on demand or subscribe for team volume.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Plan 1 */}
              <div className="rounded-2xl border border-border/80 bg-card p-8 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Pay As You Hire</h3>
                  <p className="text-xs text-muted-foreground mt-1">For startups making 1-2 urgent technical hires.</p>
                  <div className="mt-6">
                    <span className="text-3xl font-bold text-foreground">Token-Based</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-muted-foreground border-t border-border/70 pt-6">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Post unlimited technical roles</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Autonomous AI video screening</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Pay tokens only to unlock dossiers & chat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Full video recordings & code analysis</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/register/recruiter"
                    className="w-full inline-flex h-11 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    Start with Tokens
                  </Link>
                </div>
              </div>

              {/* Plan 2: Growth */}
              <div className="rounded-2xl border-2 border-foreground bg-card p-8 flex flex-col justify-between shadow-lg relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
                  Most Popular
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Growth Team</h3>
                  <p className="text-xs text-muted-foreground mt-1">For scaling engineering teams hiring 3-8 engineers.</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">$499</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-muted-foreground border-t border-border/70 pt-6">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Includes 20 candidate unlock tokens</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Custom AI video rubric calibration</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Unlimited SyncFlow ATS team seats</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Priority candidate matching & talent leads</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/register/recruiter"
                    className="w-full inline-flex h-11 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-xs font-semibold text-white shadow-md shadow-orange-500/25 active:scale-95 transition-all"
                  >
                    Get Started with Growth
                  </Link>
                </div>
              </div>

              {/* Plan 3: Enterprise */}
              <div className="rounded-2xl border border-border/80 bg-card p-8 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-1">For global remote companies with large hiring needs.</p>
                  <div className="mt-6">
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-muted-foreground border-t border-border/70 pt-6">
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Dedicated talent pipeline lead</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Direct ATS integrations (Greenhouse, Ashby, Lever)</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Custom NDPA / GDPR data contracts</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>SLA guarantees on rapid shortlist delivery</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/contact"
                    className="w-full inline-flex h-11 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    Contact Enterprise Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-foreground text-background py-20 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-background">
              Start building your technical team today.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-xl mx-auto">
              Join founders and hiring managers who hire senior engineers rapidly with verified dossiers.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register/recruiter"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-95 transition-all"
              >
                Create Recruiter Account
              </Link>
              <Link
                href="/console/talent"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-7 text-sm font-semibold text-background hover:bg-background/10 transition-colors"
              >
                Browse Vetted Candidates
              </Link>
            </div>

            <p className="mt-6 text-xs text-background/60">
              Abuja, Nigeria · 0% Placement Commissions · Humans make every final hiring decision
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}