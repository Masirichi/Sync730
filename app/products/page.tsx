// app/products/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  Video,
  Columns3,
  MessageSquare,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Terminal,
  MapPin,
  Cpu,
  Zap,
  BarChart3,
  Bot,
} from 'lucide-react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Products — AI Recruitment Platform | Sync730',
  description:
    'Explore the Sync730 AI recruitment product suite: Autonomous Sourcing, AI Video Interviewer, SyncFlow ATS, Direct Recruiter Messaging, and Candidate Tools. Headquartered in Abuja, Nigeria.',
  alternates: {
    canonical: 'https://sync730.com/products',
  },
};

export default function ProductsPage() {
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
                <span>SYNC730 RECRUITMENT CLOUD</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl text-foreground">
                AI recruitment architecture built for technical speed.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Replace manual screening, endless first-round phone calls, and expensive staffing agencies with a modular suite of autonomous AI sourcing, video vetting, and pipeline management tools.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link
                  href="/hiring"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                >
                  Start Hiring with AI
                </Link>
                <Link
                  href="/find-work"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Browse Open Roles
                </Link>
              </div>

              {/* Sub-proof */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>NDPA & GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-orange-500" />
                  <span>Calibrated STAR Rubrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span>Abuja, Nigeria</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 1: AI Autonomous Sourcing */}
        <section id="sourcing" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <Sparkles className="h-6 w-6" />
                </div>
                <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product 01 · Sourcing
                </span>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  AI Autonomous Sourcing & Semantic Matchmaker
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Traditional applicant tracking relies on blunt keyword matching that penalizes great engineers and rewards resume spammers. Sync730 parses true technical competence: GitHub repositories, production architectural experience, and regional remote eligibility.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Semantic matching against technical specifications, not keywords',
                    'Pre-cleared African remote work eligibility across Nigeria, Ghana, Kenya & South Africa',
                    'Direct ranking of active and passive engineering candidates in seconds',
                    'Zero middleman delays or opaque talent agency markups',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Start sourcing candidates <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Box */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-6 sm:p-8">
                <div className="rounded-xl border border-border/80 bg-card p-5 text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3 text-xs font-mono">
                    <span className="text-muted-foreground">ROLE: DISTRIBUTED SYSTEMS LEAD</span>
                    <span className="text-emerald-500 font-semibold">96.4% MATCH</span>
                  </div>
                  <div className="py-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">Go / Rust Concurrency</span>
                      <span className="text-muted-foreground">Verified (9.6 / 10)</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: '96%' }} />
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="font-medium text-foreground">Kafka & Event-Driven Architecture</span>
                      <span className="text-muted-foreground">Verified (9.4 / 10)</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: '94%' }} />
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="font-medium text-foreground">Timezone Overlap (WAT / UTC+1)</span>
                      <span className="text-emerald-500 font-medium">100% Alignment</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                    "Candidate has 4+ years running 50k+ QPS microservices in Abuja & Lagos fintech ecosystem with proven zero-downtime database migrations."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: AI Video & Technical Interviewer */}
        <section id="interview" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Visual Box */}
              <div className="order-2 lg:order-1 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live AI Video Assessment
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Duration: 18m 42s</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-border/70 bg-secondary/50 p-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Question 3 of 5 · System Scalability
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      "How would you handle a partitioned database split-brain scenario during peak traffic?"
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-medium">
                      <span>STAR Technical Depth</span>
                      <span className="text-foreground font-semibold">94 / 100</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Architecture Rubric</span>
                      <span className="text-foreground font-semibold">97 / 100</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Communication Clarity</span>
                      <span className="text-foreground font-semibold">91 / 100</span>
                    </div>
                  </div>

                  <div className="border-t border-border/70 pt-3 text-[11px] text-muted-foreground italic">
                    "Candidate structured answer using STAR methodology: highlighted situation with multi-region cluster, proposed quorum-based fencing tokens, and cited benchmark recovery metrics."
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <Video className="h-6 w-6" />
                </div>
                <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product 02 · Automated Screening
                </span>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  AI Video & Technical Interviewer
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Conduct structured, unbiased first-round technical interviews on autopilot. Our conversational AI engages applicants with dynamic, contextual follow-up questions tailored to their resume and your required tech stack.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Calibrated STAR scoring: Situation, Task, Action, and Measurable Result',
                    'Interactive coding challenges and architecture design sandboxes',
                    'Tamper-proof identity verification and anti-cheating anomaly detection',
                    'Video recordings with searchable transcript highlights and timestamps',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    See how AI interviews work <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3: SyncFlow ATS */}
        <section id="syncflow" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <Columns3 className="h-6 w-6" />
                </div>
                <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product 03 · Pipeline Management
                </span>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  SyncFlow ATS & Talent CRM
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Say goodbye to bloated enterprise ATS platforms that slow down technical recruiting. SyncFlow gives founders and hiring managers an agile Kanban pipeline engineered for rapid technical evaluations and team collaboration.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Drag-and-drop pipeline stages: Sourced, Screened, Technical Sync, Offer',
                    'Shared recruiter scorecards, private notes, and candidate tags',
                    'Automated candidate status notifications so nobody gets ghosted',
                    'Comprehensive candidate audit log and pipeline velocity metrics',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Try SyncFlow ATS <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Box */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-6 sm:p-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/70 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>SyncFlow Pipeline</span>
                    <span>4 Active Roles</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-border/80 bg-card p-3">
                      <p className="font-semibold text-foreground">AI Screened</p>
                      <p className="text-muted-foreground mt-0.5">8 Candidates</p>
                      <div className="mt-2 rounded border border-border/60 bg-secondary/50 p-2 text-[11px]">
                        <p className="font-medium text-foreground">Senior Backend</p>
                        <p className="text-emerald-500 font-semibold">96% Score</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/80 bg-card p-3">
                      <p className="font-semibold text-foreground">Final Round</p>
                      <p className="text-muted-foreground mt-0.5">3 Candidates</p>
                      <div className="mt-2 rounded border border-border/60 bg-secondary/50 p-2 text-[11px]">
                        <p className="font-medium text-foreground">Staff DevOps</p>
                        <p className="text-emerald-500 font-semibold">94% Score</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/80 bg-card p-3">
                      <p className="font-semibold text-foreground">Offer Sent</p>
                      <p className="text-muted-foreground mt-0.5">1 Candidate</p>
                      <div className="mt-2 rounded border border-border/60 bg-emerald-500/10 p-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Mobile Lead Accepted
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 4: Direct Recruiter Messaging */}
        <section id="chat" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      EO
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Emeka O. · Senior Full-Stack</p>
                      <p className="text-[10px] text-muted-foreground">Abuja, Nigeria · Online</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold">
                    Direct Thread
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="rounded-lg bg-secondary/50 p-3 max-w-[85%] text-foreground">
                    "Hi! We reviewed your AI technical screen on Next.js and Postgres concurrency. Loved the approach to connection pooling."
                  </div>
                  <div className="ml-auto rounded-lg bg-foreground text-background p-3 max-w-[85%]">
                    "Thanks! Glad you liked the pool optimization. Happy to walk through the architecture on a quick sync."
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Product 04 · Direct Communication
                </span>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  Direct Recruiter Messaging & Candidate Dossiers
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  No middleman agents standing between you and great engineers. Communicate directly with candidates, share role details, schedule technical chats, and unlock complete unredacted portfolios.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Instant direct in-app messaging between hiring teams and vetted engineers',
                    'Full candidate dossier unlocking with validated GitHub, contact, and compensation goals',
                    'Quick interview calendar coordination without leaving the recruiter dashboard',
                    'Zero hidden agency surcharges or placement commissions',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Connect with candidates <ArrowRight className="h-4 w-4" />
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
              Ready to modernize your technical recruitment?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-xl mx-auto">
              Join leading tech startups and global remote companies hiring Africa's top 2% engineering talent in 72 hours.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/hiring"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-95 transition-all"
              >
                Start Hiring with AI
              </Link>
              <Link
                href="/find-work"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-7 text-sm font-semibold text-background hover:bg-background/10 transition-colors"
              >
                Find Work as a Candidate
              </Link>
            </div>

            <p className="mt-6 text-xs text-background/60">
              Abuja, Nigeria · Calibrated AI evaluations · Humans make 100% of final hiring choices
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}