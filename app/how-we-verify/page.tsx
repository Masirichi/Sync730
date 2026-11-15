// app/how-we-verify/page.tsx
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import {
  Check,
  Globe,
  Flag,
  ArrowRight,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ROLE_STALE_WINDOW_DAYS, MAX_REPORTS_BEFORE_HIDE } from '@/lib/jobs/config';

export const metadata: Metadata = {
  title: 'How We Verify Roles | Sync730',
  description:
    'Every role on Sync730 is confirmed real, open, and eligible for people living in Africa before it appears publicly. Learn our review standard.',
  alternates: {
    canonical: 'https://sync730.com/how-we-verify',
  },
};

export default function HowWeVerifyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">
      <SiteHeader />

      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24 w-full">
        {/* Eyebrow with leading dot */}
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>VERIFICATION STANDARD</span>
        </div>

        {/* Single H1 on page */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-foreground leading-[1.12] mb-6">
          How we confirm roles are real and open to Africa.
        </h1>

        <p className="text-base sm:text-lg leading-relaxed text-muted-foreground mb-16">
          Sync730 exists to eliminate false hope. We do not charge candidates, and we do not list ghost jobs. Every role on Sync730 goes through strict checks before it reaches your search.
        </p>

        <div className="space-y-16 divide-y divide-border/70">
          {/* Section (a): What "Role verified" means */}
          <section id="role-verified" className="pt-12 first:pt-0 space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What &ldquo;Role verified&rdquo; means
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              When a role displays the green <strong className="text-foreground font-semibold">Role verified</strong> badge, it means Sync730 confirmed this role exists, is currently open, and accepts applicants from the locations shown. Pay and hiring decisions are the employer&apos;s.
            </p>

            <div className="p-5 rounded-xl border border-border/70 bg-secondary/30 flex items-start gap-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>Role verified</span>
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Hovering or tapping this badge on any job card displays our core confirmation statement. It confirms the opening has been verified through primary channels before you spend time on an application.
              </p>
            </div>
          </section>

          {/* Section (b): What "Open to Africa" means */}
          <section id="open-to-africa" className="pt-12 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What &ldquo;Open to Africa&rdquo; means
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Too many job boards list &ldquo;worldwide remote&rdquo; positions that quietly reject African applicants at the screening stage. On Sync730, eligibility is stated upfront on the card before you click apply.
            </p>

            {/* Visual Example: How Country Lists Appear on a Card */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Example: How eligibility appears on a job card
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Example 1: Specific Countries with Popover Counter */}
                <div className="p-5 rounded-xl border border-border/70 bg-card shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Open to Nigeria, Ghana, Kenya +4</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Shows confirmed countries upfront. The &ldquo;+4&rdquo; indicates additional confirmed countries (e.g., Rwanda, South Africa, Uganda, Egypt) accessible directly via keyboard or hover tooltip.
                  </p>
                </div>

                {/* Example 2: Africa-Wide */}
                <div className="p-5 rounded-xl border border-border/70 bg-card shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Open to all of Africa</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Indicates that any qualified professional resident in any African country can apply without geographic filter restrictions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section (c): What we check */}
          <section id="what-we-check" className="pt-12 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What we check
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Before a role is approved to appear publicly on Sync730, our review verifies three concrete criteria:
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-6 rounded-xl border border-border/70 bg-card flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">01</span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Live on employer&apos;s channel
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  The listing is active and confirmed on the employer&apos;s official careers portal, direct ATS (Greenhouse, Lever, Ashby, Workable), or verified recruiter workspace.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border/70 bg-card flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">02</span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Hiring contact confirmed
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  A verified hiring contact, talent partner, or team recruiter is attached to the role requisition, ensuring your submission reaches real decision-makers.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border/70 bg-card flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">03</span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    Eligible countries confirmed
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  The hiring team confirms in writing that applicants residing in the designated African locations are eligible to be interviewed and hired.
                </p>
              </div>
            </div>
          </section>

          {/* Section (d): What we don't do */}
          <section id="what-we-dont-do" className="pt-12 space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What we don&apos;t do
            </h2>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Our Clear Boundary</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sync730 verifies that a <strong className="text-foreground">role</strong> is real, currently open, and eligible for people living in Africa.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>
                  We do <strong className="text-foreground font-semibold">not</strong> check company registrations (no CAC, TIN, or corporate legal entity audits).
                </li>
                <li>
                  We do <strong className="text-foreground font-semibold">not</strong> guarantee pay, contracts, pay levels, or hiring outcomes; those decisions are made exclusively by the employer.
                </li>
                <li>
                  We do <strong className="text-foreground font-semibold">not</strong> charge candidates any placement, registration, or application fees.
                </li>
              </ul>
            </div>
          </section>

          {/* Section (e): How roles are re-checked and removed */}
          <section id="re-checks-and-removal" className="pt-12 space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              How roles are re-checked and removed
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              A role confirmed today may close tomorrow. To prevent outdated or ghost listings, the platform enforces automated verification expiration rules directly in the data layer:
            </p>

            <div className="p-6 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <h3 className="text-base font-semibold text-foreground">
                  The {ROLE_STALE_WINDOW_DAYS}-Day Stale Rule
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every verified role carries an internal verification timestamp. If a role is not re-verified within the system stale window of <strong className="text-foreground">{ROLE_STALE_WINDOW_DAYS} days</strong>, it automatically stops appearing publicly in search and job lists.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When an employer channel closes a role or marks it inactive, the listing is promptly unlisted from public queries.
              </p>
              {/* TODO: Process Detail — What specific manual or automated tooling the team uses to re-verify an existing role before the 14-day stale window expires (e.g. automated ATS crawler ping vs manual recruiter outreach) */}
            </div>
          </section>

          {/* Section (f): How to report a job */}
          <section id="report-a-job" className="pt-12 space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              How to report a job
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              If you discover a role that has closed, is no longer hiring, or rejects applicants based on African location despite being marked eligible, report it immediately:
            </p>

            <div className="p-6 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex items-start gap-3">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-foreground">
                    One-Click Community Reporting
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click the <strong className="text-foreground">&ldquo;Report this job&rdquo;</strong> button on any job card or in the job detail dialog. Select the reason (&ldquo;Role closed&rdquo;, &ldquo;Not open to stated location&rdquo;, &ldquo;Misleading salary&rdquo;, or &ldquo;Suspicious listing&rdquo;) and submit.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Under platform safety rules, when any role receives <strong className="text-foreground">{MAX_REPORTS_BEFORE_HIDE} community reports</strong>, our system automatically hides it from public search and listings pending review.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/70 flex flex-wrap items-center gap-4">
                <Link
                  href="/find-work"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
                >
                  <span>Browse live roles</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/#faq"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Read FAQ</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
