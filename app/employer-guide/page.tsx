// app/employer-guide/page.tsx
// Draft Employer Guide page as specified in section 4.

import { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Employer Hiring Guide (Draft) | Sync730',
  description:
    'A practical guide for hiring managers, engineering leaders, and founders on hiring with AI-moderated video interviews on Sync730.',
};

export default function EmployerGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      <SiteHeader ctaMode="demo" />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Employer Guide · Draft Edition</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            How to hire with Sync730
          </h1>

          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            A guide for engineering leaders, tech founders, and recruitment teams hiring across Nigeria, Africa, and global remote distributed teams.
          </p>

          <hr className="my-10 border-border" />

          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                01. Post your role with clear criteria
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Paste your existing job description or craft a new listing in the Recruiter Console. Specify core skills, seniority level, and whether the position is Remote, Hybrid, or Onsite. Every listing must provide a clear pay range to ensure candidate transparency.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                02. Automated, AI-moderated video interviews
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Applicants who submit an apply-ready profile complete an asynchronous AI-moderated video and technical evaluation within 48 hours. Candidates are evaluated against your specific rubric for technical depth, problem-solving, and communication.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                03. Review ranked, evidence-backed shortlists
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Instead of screening hundreds of static resumes, your hiring team receives a calibrated shortlist ranked by verified competence. Review interview transcripts, rubric breakdown scores, and anti-cheating telemetry before making an interview or offer decision.
              </p>
            </section>
          </div>

          <div className="mt-14 rounded-2xl border border-border bg-secondary/30 p-8 sm:p-10">
            <h3 className="text-xl font-semibold text-foreground">
              Ready to post your open role?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish your first listing or request a demonstration of the recruiter console.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/signup/company"
                className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                Post a role
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                Browse public jobs
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
