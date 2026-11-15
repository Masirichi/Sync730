// app/how-we-verify/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { Check, Globe, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Verify Roles | Sync730',
  description:
    'Every role on Sync730 is confirmed real, open, and eligible for people living in Africa before it reaches you. Learn our review standard.',
};

export default function HowWeVerifyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24 w-full">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          <span>VERIFICATION STANDARD</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
          How we confirm roles are real and open to Africa.
        </h1>

        <p className="text-lg leading-8 text-muted-foreground mb-12">
          Sync730 exists to eliminate false hope. We do not charge candidates, and we do not list ghost jobs. Every role on Sync730 goes through three checks before it reaches your feed.
        </p>

        <div className="space-y-12">
          {/* Check 1 */}
          <div className="border border-border/70 bg-card p-6 sm:p-8 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl font-bold text-foreground">
                1. Confirmed Real and Currently Open
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-7 text-muted-foreground">
              We check the employer’s primary careers portal or direct ATS source to verify the position is actively open and accepting applications. If a listing is stale, expired, or has no verified destination, it never appears on Sync730.
            </p>
          </div>

          {/* Check 2 */}
          <div className="border border-border/70 bg-card p-6 sm:p-8 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
                <Globe className="h-5 w-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl font-bold text-foreground">
                2. Africa Eligibility Stated Upfront
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-7 text-muted-foreground">
              We eliminate the &quot;worldwide remote&quot; listing that actually means &quot;US only.&quot; Every role states its geographical scope upfront: either open across the continent or specific to designated African countries (e.g., Nigeria, Ghana, Kenya).
            </p>
          </div>

          {/* Check 3 */}
          <div className="border border-border/70 bg-card p-6 sm:p-8 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl font-bold text-foreground">
                3. Direct Application and Pipeline Tracking
              </h2>
            </div>
            <p className="text-sm sm:text-base leading-7 text-muted-foreground">
              Every role links directly to an active submission form or authenticated interview flow. You save and track each step in SyncFlow, moving roles from Saved to Offer in your private pipeline.
            </p>
          </div>
        </div>

        {/* Clear boundary note */}
        <div className="mt-14 p-6 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Our boundary
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Sync730 verifies that a role is real, open, and eligible for people living in Africa. We do not verify corporate registrations (CAC/TIN) and do not guarantee contracts, pay levels, or hiring outcomes. Pay and hiring decisions belong to the hiring team.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/find-work"
            className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
          >
            <span>Explore verified roles</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-7 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
