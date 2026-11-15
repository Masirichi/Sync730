'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import {
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PublicJob } from '@/lib/jobs/service';
import { createBrowserClient } from '@/lib/supabase/client';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { computeJobMatchScore, MatchScoreResult } from '@/lib/candidate/matching';
import { evaluateApplyReady, ApplyReadyResult } from '@/lib/candidate/apply-ready-config';
import { fetchCandidateTracker, saveJobToTracker } from '@/lib/tracker';
import { FinishProfileModal } from '@/components/jobs/finish-profile-modal';
import { ApplyFlowModal } from '@/components/jobs/apply-flow-modal';
import { DidYouApplyModal } from '@/components/jobs/did-you-apply-modal';
import { ReportJobDialog } from '@/components/jobs/report-job-dialog';
import { TailorResumePanel } from '@/components/resume/tailor-resume-panel';
import { ExtendedCandidateProfile } from '@/lib/candidate/profile-store';
import {
  formatSalary,
  CurrencyChoice,
  PeriodChoice,
  EXCHANGE_RATES,
} from '@/lib/jobs/format-salary';
import {
  VERIFICATION_CLAIMS,
  INTERVIEW_EXPECTATION_COPY,
  WHAT_HAPPENS_STEPS,
} from '@/lib/jobs/trust-copy';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JobDetailClientProps {
  job: PublicJob;
  isClosed: boolean;
  similarJobs: PublicJob[];
}

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getRelativeTimeString(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return 'recently';
  }
}

export function JobDetailClient({ job, isClosed, similarJobs }: JobDetailClientProps) {
  const router = useRouter();

  // Currency & Period toggles
  const [currency, setCurrency] = useState<CurrencyChoice>('ORIGINAL');
  const [period, setPeriod] = useState<PeriodChoice>('ORIGINAL');

  // Candidate auth & profile states
  const [user, setUser] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<ExtendedCandidateProfile | null>(null);
  const [applyReadyResult, setApplyReadyResult] = useState<ApplyReadyResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScoreResult | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Modals
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [didYouApplyOpen, setDidYouApplyOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    fireJobAnalytics('job_view', { job_id: job.id, is_closed: isClosed });

    async function loadCandidate() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();

        if (data?.user) {
          setUser(data.user);

          // Fetch profile and server apply_ready evaluation
          const profileRes = await fetch('/api/candidate/profile');
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.profile) {
              setCandidateProfile(pData.profile);
              setApplyReadyResult(pData.apply_ready);

              // Calculate match score
              const match = computeJobMatchScore(job as any, pData.profile);
              setMatchScore(match);
            }
          }

          // Check if saved in tracker
          const tracker = await fetchCandidateTracker(data.user.id);
          const currentItem = tracker.find((t) => t.job_id === job.id);
          if (currentItem) {
            setIsSaved(true);
          }
        }
      } catch {}
    }

    loadCandidate();
  }, [job.id, isClosed]);

  const handleApplyClick = async () => {
    // 1. Logged out state
    if (!user) {
      fireJobAnalytics('apply_click_logged_out', { job_id: job.id });
      router.push(`/register?next=/jobs/${job.slug}`);
      return;
    }

    // 2. Logged in, but NOT apply-ready
    if (!applyReadyResult?.is_apply_ready) {
      setFinishModalOpen(true);
      return;
    }

    // 3. Apply ready: Handle Employer vs Partner/Curated job
    if (job.source_type === 'employer') {
      setApplyModalOpen(true);
    } else {
      // Partner/curated job: Fetch apply URL from server
      try {
        const res = await fetch(`/api/jobs/${job.id}/apply-url`);
        const data = await res.json();

        if (!res.ok || !data.apply_url) {
          alert(data.error || 'Failed to retrieve external application link.');
          return;
        }

        // Open in new tab
        window.open(data.apply_url, '_blank', 'noopener,noreferrer');
        fireJobAnalytics('external_click', { job_id: job.id });

        // Add to tracker as Saved
        await saveJobToTracker({
          id: job.id,
          title: job.title,
          company: job.company,
          candidate_required_location: job.location_rule,
        });
        setIsSaved(true);

        // When candidate returns, prompt "Did you apply?"
        setTimeout(() => {
          setDidYouApplyOpen(true);
        }, 1500);
      } catch {
        alert('Could not open employer site. Please try again.');
      }
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      router.push(`/register?next=/jobs/${job.slug}&save=1`);
      return;
    }

    setIsSaved(!isSaved);
    await saveJobToTracker({
      id: job.id,
      title: job.title,
      company: job.company,
      candidate_required_location: job.location_rule,
    });
    fireJobAnalytics('job_saved', { job_id: job.id });
  };

  const handleShareClick = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      });
    }
  };

  const formattedPostedDate = new Date(job.posted_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const salaryResult = formatSalary(job, currency, period);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#fcfcf9] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 pb-28">
        {/* State-Aware Shared Header */}
        <SiteHeader ctaMode="profile" />

        <main className="flex-1 max-w-5xl mx-auto px-5 sm:px-8 py-8 w-full space-y-8">
          {/* Back button preserving query string */}
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>←</span>
              <span>Back to jobs</span>
            </button>
          </div>

          {/* Closed / Expired Banner */}
          {isClosed && (
            <div
              role="alert"
              className="p-5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl text-foreground space-y-1"
            >
              <h2 className="text-sm font-bold">This job is closed</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This position at {job.company} is no longer accepting applications. You can review similar active roles below.
              </p>
            </div>
          )}

          {/* Job Header Card */}
          <section className="bg-white dark:bg-neutral-900 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-4 flex-1 min-w-0">
                {/* Employer & Verification Chips Row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-border/60 flex items-center justify-center font-bold text-xs text-foreground flex-shrink-0">
                    {job.company_logo ? (
                      <img
                        src={job.company_logo}
                        alt={`${job.company} logo`}
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      getInitials(job.company)
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {job.company}
                      </span>

                      {/* Employer Verified Plain Text Chip */}
                      {job.employer_verified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground cursor-help">
                              {VERIFICATION_CLAIMS.employer_verified.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {VERIFICATION_CLAIMS.employer_verified.getTooltip(job.employer_verified_at)}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Role Verified Plain Text Chip */}
                      {job.role_verified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground cursor-help">
                              {VERIFICATION_CLAIMS.role_verified.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {VERIFICATION_CLAIMS.role_verified.getTooltip(job.role_verified_at)}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Agency Listing Tag */}
                      {job.is_agency && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground cursor-help">
                              {VERIFICATION_CLAIMS.agency_listing.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {VERIFICATION_CLAIMS.agency_listing.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-0.5 bg-neutral-50 dark:bg-neutral-800 rounded">
                        {job.source_label}
                      </span>
                    </div>
                    {job.industry && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.industry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Job Title */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  {job.title}
                </h1>

                {/* Salary Display with Currency & Period Toggles */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white">
                    {salaryResult.formatted}
                  </span>

                  {/* Currency Toggle */}
                  <div className="inline-flex rounded-full border border-border/70 p-0.5 bg-neutral-50 dark:bg-neutral-800 text-xs">
                    {(['ORIGINAL', 'NGN', 'USD'] as CurrencyChoice[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                          currency === c
                            ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c === 'ORIGINAL' ? 'Original' : c === 'NGN' ? '₦' : '$'}
                      </button>
                    ))}
                  </div>

                  {/* Period Toggle */}
                  <div className="inline-flex rounded-full border border-border/70 p-0.5 bg-neutral-50 dark:bg-neutral-800 text-xs">
                    {(['MONTHLY', 'YEARLY'] as PeriodChoice[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                          period === p
                            ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversion Note */}
                {salaryResult.isConverted && (
                  <p className="text-[11px] text-muted-foreground">
                    ≈ Exchange rates updated {EXCHANGE_RATES.lastUpdatedDate}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium text-foreground">
                    {job.modality}
                  </span>
                  {job.city_location && (
                    <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium text-foreground">
                      {job.city_location}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium text-foreground">
                    {job.employment_type}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium text-foreground">
                    {job.seniority}
                  </span>
                  <span>·</span>
                  <span>Posted {formattedPostedDate}</span>
                </div>

                {/* Eligibility List */}
                <div className="pt-2 text-xs text-muted-foreground">
                  <strong className="text-foreground">Eligibility:</strong> Open to candidates residing in{' '}
                  <span className="text-foreground font-medium">{job.eligible_countries.join(', ')}</span>.
                </div>
              </div>

              {/* Action Buttons (Desktop top) */}
              <div className="flex sm:flex-col gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={isClosed}
                  onClick={handleApplyClick}
                  className="h-11 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {!user
                    ? 'Sign up to apply'
                    : !applyReadyResult?.is_apply_ready
                    ? 'Finish profile to apply'
                    : job.source_type === 'employer'
                    ? 'Apply with Sync730'
                    : 'Continue to employer site'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`h-11 flex-1 px-4 rounded-full border border-border/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isSaved
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-950 dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareClick}
                    className="h-11 px-4 rounded-full border border-border/80 bg-white dark:bg-neutral-900 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareCopied ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logged-in Match Score & Reasons */}
            {user && matchScore && (
              <div className="p-4 rounded-2xl border border-border/70 bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Candidate Fit Evaluation
                    </span>
                    <div className="text-base font-bold text-foreground mt-0.5">
                      {matchScore.score}% Role Match
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBreakdownOpen(!breakdownOpen)}
                    className="text-xs font-semibold underline text-muted-foreground hover:text-foreground"
                  >
                    {breakdownOpen ? 'Hide analysis' : 'View analysis'}
                  </button>
                </div>

                {breakdownOpen && (
                  <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Matching Strengths</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• {matchScore.reason}</li>
                        {matchScore.breakdown && matchScore.breakdown.matchedSkills.length > 0 && (
                          <li>• Matched skills: {matchScore.breakdown.matchedSkills.join(', ')}</li>
                        )}
                        {matchScore.breakdown && (
                          <li>• Seniority: {matchScore.breakdown.seniorityFit}</li>
                        )}
                      </ul>
                    </div>
                    {matchScore.breakdown && matchScore.breakdown.missingSkills.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground mb-1">Skills to Expand</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {matchScore.breakdown.missingSkills.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Job Overview / Summary */}
          <section className="bg-white dark:bg-neutral-900 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Role Summary</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {job.summary}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Responsibilities</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {job.responsibilities.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-foreground font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Requirements & Qualifications</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-foreground font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Required Skills & Tools</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-md text-xs font-medium border border-border/80 bg-neutral-50 dark:bg-neutral-800 text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section: What happens after you apply (Prompt Section 8) */}
          <section className="bg-white dark:bg-neutral-900 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">What happens after you apply</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Our application and review process is structured and transparent.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {WHAT_HAPPENS_STEPS.map((step) => (
                <div key={step.number} className="space-y-2">
                  <div className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Interview expectation plain text note */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-border/60 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Interview expectation:</strong> {INTERVIEW_EXPECTATION_COPY}
            </div>
          </section>

          {/* Report Job Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setReportDialogOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Report this job listing
            </button>
          </div>

          {/* Up to 3 Similar Roles (Prompt Section 8) */}
          {similarJobs.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Similar Roles
                </h2>
                <Link
                  href="/find-work"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all roles →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {similarJobs.map((simJob) => {
                  const simSalary = formatSalary(simJob, currency, period).formatted;

                  return (
                    <article
                      key={simJob.id}
                      className="p-5 rounded-2xl border border-border/80 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground truncate">
                          {simJob.company}
                        </p>
                        <h3 className="text-sm font-bold text-foreground mt-1 hover:underline">
                          <Link href={`/jobs/${simJob.slug}`}>
                            {simJob.title}
                          </Link>
                        </h3>
                        <p className="text-xs font-bold text-foreground mt-1">
                          {simSalary}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {simJob.modality} · {simJob.city_location || simJob.location_rule}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {getRelativeTimeString(simJob.posted_date)}
                        </span>
                        <Link
                          href={`/jobs/${simJob.slug}`}
                          className="font-semibold text-foreground underline hover:no-underline"
                        >
                          View role
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        {/* Sticky Action Bar at Bottom */}
        <aside
          aria-label="Job application action bar"
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-900/95 border-t border-border/80 backdrop-blur-md py-3 px-5 sm:px-8 shadow-lg"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {job.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {job.company} · {salaryResult.formatted}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                className="h-10 px-4 rounded-full border border-border/80 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-foreground' : ''}`} />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareClick}
                aria-label="Share job link"
                className="h-10 px-4 rounded-full border border-border/80 bg-white dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                type="button"
                disabled={isClosed}
                onClick={handleApplyClick}
                className="h-10 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex-1 sm:flex-initial"
              >
                {!user
                  ? 'Sign up to apply'
                  : !applyReadyResult?.is_apply_ready
                  ? 'Finish profile to apply'
                  : job.source_type === 'employer'
                  ? 'Apply with Sync730'
                  : 'Continue to employer site'}
              </button>
            </div>
          </div>
        </aside>

        {/* Shared Footer */}
        <SiteFooter />

        {/* Finish Profile Modal */}
        {applyReadyResult && (
          <FinishProfileModal
            isOpen={finishModalOpen}
            onClose={() => setFinishModalOpen(false)}
            jobTitle={job.title}
            jobSlug={job.slug}
            missingItems={applyReadyResult.missing_items}
            completedSteps={applyReadyResult.completed_steps}
            totalSteps={applyReadyResult.total_steps}
          />
        )}

        {/* Apply Flow Modal (for employer-posted jobs) */}
        {candidateProfile && (
          <ApplyFlowModal
            isOpen={applyModalOpen}
            onClose={() => setApplyModalOpen(false)}
            job={job}
            candidateProfile={candidateProfile}
            onSuccess={() => {
              setApplyModalOpen(false);
              setIsSaved(true);
            }}
          />
        )}

        {/* Did You Apply Modal (for external apply flow) */}
        <DidYouApplyModal
          isOpen={didYouApplyOpen}
          onClose={() => setDidYouApplyOpen(false)}
          jobTitle={job.title}
          companyName={job.company}
        />

        {/* Report Job Dialog */}
        <ReportJobDialog
          isOpen={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          onReportSuccess={() => {
            alert('Thank you for reporting. Our moderation team will review this role within 24 hours.');
          }}
        />
      </div>
    </TooltipProvider>
  );
}
