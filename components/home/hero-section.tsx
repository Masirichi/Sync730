// components/home/hero-section.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  MessageSquare,
  Video,
  Check,
  CheckCircle2,
  MapPin,
  Code2,
  Lightbulb,
  ShieldCheck,
  Eye,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { homeCopy } from '@/content/home';
import { JobCard } from '@/components/jobs/job-card';

interface HeroSectionProps {
  onOpenDemo?: () => void;
}

const SAMPLE_HERO_JOB: any = {
  id: 'sample-hero-role',
  slug: 'senior-full-stack-engineer-stripe',
  title: 'Senior Full-Stack Engineer',
  company: 'Stripe International',
  company_name: 'Stripe International',
  company_logo: undefined,
  salary: '$4,500 – $6,200 / mo',
  salary_min: 4500,
  salary_max: 6200,
  salary_currency: 'USD',
  salary_period: 'mo',
  modality: 'Remote',
  location: 'Worldwide Remote',
  location_rule: 'Worldwide Remote',
  employment_type: 'Full-time',
  is_featured: false,
  role_verified: true,
  roleVerifiedAt: new Date().toISOString(),
  eligibility: {
    scope: 'countries',
    countries: ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa', 'Uganda', 'Egypt'],
  },
  eligible_countries: ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa', 'Uganda', 'Egypt'],
  skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
  summary:
    'Build responsive web applications and resilient payment integrations with our distributed team.',
  posted_date: new Date(Date.now() - 3600000 * 2).toISOString(),
  apply_url: '/find-work',
};

export function HeroSection({ onOpenDemo }: HeroSectionProps) {
  const { hero } = homeCopy;
  const [activeTab, setActiveTab] = useState<'network' | 'dossier'>('network');
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const handleJobsClick = () => {
    trackEvent({ name: 'cta_find_work_click' });
  };

  const handleHiringClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'hero' });
    if (onOpenDemo) onOpenDemo();
  };

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-background text-foreground pt-12 pb-20 sm:pt-16 sm:pb-28">
      {/* Outcrowd CoreShift ambient orange background radiance */}
      <div
        className="absolute left-1/2 top-12 -translate-x-1/2 h-[500px] w-[500px] sm:w-[700px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* CoreShift Outer Card Frame */}
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 md:p-14 shadow-2xl shadow-black/5 backdrop-blur-xl">
          {/* Eyebrow Pill: A — ATTENTION */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span>{hero.eyebrow}</span>
            </div>
          </div>

          {/* View Mode Toggle: CoreShift Network vs AI Candidate Dossier */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-full border border-border/70 bg-background/90 p-1 text-xs font-medium backdrop-blur-sm shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  activeTab === 'network'
                    ? 'bg-[#FF5500] text-white font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                CoreShift Platform Hub
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dossier')}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  activeTab === 'dossier'
                    ? 'bg-[#FF5500] text-white font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Live Candidate Match Dossier
              </button>
            </div>
          </div>

          {/* VIEW 1: CoreShift Interconnected Platform Network (Outcrowd Inspiration) */}
          {activeTab === 'network' ? (
            <div className="relative mx-auto w-full max-w-3xl py-6">
              {/* Network Stage Container */}
              <div className="relative h-[280px] sm:h-[320px] md:h-[350px] w-full flex items-center justify-center">
                {/* SVG Circuit Connectors */}
                <svg
                  className="absolute inset-0 h-full w-full pointer-events-none"
                  viewBox="0 0 800 350"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Left Branches */}
                  <path
                    d="M 400 175 L 290 175 L 230 75"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 400 175 L 140 175"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                  />
                  <path
                    d="M 400 175 L 290 175 L 230 275"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Right Branches */}
                  <path
                    d="M 400 175 L 510 175 L 570 75"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 400 175 L 660 175"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                  />
                  <path
                    d="M 400 175 L 510 175 L 570 275"
                    stroke="currentColor"
                    className="text-border dark:text-border/60"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Junction Dots with Orange Accents */}
                  <circle cx="290" cy="175" r="4" className="fill-orange-500" />
                  <circle cx="230" cy="75" r="3.5" className="fill-amber-400" />
                  <circle cx="140" cy="175" r="3.5" className="fill-indigo-500" />
                  <circle cx="230" cy="275" r="3.5" className="fill-sky-400" />

                  <circle cx="510" cy="175" r="4" className="fill-orange-500" />
                  <circle cx="570" cy="75" r="3.5" className="fill-orange-500" />
                  <circle cx="660" cy="175" r="3.5" className="fill-foreground/40" />
                  <circle cx="570" cy="275" r="3.5" className="fill-emerald-400" />
                </svg>

                {/* SATELLITE 1: Top-Left (Amber Lightbulb / Smart AI Sourcing) */}
                <div
                  onMouseEnter={() => setActiveNode('sourcing')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute left-[16%] sm:left-[22%] top-[8%] sm:top-[12%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-500 shadow-lg shadow-amber-500/10 transition-transform group-hover:scale-110">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Smart Sourcing · Live ATS Indexing
                  </div>
                </div>

                {/* SATELLITE 2: Mid-Left (Senior Backend Engineer Avatar) */}
                <div
                  onMouseEnter={() => setActiveNode('backend')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute left-[4%] sm:left-[8%] top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className="relative">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-neutral-800 to-neutral-900 text-white font-bold text-sm shadow-xl transition-transform group-hover:scale-105">
                      <span>DO</span>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    David O. · Senior Backend Engineer (96% Match)
                  </div>
                </div>

                {/* SATELLITE 3: Bottom-Left (Cyan / Tech Stack Intelligence) */}
                <div
                  onMouseEnter={() => setActiveNode('stack')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute left-[16%] sm:left-[22%] bottom-[8%] sm:bottom-[12%] -translate-x-1/2 translate-y-1/2 group cursor-pointer"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/15 text-sky-500 shadow-lg shadow-sky-500/10 transition-transform group-hover:scale-110">
                    <Code2 className="h-6 w-6" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Verified Stacks · Go, Rust, React, Kafka
                  </div>
                </div>

                {/* CENTER HUB: Large Purple Squircle with Checkmark (CoreShift Signature) */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-2xl shadow-indigo-500/30 transition-transform hover:scale-105">
                    {/* Glowing outer pulse */}
                    <span className="absolute -inset-2 rounded-[32px] border border-purple-500/30 animate-pulse pointer-events-none" />
                    
                    {/* White Circular Center Check Badge */}
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-purple-700 shadow-md">
                      <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                  </div>
                  <div className="mt-2.5 rounded-full border border-border/60 bg-background/90 px-3 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase shadow-xs">
                    Sync730 Core AI
                  </div>
                </div>

                {/* SATELLITE 4: Top-Right (Coral/Orange Shield / STAR Vetting) */}
                <div
                  onMouseEnter={() => setActiveNode('vetting')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute right-[16%] sm:right-[22%] top-[8%] sm:top-[12%] translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/15 text-orange-500 shadow-lg shadow-orange-500/10 transition-transform group-hover:scale-110">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Calibrated STAR Vetting · 0 Integrity Flags
                  </div>
                </div>

                {/* SATELLITE 5: Mid-Right (Cloud & Infrastructure Lead Avatar) */}
                <div
                  onMouseEnter={() => setActiveNode('cloud')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute right-[16%] sm:right-[22%] bottom-[8%] sm:bottom-[12%] translate-x-1/2 translate-y-1/2 group cursor-pointer"
                >
                  <div className="relative">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-amber-700 to-orange-800 text-white font-bold text-sm shadow-xl transition-transform group-hover:scale-105">
                      <span>AK</span>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Amina K. · Cloud & DevOps Lead (94% Match)
                  </div>
                </div>

                {/* SATELLITE 6: Far-Right (Clean White Card / ATS Tracking Radar) */}
                <div
                  onMouseEnter={() => setActiveNode('tracking')}
                  onMouseLeave={() => setActiveNode(null)}
                  className="absolute right-[4%] sm:right-[8%] top-1/2 translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border/80 bg-card text-foreground shadow-lg shadow-black/5 transition-transform group-hover:scale-110">
                    <Eye className="h-6 w-6 text-foreground/80" />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/80 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Real-time ATS Tracking & Direct Chat
                  </div>
                </div>
              </div>

              {/* Dynamic Status Capsule based on Active Node */}
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span>
                    {activeNode === 'sourcing' && 'Autonomous ATS crawler indexing live engineering roles across 18+ boards.'}
                    {activeNode === 'backend' && 'David O. · Senior Backend Engineer · 7+ yrs Go/Kafka · Lagos (WAT).'}
                    {activeNode === 'stack' && 'Codebase intelligence evaluates actual GitHub PRs and system architecture.'}
                    {activeNode === 'vetting' && '20-min calibrated STAR video interviews with transparent rubric evidence.'}
                    {activeNode === 'cloud' && 'Amina K. · Cloud Architect · Kubernetes/AWS · Nairobi (EAT).'}
                    {activeNode === 'tracking' && 'Direct recruiter messaging tab and automated offer delivery.'}
                    {!activeNode && 'Hover any node to inspect autonomous vetting, sourcing, and candidate profiles.'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: Interactive Candidate Match Dossier */
            <div className="relative mx-auto max-w-xl py-4">
              <div className="rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-xl transition-all">
                {/* Header status bar */}
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      AI Sourcing & Vetting Engine
                    </span>
                  </div>
                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                    96% Match
                  </span>
                </div>

                {/* Candidate Summary */}
                <div className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        Senior Distributed Systems Engineer
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span>Abuja, Nigeria · Worldwide Remote</span>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                      DO
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    7+ years scaling high-throughput payment gateways, fault-tolerant Go & Rust microservices, and Kubernetes clusters.
                  </p>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1.5 py-2">
                  {['Go', 'Rust', 'Kafka', 'Kubernetes', 'gRPC', 'Distributed Consensus'].map((s) => (
                    <span
                      key={s}
                      className="rounded border border-border/60 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-foreground hover:border-orange-500/40 transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Calibrated AI Video Assessment Metrics */}
                <div className="mt-3 space-y-2.5 rounded-xl border border-border/70 bg-secondary/30 p-3.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Technical Depth</span>
                    <span className="font-semibold text-foreground tabular-nums">94 / 100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                    <div className="h-full rounded-full bg-foreground" style={{ width: '94%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium pt-1">
                    <span className="text-muted-foreground">System Architecture</span>
                    <span className="font-semibold text-orange-500 tabular-nums">97 / 100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: '97%' }} />
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium pt-1">
                    <span className="text-muted-foreground">STAR Communication</span>
                    <span className="font-semibold text-foreground tabular-nums">91 / 100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                    <div className="h-full rounded-full bg-foreground" style={{ width: '91%' }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2 pt-1">
                  <Link
                    href="/hiring"
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-4 text-xs font-semibold text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Direct Chat with Talent</span>
                  </Link>
                  <Link
                    href="/hiring"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/80 bg-background px-4 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>View Interview</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Central Title (CoreShift Style: "All-in-one AI recruitment platform") */}
          <div className="mt-6 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl sm:leading-[1.04] lg:text-[68px] lg:leading-[1.02] text-foreground">
              All-in-one{' '}
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
                AI recruitment platform
              </span>
            </h1>

            {/* Subhead */}
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-8">
              {hero.sub}
            </p>

            {/* Action Buttons: Vibrant CoreShift Orange Primary */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:mt-10 sm:flex-row">
              <Link
                href={hero.ctaPrimaryHref}
                onClick={handleHiringClick}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {hero.ctaPrimary}
              </Link>
              <Link
                href={hero.ctaSecondaryHref}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-border/80 bg-background/80 hover:bg-secondary px-8 text-sm font-semibold text-foreground hover:border-foreground/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                {hero.ctaSecondary}
              </Link>
            </div>

            {/* Secondary Candidate Link */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Looking for remote engineering roles?</span>
              <Link
                href="/find-work"
                onClick={handleJobsClick}
                className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-4 transition-colors inline-flex items-center gap-1"
              >
                Find Work <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Proof line */}
            <p className="mt-8 text-xs font-medium text-muted-foreground sm:mt-10">
              {hero.proofLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
