// components/home/hero-section.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  MessageSquare,
  Video,
  CheckCircle2,
  MapPin,
  Code2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
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
  const [activeTab, setActiveTab] = useState<'dossier' | 'job'>('dossier');

  const handleJobsClick = () => {
    trackEvent({ name: 'cta_find_work_click' });
  };

  const handleHiringClick = () => {
    trackEvent({ name: 'cta_book_demo_click', location: 'hero' });
    if (onOpenDemo) onOpenDemo();
  };

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10 lg:py-24 items-center">
        {/* Left Column: Headlines & Positioning */}
        <div className="max-w-2xl">
          {/* Eyebrow with CoreShift orange glowing pill */}
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span>{hero.eyebrow}</span>
            </div>
          </div>

          {/* H1: Exactly one h1 on the entire page */}
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl sm:leading-[1.02] lg:text-[72px] lg:leading-[1.01] text-foreground">
            Autonomous AI recruitment for{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
              modern engineering teams.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8">
            {hero.sub}
          </p>

          {/* Action Buttons: Vibrant CoreShift Orange Primary */}
          <div className="mt-8 flex flex-col gap-3.5 sm:mt-10 sm:flex-row sm:items-center">
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
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Looking for remote engineering roles?</span>
            <Link
              href="/find-work"
              onClick={handleJobsClick}
              className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-4 transition-colors inline-flex items-center gap-1"
            >
              Find Work <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Proof line: One line, middle dots, muted text */}
          <p className="mt-8 text-xs font-medium text-muted-foreground sm:mt-10">
            {hero.proofLine}
          </p>
        </div>

        {/* Right Column: Interactive SaaS AI Candidate Dossier & Video Assessment Preview */}
        <div className="relative flex min-h-[460px] items-center justify-center lg:justify-end">
          {/* Outcrowd CoreShift ambient orange radiance */}
          <div
            className="absolute -right-8 -top-8 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Subtle light-gray decorative framing circles behind the card */}
          <div
            className="absolute -left-2 top-4 h-64 w-64 rounded-full border border-border/80 sm:left-4 sm:top-6 sm:h-72 sm:w-72"
            aria-hidden="true"
          />
          <div
            className="absolute left-6 top-10 h-64 w-64 rounded-full bg-secondary/80 sm:left-12 sm:top-14 sm:h-72 sm:w-72"
            aria-hidden="true"
          />

          {/* Main SaaS Card Container */}
          <div className="relative z-10 w-full max-w-md">
            {/* View Switcher: AI Dossier vs Job Card */}
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex rounded-full border border-border/70 bg-background/95 p-0.5 text-[11px] font-medium backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('dossier')}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    activeTab === 'dossier'
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  AI Match Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('job')}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    activeTab === 'job'
                      ? 'bg-foreground text-background font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Verified Role Card
                </button>
              </div>

              <span className="rounded-full border border-border/80 bg-background/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-xs">
                Verified Talent
              </span>
            </div>

            {/* Content: Active View */}
            {activeTab === 'dossier' ? (
              <div className="rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-[12px_12px_0_hsl(var(--secondary))] transition-all sm:shadow-[16px_16px_0_hsl(var(--secondary))]">
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                      AO
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
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

                {/* AI Evidence Quote */}
                <div className="mt-3.5 border-t border-border/70 pt-3">
                  <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                    "Candidate formulated raft consensus edge recovery under 100k req/sec load with zero deadlock vulnerabilities. Identity verified."
                  </p>
                </div>

                {/* Action Buttons: Direct Chat & Interview Recording */}
                <div className="mt-4 flex items-center gap-2 pt-1">
                  <Link
                    href="/hiring"
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#FF5500] hover:bg-[#E64D00] px-4 text-xs font-semibold text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Direct Chat</span>
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
            ) : (
              <div className="pointer-events-auto shadow-[12px_12px_0_hsl(var(--secondary))] transition-shadow sm:shadow-[16px_16px_0_hsl(var(--secondary))]">
                <JobCard
                  job={SAMPLE_HERO_JOB}
                  variant="standard"
                  isSaved={false}
                  isApplied={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
