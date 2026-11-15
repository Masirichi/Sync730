// components/home/home-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
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
        {/* TOP HALF: */}
        {/* 1. Hero: Talent is everywhere. Real opportunity should be too. */}
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 2. Live Stats: LIVE ON SYNC730 counter cells and live stream */}
        <LiveStatsBand initialStats={initialStats} initialJobs={tickerJobs} />

        {/* 3. Belief: WHY WE EXIST. Where you live shouldn't decide what you can become. */}
        <BeliefSection />

        {/* 4. For Candidates: FOR THE ONES WHO'VE BEEN GHOSTED (#for-candidates) */}
        <ForCandidatesSection latestRoles={latestRoles} />

        {/* 5. How It Works: Four steps (#how-it-works) */}
        <HowItWorksSection />

        {/* BOTTOM HALF (Continuing after "How it works"): */}
        {/* 6. Latest roles: HIRING NOW · LIVE FEED with 3 to 6 newest public jobs */}
        <LatestRolesSection jobs={feedJobs} rolesLive={initialStats.rolesLive} />

        {/* 7. Differentiators: THE SYNC730 DIFFERENCE. No false hope. Just real roles. */}
        <DifferentiatorsSection />

        {/* 8. For Recruiters: WE BELIEVE IN HIRING THE PERSON, NOT THE ADDRESS (#for-recruiters) */}
        <ForRecruitersSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 9. Social Proof: FROM THE PEOPLE USING IT (conditionally rendered only if real data exists) */}
        <SocialProofSection testimonials={testimonials} partners={partners} />

        {/* 10. FAQ: QUESTIONS WE HEAR OFTEN (accessible accordion + FAQPage JSON-LD) */}
        <FaqSection />

        {/* 11. Closing CTA: You've waited long enough for a fair shot. */}
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
