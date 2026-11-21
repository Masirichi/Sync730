// app/solutions/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Rocket,
  Globe2,
  Code2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingUp,
  MapPin,
  Cpu,
  Layers,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Solutions — AI Recruitment for Startups & Global Teams | Sync730',
  description:
    'Tailored AI recruitment solutions for high-growth startups, global remote enterprises, and engineering leaders hiring Africa’s top technical talent with rapid velocity. Headquartered in Nigeria.',
  alternates: {
    canonical: 'https://sync730.com/solutions',
  },
};

export default function SolutionsPage() {
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
                <span>SOLUTIONS BY USE CASE</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl text-foreground">
                Engineered for how high-velocity teams hire.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Whether you are a venture-backed startup needing senior engineers in days or an international enterprise scaling distributed engineering hubs across Africa, Sync730 removes traditional hiring friction.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link
                  href="/hiring"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                >
                  Start Hiring with AI
                </Link>
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Explore AI Platform
                </Link>
              </div>

              {/* Sub-proof */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Rapid Avg. Time-to-Hire</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>94.6% Final Pass Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-orange-500" />
                  <span>Nigeria · Pan-African Hubs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution 1: Startups */}
        <section id="startups" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  Seed to Series B
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  For High-Growth Startups
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Startups cannot afford 45-day hiring cycles or traditional ₦15,000,000 agency retainers. Sync730 gives lean founders and engineering leads pre-vetted senior software engineers ready to ship code on day one.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Zero upfront agency fees or long-term restrictive contracts',
                    'Accelerated turnaround from role posting to interviewed shortlist',
                    'Full candidate dossiers with recorded video screens and verified code repositories',
                    'Flexible token model: only pay when you choose to unlock candidate dossiers',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Hire startup engineering talent <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Startup Metric Card */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-8 sm:p-10">
                <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Startup ROI Comparison
                  </span>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-b border-border/70 pb-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">Rapid</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Sync730 Time-to-Hire</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-muted-foreground line-through">45 Days</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Traditional Agencies</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm font-medium text-foreground">
                      "We scaled our backend microservices team in 4 days with Sync730. The AI video screenings saved us at least 30 engineering hours."
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      — CTO, FinTech Series A Startup
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution 2: Global Remote Teams */}
        <section id="global-teams" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1 rounded-2xl border border-border/80 bg-card p-8 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Global Distributed Coverage
                </span>
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Timezone Alignment</span>
                      <span className="text-emerald-500">WAT / CAT / EAT</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      4–6 hours daily overlap with UK (GMT), Central Europe (CET), and US East Coast (EST).
                    </p>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Verified African Tech Hubs</span>
                      <span className="text-foreground">10,000+ Engineers</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lagos, Nairobi, Cape Town, Johannesburg, Kigali, and Accra.
                    </p>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Compliance & Privacy</span>
                      <span className="text-emerald-500">NDPA & GDPR</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Compliant remote contracts, identity checks, and data sovereignty safeguards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  Global Remote Enterprises
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  For Global Distributed Enterprises
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  International technology firms are aggressively hiring African software engineers to scale resilient distributed teams. Sync730 provides pre-cleared eligibility, verified work track records, and zero recruitment friction.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Direct access to Africa’s premier engineering talent pool with proven production experience',
                    'Pre-screened remote eligibility and verified legal identities',
                    'Overlapping business hours with European and North American distributed teams',
                    'Enterprise security, custom billing, and dedicated account support',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Build your remote African team <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution 3: Engineering Leaders */}
        <section id="engineering" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                  CTOs & Tech Leads
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                  For CTOs & Engineering Leaders
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Senior engineers hate conducting repetitive first-round screens that lead to candidate mismatches. Sync730 conducts calibrated AI video assessments so your team only interviews final-round contenders.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Objective evaluation across Technical Depth, Systems Architecture, and STAR Communication',
                    'Interactive algorithmic debugging and live code sandboxing',
                    'Timestamped video answers with transparent evidence citations',
                    'Human-in-the-loop: AI produces deep analysis; your engineers make 100% of final decisions',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/hiring"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                  >
                    Calibrate your role rubric <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Engineering Scorecard Preview */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-8 sm:p-10">
                <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Calibrated Technical Scorecard
                    </span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      94.6% Pass Rate
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-medium">
                        <span>Systems Architecture & Concurrency</span>
                        <span className="font-semibold text-foreground">96 / 100</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: '96%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium">
                        <span>Database Scalability & Sharding</span>
                        <span className="font-semibold text-foreground">93 / 100</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: '93%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium">
                        <span>STAR Problem Solving & Retrospectives</span>
                        <span className="font-semibold text-foreground">91 / 100</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: '91%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                    "Candidate solved distributed deadlock reproduction and explained lock ordering strategy clearly."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Matrix Table */}
        <section className="border-b border-border/70 py-20 sm:py-28 bg-secondary/10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                MARKET BENCHMARK
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Why modern teams choose Sync730.
              </h2>
            </div>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full border-collapse border border-border/80 text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-secondary/60">
                    <th className="p-4 sm:p-5 font-semibold text-foreground">Hiring Metric</th>
                    <th className="p-4 sm:p-5 font-bold text-foreground bg-foreground/5 border-x border-border/80">
                      Sync730 AI Platform
                    </th>
                    <th className="p-4 sm:p-5 font-medium text-muted-foreground">Traditional Staffing Agencies</th>
                    <th className="p-4 sm:p-5 font-medium text-muted-foreground">Manual In-House Sifting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  <tr>
                    <td className="p-4 sm:p-5 font-medium text-foreground">Time to First Shortlist</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-foreground/5 border-x border-border/80">
                      Rapid On-Demand
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">3 to 6 Weeks</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">3 to 4 Weeks</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-medium text-foreground">Cost per Hire</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-foreground/5 border-x border-border/80">
                      Transparent tokens / no retainers
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">20% – 30% first year salary</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">80+ hours of team distraction</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-medium text-foreground">Screening Method</td>
                    <td className="p-4 sm:p-5 font-bold text-foreground bg-foreground/5 border-x border-border/80">
                      Calibrated 20-min AI Video & STAR code rubrics
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">Non-technical recruiter phone screens</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">Manual resume keyword skimming</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-medium text-foreground">Final Round Pass Rate</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-foreground/5 border-x border-border/80">
                      94.6% Pass Rate
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">~30% Pass Rate</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">~40% Pass Rate</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-medium text-foreground">Candidate Eligibility</td>
                    <td className="p-4 sm:p-5 font-bold text-foreground bg-foreground/5 border-x border-border/80">
                      100% Pre-cleared African remote eligibility
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">Unknown until offer stage</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">High candidate drop-off rate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-foreground text-background py-20 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-background">
              Find the perfect recruitment solution for your team.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-xl mx-auto">
              Start hiring vetted software engineers rapidly with verified dossiers.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/hiring"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-95 transition-all"
              >
                Start Free Trial
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-full border border-background/40 bg-transparent px-7 text-sm font-semibold text-background hover:bg-background/10 transition-colors"
              >
                View AI Product Suite
              </Link>
            </div>

            <p className="mt-6 text-xs text-background/60">
              Nigeria · Zero agency markups · Calibrated technical rubrics
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}