// components/home/home-view.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HeroSection } from '@/components/home/hero-section';
import { LiveStatsBand } from '@/components/home/live-stats-band';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { ForRecruitersSection } from '@/components/home/for-recruiters-section';
import { TheDifferenceSection } from '@/components/home/the-difference-section';
import { ForCandidatesSection, LatestJobItem } from '@/components/home/for-candidates-section';
import { StartWhereYouAreSection } from '@/components/home/start-where-you-are-section';
import { TrustSection } from '@/components/home/trust-section';
import { FaqSection } from '@/components/home/faq-section';
import { FinalCtaSection } from '@/components/home/final-cta-section';
import { BookDemoModal } from '@/components/modals/book-demo-modal';
import { EnterpriseModal } from '@/components/modals/enterprise-modal';
import { ApprovedProof } from '@/components/proof/approved-proof';
import { PublicStats } from '@/lib/stats/service';
import { trackEvent } from '@/lib/analytics';

interface HomeViewProps {
  initialStats: PublicStats;
  latestRoles: LatestJobItem[];
}

export function HomeView({ initialStats, latestRoles }: HomeViewProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  // Track initial page view event
  useEffect(() => {
    trackEvent({ name: 'home_view' });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      {/* 5. Header (Sticky) */}
      <SiteHeader />

      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {/* 6. Hero */}
        <HeroSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 7. Live Stats Band (Black, 3 cells) */}
        <LiveStatsBand initialStats={initialStats} />

        {/* Optional Verified Proof Component (renders only if verified data exists) */}
        <ApprovedProof />

        {/* 8. How It Works (#how-it-works) */}
        <HowItWorksSection />

        {/* 9. For Recruiters (#for-recruiters) */}
        <ForRecruitersSection onOpenDemo={() => setDemoOpen(true)} />

        {/* 10. The Sync730 Difference */}
        <TheDifferenceSection />

        {/* 11. For Candidates (#for-candidates, Soft gray band) */}
        <ForCandidatesSection latestRoles={latestRoles} />

        {/* 12. Start Where You Are */}
        <StartWhereYouAreSection
          onOpenDemo={() => setDemoOpen(true)}
          onOpenEnterprise={() => setEnterpriseOpen(true)}
        />

        {/* 13. Trust (Soft gray band) */}
        <TrustSection />

        {/* 14. FAQ */}
        <FaqSection />

        {/* 15. Final CTA Band (Full-width black) */}
        <FinalCtaSection onOpenDemo={() => setDemoOpen(true)} />
      </main>

      {/* 16. Footer (Four columns) */}
      <SiteFooter />

      {/* Modals for Booking a Demo & Enterprise Solutions */}
      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
      <EnterpriseModal open={enterpriseOpen} onOpenChange={setEnterpriseOpen} />
    </div>
  );
}
