// components/home/hero-section.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { HOME_CONTENT } from '@/src/content/home';
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
  const { hero } = HOME_CONTENT;

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
          {/* Eyebrow with leading rule line */}
          <div className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:mb-8">
            <span className="h-px w-8 bg-foreground" aria-hidden="true" />
            <span>{hero.eyebrow}</span>
          </div>

          {/* H1: Exactly one h1 on the entire page */}
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl sm:leading-[1.02] lg:text-[76px] lg:leading-[1.01] text-foreground">
            {hero.h1}
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg sm:leading-8">
            {hero.sub}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3.5 sm:mt-10 sm:flex-row sm:items-center">
            <Link
              href={hero.ctaPrimaryHref}
              onClick={handleJobsClick}
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              {hero.ctaPrimary}
            </Link>
            <Link
              href={hero.ctaSecondaryHref}
              onClick={handleHiringClick}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              {hero.ctaSecondary}
            </Link>
          </div>

          {/* Proof line: Plain text items separated by thin vertical dividers (No checkmark icons/emojis) */}
          <div className="mt-10 flex flex-wrap items-center gap-y-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:mt-12">
            {hero.proofItems.map((item, idx) => (
              <React.Fragment key={item}>
                {idx > 0 && (
                  <span className="mx-3.5 h-3.5 w-px bg-border/80" aria-hidden="true" />
                )}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Column: Hero Visual with Light-Gray Circles & Static Sample Job Card */}
        <div className="relative flex min-h-[400px] items-center justify-center sm:min-h-[460px] lg:min-h-[500px] lg:justify-end">
          {/* Subtle light-gray decorative framing circles behind the card */}
          <div
            className="absolute left-2 top-4 h-60 w-60 rounded-full border border-border/80 sm:left-6 sm:top-6 sm:h-72 sm:w-72"
            aria-hidden="true"
          />
          <div
            className="absolute left-10 top-12 h-60 w-60 rounded-full bg-secondary/80 sm:left-16 sm:top-16 sm:h-72 sm:w-72"
            aria-hidden="true"
          />

          {/* Static Sample Job Card Container */}
          <div className="relative z-10 w-full max-w-md">
            {/* Header pill labelling it as "Sample" */}
            <div className="mb-2 flex items-center justify-end">
              <span className="rounded-full border border-border/80 bg-background/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-xs backdrop-blur-xs">
                {hero.sampleBadge}
              </span>
            </div>

            {/* Reusable JobCard displaying verified eligibility */}
            <div className="pointer-events-auto shadow-[12px_12px_0_hsl(var(--secondary))] transition-shadow sm:shadow-[16px_16px_0_hsl(var(--secondary))]">
              <JobCard
                job={SAMPLE_HERO_JOB}
                variant="standard"
                isSaved={false}
                isApplied={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
