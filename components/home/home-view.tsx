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
import { ForRecruitersSection } from '@/components/home/for-recruiters-section';
import { StartWhereYouAreSection } from '@/components/home/start-where-you-are-section';
import { TrustSection } from '@/components/home/trust-section';
import { FaqSection } from '@/components/home/faq-section';
import { FinalCtaSection } from '@/components/home/final-cta-section';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { EnterpriseModal } from '@/components/modals/enterprise-modal';
import { ApprovedProof } from '@/components/proof/approved-proof';
import { PublicStats } from '@/lib/stats/service';
import { RemoteJob } from '@/lib/supabase/types';
import { trackEvent } from '@/lib/analytics';

interface HomeViewProps {
  initialStats: PublicStats;
  latestRoles: LatestJobItem[];
  tickerJobs?: RemoteJob[];
}

export function HomeView({ initialStats, latestRoles, tickerJobs = [] }: HomeViewProps) {
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

        {/* Part B: For Recruiters (#for-recruiters) */}
        <ForRecruitersSection onOpenDemo={() => setDemoOpen(true)} />

        {/* Part B: Optional Verified Proof Component */}
        <ApprovedProof />

        {/* Part B: Start Where You Are */}
        <StartWhereYouAreSection
          onOpenDemo={() => setDemoOpen(true)}
          onOpenEnterprise={() => setEnterpriseOpen(true)}
        />

        {/* Part B: Trust */}
        <TrustSection />

        {/* Part B: FAQ */}
        <FaqSection />

        {/* Part B: Final CTA Band */}
        <FinalCtaSection onOpenDemo={() => setDemoOpen(true)} />
      </main>

      {/* Universal Footer */}
      <SiteFooter />

      {/* Modals for Booking a Demo & Enterprise Solutions */}
      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
      <EnterpriseModal open={enterpriseOpen} onOpenChange={setEnterpriseOpen} />
    </div>
  );
}
