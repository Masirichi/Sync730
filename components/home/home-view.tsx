// components/home/home-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { ProductsSection } from '@/components/home/products-section';
import { SolutionsSection } from '@/components/home/solutions-section';
import { HeroSection } from '@/components/home/hero-section';
import { LiveStatsBand } from '@/components/home/live-stats-band';
import { BeliefSection } from '@/components/home/belief-section';
import { ForCandidatesSection, LatestJobItem } from '@/components/home/for-candidates-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { LatestRolesSection } from '@/components/home/latest-roles-section';
import { DifferentiatorsSection } from '@/components/home/differentiators-section';
import { ForRecruitersSection } from '@/components/home/for-recruiters-section';
import { SocialProofSection, Testimonial, ApprovedPartner } from '@/components/home/social-proof-section';
import { FaqSection } from '@/components/home/faq-section';
import { FinalCtaSection } from '@/components/home/final-cta-section';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { EnterpriseModal } from '@/components/modals/enterprise-modal';
import { PublicStats } from '@/lib/stats/service';
import { PublicJob } from '@/lib/jobs/service';
import { RemoteJob } from '@/lib/supabase/types';
import { trackEvent } from '@/lib/analytics';

export interface HomeViewProps {
  initialStats: PublicStats;
  latestRoles: LatestJobItem[];
  feedJobs?: PublicJob[];
  tickerJobs?: RemoteJob[];
  testimonials?: Testimonial[];
  partners?: ApprovedPartner[];
}

export function HomeView({
  initialStats,
  latestRoles,
  feedJobs = [],
  tickerJobs = [],
  testimonials = [],
  partners = [],
}: HomeViewProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  // Track initial page view event
  useEffect(() => {
    trackEvent({ name: 'home_view' });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      {/* Universal Header (Sticky, auto-hiding with SyncFlow trigger) */}
      <SiteHeader />

      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {/* 1. Hero: Autonomous AI recruitment for modern engineering teams */}
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 2. Live Stats: Benchmarks and real-time verification activity */}
        <LiveStatsBand initialStats={initialStats} initialJobs={tickerJobs} />

        {/* 3. Products Bento Grid: Full-cycle AI recruitment architecture (#products) */}
        <ProductsSection />

        {/* 4. Solutions Section: Startups, Global Remote, Engineering Leaders (#solutions) */}
        <SolutionsSection />

        {/* 5. Hiring Engine: How top teams hire & Interactive Sample Report (#hiring) */}
        <ForRecruitersSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 6. How It Works: Step-by-step AI recruitment flow */}
        <HowItWorksSection />

        {/* 7. Latest Verified Roles: Live feed for talents and candidates (#find-work) */}
        <LatestRolesSection jobs={feedJobs} rolesLive={initialStats.rolesLive} />

        {/* 8. The Sync730 Difference: Objective technical vetting, zero agency markups */}
        <DifferentiatorsSection />

        {/* 9. Belief & Mission: Headquartered in Abuja, Nigeria · Connecting global opportunity */}
        <BeliefSection />

        {/* 10. For Candidates: Free tools for African talent (SyncFlow, Resume Studio, Mock Coach) */}
        <ForCandidatesSection latestRoles={latestRoles} />

        {/* 11. Social Proof: Testimonials and verified hiring partners */}
        <SocialProofSection testimonials={testimonials} partners={partners} />

        {/* 12. FAQ: Common questions for SaaS employers and candidates */}
        <FaqSection />

        {/* 13. Closing CTA: Transform technical hiring in 72 hours */}
        <FinalCtaSection
          onOpenDemo={() => setDemoOpen(true)}
          talents={initialStats.talents}
        />
      </main>

      {/* Universal Footer */}
      <SiteFooter />

      {/* Modals for Booking a Demo & Enterprise Solutions */}
      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
      <EnterpriseModal open={enterpriseOpen} onOpenChange={setEnterpriseOpen} />
    </div>
  );
}
