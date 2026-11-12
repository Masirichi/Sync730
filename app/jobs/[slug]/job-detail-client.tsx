'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/site/brand-logo';
import {
  MapPin,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Calendar,
  Building2,
  Bookmark,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PublicJob } from '@/lib/jobs/service';
import { createBrowserClient } from '@/lib/supabase/client';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { getCandidateProfile } from '@/lib/candidate/profile';
import { computeJobMatchScore, MatchScoreResult } from '@/lib/candidate/matching';
import { evaluateApplyReady, ApplyReadyResult } from '@/lib/candidate/apply-ready-config';
import { fetchCandidateTracker, saveJobToTracker } from '@/lib/tracker';
import { FinishProfileModal } from '@/components/jobs/finish-profile-modal';
import { ApplyFlowModal } from '@/components/jobs/apply-flow-modal';
import { DidYouApplyModal } from '@/components/jobs/did-you-apply-modal';
import { TailorResumePanel } from '@/components/resume/tailor-resume-panel';
import { ExtendedCandidateProfile } from '@/lib/candidate/profile-store';

interface JobDetailClientProps {
  job: PublicJob;
  isClosed: boolean;
  similarJobs: PublicJob[];
}

export function JobDetailClient({ job, isClosed, similarJobs }: JobDetailClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<ExtendedCandidateProfile | null>(null);
  const [applyReadyResult, setApplyReadyResult] = useState<ApplyReadyResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScoreResult | null>(null);

  // Modals
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [didYouApplyOpen, setDidYouApplyOpen] = useState(false);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [hasAppliedLocally, setHasAppliedLocally] = useState(false);

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

          // Check if saved or applied in tracker
          const tracker = await fetchCandidateTracker(data.user.id);
          const currentItem = tracker.find((t) => t.job_id === job.id);
          if (currentItem) {
            setIsSaved(true);
            if (currentItem.status === 'APPLIED') {
              setHasAppliedLocally(true);
            }
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

    // 3. Apply ready: Handle Employer vs Partner job
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
      router.push(`/login?next=/jobs/${job.slug}`);
      return;
    }

    setIsSaved(!isSaved);
    await saveJobToTracker({
      id: job.id,
      title: job.title,
      company: job.company,
      candidate_required_location: job.location_rule,
    });
  };

  const handleConfirmDidApply = async () => {
    setDidYouApplyOpen(false);
    setHasAppliedLocally(true);

    await saveJobToTracker({
      id: job.id,
      title: job.title,
      company: job.company,
      candidate_required_location: job.location_rule,
    });

    fireJobAnalytics('application_submitted', {
      type: 'external',
      job_id: job.id,
    });
  };

  const formattedDate = new Date(job.posted_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#111] flex flex-col font-sans selection:bg-[#edf3ec] selection:text-[#346538]">
      {/* Top Header */}
      <header className="border-b border-[#e6e6e1] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/jobs" />
          <nav className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="text-xs font-semibold text-neutral-600 hover:text-[#111] transition-colors"
            >
              Browse All Jobs
            </Link>
            {user ? (
              <Link
                href="/dashboard/crawler"
                className="text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-[6px] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/login?next=/jobs/${job.slug}`}
                  className="text-xs font-semibold text-neutral-700 hover:text-black px-3 py-1.5 rounded-[6px]"
                >
                  Log in
                </Link>
                <Link
                  href={`/register?next=/jobs/${job.slug}`}
                  className="text-xs font-semibold text-white bg-[#111] hover:bg-neutral-800 px-3 py-1.5 rounded-[6px]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-8">
        {/* Closed or Expired Job Banner */}
        {isClosed && (
          <div
            role="alert"
            className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-900 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold">This job is closed</h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                This position at {job.company} is no longer accepting new applications. You can review similar active roles below.
              </p>
            </div>
          </div>
        )}

        {/* Job Header Card */}
        <section className="bg-white border border-[#e6e6e1] rounded-[6px] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6a6a64] bg-neutral-100 px-2.5 py-0.5 rounded-[4px]">
                  {job.source_label}
                </span>
                {job.employer_verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#346538] bg-[#edf3ec] px-2.5 py-0.5 rounded-[4px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Employer
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-[4px]">
                    Not yet verified
                  </span>
                )}
                {job.is_featured && (
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-[4px]">
                    Featured
                  </span>
                )}
              </div>

              {/* Title & Company */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111]">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-neutral-700">
                <span className="flex items-center gap-1.5 text-[#111]">
                  <Building2 className="w-4 h-4 text-[#6a6a64]" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#6a6a64]" />
                  {job.location_rule}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#6a6a64]" />
                  {job.seniority} · {job.employment_type}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
                  <DollarSign className="w-4 h-4 text-[#6a6a64]" />
                  {job.salary || 'Salary not listed'}
                </span>
                <span className="flex items-center gap-1 text-[#6a6a64]">
                  <Calendar className="w-3.5 h-3.5" />
                  Posted {formattedDate}
                </span>
              </div>
            </div>

            {/* Top Apply & Action Buttons */}
            {!isClosed && (
              <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                {user ? (
                  /* Logged-In Actions */
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleToggleSave}
                      className={`h-11 px-3 border rounded-[6px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'border-[#e6e6e1] text-[#6a6a64] hover:text-[#111] hover:bg-neutral-50'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTailorModalOpen(true)}
                      className="h-11 px-3.5 border border-[#e6e6e1] text-xs font-semibold rounded-[6px] hover:bg-neutral-50 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Tailor Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyClick}
                      disabled={hasAppliedLocally}
                      className="h-11 px-5 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 active:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {hasAppliedLocally ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Applied</span>
                        </>
                      ) : job.source_type === 'employer' ? (
                        'Apply with Sync730'
                      ) : (
                        'Continue to Apply'
                      )}
                    </button>
                  </div>
                ) : (
                  /* Logged-Out Call to Action */
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link
                      href={`/login?next=/jobs/${job.slug}`}
                      className="h-11 px-4 border border-[#e6e6e1] text-xs font-semibold rounded-[6px] text-neutral-700 hover:text-black hover:bg-neutral-50 flex items-center justify-center text-center"
                    >
                      Log in
                    </Link>
                    <Link
                      href={`/register?next=/jobs/${job.slug}`}
                      onClick={() => fireJobAnalytics('apply_click_logged_out', { job_id: job.id })}
                      className="h-11 px-5 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Sign up to apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logged-In Candidate Match Reason & Breakdown */}
          {user && matchScore && matchScore.score !== null && (
            <div className="pt-4 border-t border-[#e6e6e1] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-[4px] bg-[#edf3ec] text-[#346538]">
                    {matchScore.score}% match
                  </span>
                  <span className="text-xs font-medium text-neutral-700">
                    {matchScore.reason}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBreakdownOpen(!breakdownOpen)}
                  className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1"
                >
                  <span>{breakdownOpen ? 'Hide breakdown' : 'See breakdown'}</span>
                  {breakdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible Match Breakdown */}
              {breakdownOpen && matchScore.breakdown && (
                <div className="p-4 bg-neutral-50 rounded-[6px] border border-[#e6e6e1] space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-900 block mb-1">
                      Matched Skills ({matchScore.breakdown.matchedSkills.length}/{matchScore.breakdown.totalJobSkills})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchScore.breakdown.matchedSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px]">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {matchScore.breakdown.missingSkills.length > 0 && (
                    <div>
                      <span className="font-semibold text-neutral-900 block mb-1">
                        Missing Skills ({matchScore.breakdown.missingSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {matchScore.breakdown.missingSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-200 text-neutral-600">
                    <div>Seniority: <strong className="text-neutral-900">{matchScore.breakdown.seniorityFit}</strong></div>
                    <div>Location: <strong className="text-neutral-900">{matchScore.breakdown.locationEligible ? 'Eligible' : 'Verify'}</strong></div>
                    <div>Salary: <strong className="text-neutral-900">{matchScore.breakdown.salaryFit}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Content Body: Responsibilities, Requirements, Skills */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description Column */}
          <div className="lg:col-span-2 space-y-8 bg-white border border-[#e6e6e1] rounded-[6px] p-6 sm:p-8">
            {/* Overview / Summary */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#111]">Role Overview</h2>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {job.summary}
              </p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-3 pt-6 border-t border-[#e6e6e1]">
              <h2 className="text-base font-bold text-[#111]">Responsibilities</h2>
              <ul className="space-y-2 text-sm text-neutral-700">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="space-y-3 pt-6 border-t border-[#e6e6e1]">
              <h2 className="text-base font-bold text-[#111]">Requirements & Qualifications</h2>
              <ul className="space-y-2 text-sm text-neutral-700">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-2 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Full text description if available */}
            {job.description && job.description.length > 300 && (
              <div className="space-y-3 pt-6 border-t border-[#e6e6e1]">
                <h2 className="text-base font-bold text-[#111]">Additional Details</h2>
                <div
                  className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-2 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            )}
          </div>

          {/* Sidebar Column: Skills & Company Overview */}
          <div className="space-y-6">
            {/* Skills Card */}
            <div className="bg-white border border-[#e6e6e1] rounded-[6px] p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Required Technical Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-semibold px-2.5 py-1 bg-[#f6f6f3] border border-[#e6e6e1] text-neutral-900 rounded-[4px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Metadata Card */}
            <div className="bg-white border border-[#e6e6e1] rounded-[6px] p-6 space-y-3 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Job Overview
              </h2>
              <div className="flex justify-between py-1.5 border-b border-neutral-100">
                <span className="text-[#6a6a64]">Employer</span>
                <span className="font-semibold text-neutral-900">{job.company}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-100">
                <span className="text-[#6a6a64]">Location Rule</span>
                <span className="font-semibold text-neutral-900">{job.location_rule}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-100">
                <span className="text-[#6a6a64]">Seniority</span>
                <span className="font-semibold text-neutral-900">{job.seniority}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-100">
                <span className="text-[#6a6a64]">Type</span>
                <span className="font-semibold text-neutral-900">{job.employment_type}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#6a6a64]">Compensation</span>
                <span className="font-semibold text-neutral-900">{job.salary || 'Salary not listed'}</span>
              </div>
            </div>

            {/* Bottom Apply Card */}
            {!isClosed && (
              <div className="bg-neutral-50 border border-[#e6e6e1] rounded-[6px] p-6 space-y-3 text-center">
                <h3 className="text-sm font-bold text-[#111]">
                  Ready to apply for this role?
                </h3>
                <p className="text-xs text-[#6a6a64]">
                  {user
                    ? 'Submit your verified profile directly to the hiring team.'
                    : 'Create your account to unlock transparent apply flows.'}
                </p>
                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={hasAppliedLocally}
                  className="w-full h-11 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  {user ? (
                    hasAppliedLocally ? 'Application Submitted' : job.source_type === 'employer' ? 'Apply with Sync730' : 'Continue to Apply'
                  ) : (
                    'Sign up to apply'
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Similar Jobs (Crucial when job is closed or for continued browsing) */}
        {similarJobs.length > 0 && (
          <section className="pt-8 border-t border-[#e6e6e1] space-y-4">
            <h2 className="text-lg font-bold text-[#111]">
              Similar Opportunities You Might Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarJobs.map((simJob) => (
                <Link
                  key={simJob.id}
                  href={`/jobs/${simJob.slug}`}
                  className="bg-white border border-[#e6e6e1] rounded-[6px] p-4 hover:border-neutral-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#111] line-clamp-1">
                      {simJob.title}
                    </h3>
                    <p className="text-xs text-neutral-600 font-medium">
                      {simJob.company} · {simJob.location_rule}
                    </p>
                    <p className="text-xs text-[#6a6a64] line-clamp-2 pt-1">
                      {simJob.summary}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span>{simJob.salary || 'Salary not listed'}</span>
                    <span className="text-[#111] underline">View role →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {candidateProfile && (
        <>
          <FinishProfileModal
            isOpen={finishModalOpen}
            onClose={() => setFinishModalOpen(false)}
            jobTitle={job.title}
            jobSlug={job.slug}
            missingItems={applyReadyResult?.missing_items || []}
            completedSteps={applyReadyResult?.completed_steps || 0}
            totalSteps={applyReadyResult?.total_steps || 7}
          />

          <ApplyFlowModal
            isOpen={applyModalOpen}
            onClose={() => setApplyModalOpen(false)}
            job={job}
            candidateProfile={candidateProfile}
            onSuccess={() => {
              setHasAppliedLocally(true);
            }}
          />

          <DidYouApplyModal
            isOpen={didYouApplyOpen}
            onClose={() => setDidYouApplyOpen(false)}
            jobTitle={job.title}
            companyName={job.company}
            onConfirmYes={handleConfirmDidApply}
            onConfirmNo={() => setDidYouApplyOpen(false)}
          />

          <TailorResumePanel
            isOpen={tailorModalOpen}
            onClose={() => setTailorModalOpen(false)}
            job={{
              id: job.id,
              title: job.title,
              company_name: job.company,
              job_description: job.description,
              skills: job.skills,
            } as any}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-[#e6e6e1] bg-white py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6a6a64]">
          <p>© 2026 Sync730. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/jobs" className="hover:text-[#111] underline">Jobs</Link>
            <Link href="/privacy" className="hover:text-[#111] underline">Privacy</Link>
            <Link href="/terms" className="hover:text-[#111] underline">Terms</Link>
            <Link href="/waitlist" className="hover:text-[#111] underline">Waitlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
