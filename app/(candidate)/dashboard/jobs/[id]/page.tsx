'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Building2,
  Globe2,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Briefcase,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { RemoteJob } from '@/lib/supabase/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { getAdminRemoteJobs } from '@/lib/admin/store';
import {
  normalizeJobRecord,
  isOlderThan30Days,
  formatPostedAgo,
  formatStandardDate,
} from '@/lib/crawler/job-utils';
import SalaryDisplay from '@/components/ui/SalaryDisplay';
import {
  saveJobToTracker,
  removeJobFromTracker,
  isJobSavedInTracker,
  markJobAsApplied,
} from '@/lib/tracker';
import { ResumeGeneratorModal, TargetJobContext } from '@/components/resume/resume-generator-modal';
import { TailorResumePanel } from '@/components/resume/tailor-resume-panel';
import { ReportMatchDialog } from '@/components/jobs/report-match-dialog';
import { getCandidateProfile, CandidateProfile } from '@/lib/candidate/profile';
import { computeJobMatchScore, MatchScoreResult } from '@/lib/candidate/matching';
import { toast } from 'sonner';

function JobDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';

  const [job, setJob] = useState<RemoteJob | null>(() => {
    if (!jobId) return null;
    const seedIndex = jobId.startsWith('seed-job-')
      ? parseInt(jobId.replace('seed-job-', ''), 10) - 1
      : -1;
    const seedMatch =
      seedIndex >= 0 && SEED_REMOTE_JOBS[seedIndex]
        ? SEED_REMOTE_JOBS[seedIndex]
        : SEED_REMOTE_JOBS.find(
            (j) => j.external_id === jobId || j.url === jobId || (j as any).id === jobId
          );
    if (seedMatch) {
      return normalizeJobRecord({ ...seedMatch, id: jobId });
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !job);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [hasClickedApply, setHasClickedApply] = useState<boolean>(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState<boolean>(false);
  const [isTailorPanelOpen, setIsTailorPanelOpen] = useState<boolean>(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(() => getCandidateProfile());

  useEffect(() => {
    setProfile(getCandidateProfile());
    const handleProfileUpdate = () => {
      setProfile(getCandidateProfile());
    };
    window.addEventListener('sync730_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('sync730_profile_updated', handleProfileUpdate);
  }, []);

  const matchScore = useMemo(() => {
    if (!job) return null;
    return computeJobMatchScore(job, profile);
  }, [job, profile]);

  // Preserve query string back to crawler
  const backQueryString = searchParams?.toString();
  const backHref = backQueryString ? `/dashboard/crawler?${backQueryString}` : '/dashboard/crawler';

  // Load Job details
  useEffect(() => {
    let cancelled = false;

    async function fetchJob() {
      // 1. Check local seed jobs first for instant zero-latency render
      const seedIndex = jobId.startsWith('seed-job-')
        ? parseInt(jobId.replace('seed-job-', ''), 10) - 1
        : -1;
      const seedMatch =
        seedIndex >= 0 && SEED_REMOTE_JOBS[seedIndex]
          ? SEED_REMOTE_JOBS[seedIndex]
          : SEED_REMOTE_JOBS.find(
              (j) => j.external_id === jobId || j.url === jobId || (j as any).id === jobId
            );

      if (seedMatch && !cancelled) {
        const normalized = normalizeJobRecord({ ...seedMatch, id: jobId });
        setJob(normalized);
        setIsSaved(isJobSavedInTracker(normalized.id));
        setLoading(false);
        return;
      }

      // 2. Check Admin store
      const adminJobs = getAdminRemoteJobs();
      const adminMatch = adminJobs.find(
        (j) => j.id === jobId || j.external_id === jobId
      );
      if (adminMatch && !cancelled) {
        const normalized = normalizeJobRecord(adminMatch as any);
        setJob(normalized);
        setIsSaved(isJobSavedInTracker(normalized.id));
        setLoading(false);
        return;
      }

      // 3. Fallback to API if not in seed or admin store
      setLoading(true);
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs)) {
            const match = data.jobs.find(
              (j: RemoteJob) => j.id === jobId || j.external_id === jobId
            );
            if (match && !cancelled) {
              const normalized = normalizeJobRecord(match);
              setJob(normalized);
              setIsSaved(isJobSavedInTracker(normalized.id));
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        // Fall back
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchJob();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // Window Focus listener for Apply Flow prompt
  useEffect(() => {
    const handleWindowFocus = () => {
      if (hasClickedApply) {
        // When user returns to tab after opening external apply link
        setShowApplyModal(true);
        setHasClickedApply(false);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [hasClickedApply]);

  // Toggle Save / Unsaved
  const handleToggleSave = async () => {
    if (!job) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        removeJobFromTracker(job.id);
        setIsSaved(false);
        toast.info(`Removed "${job.title}" from saved jobs.`);
      } else {
        await saveJobToTracker(job);
        setIsSaved(true);
        toast.success(`Saved "${job.title}" to your Application Tracker.`);
      }
    } catch {
      toast.error('Failed to update tracker.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Apply Directly
  const handleApplyDirectly = () => {
    if (!job) return;
    const targetUrl = job.apply_url || job.url;
    if (targetUrl && targetUrl !== '#') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setHasClickedApply(true);
    } else {
      toast.error('No direct application link available for this role.');
    }
  };

  // Confirm Application
  const handleConfirmApplication = (applied: boolean) => {
    setShowApplyModal(false);
    if (!job) return;

    if (applied) {
      markJobAsApplied(job);
      setIsSaved(true);
      toast.success(`Marked "${job.title}" as Applied in your Application Tracker!`);
    } else {
      toast.info('Application status kept unchanged.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-5 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Job Not Found</h2>
        <p className="text-sm text-neutral-500">
          The requested job posting may have expired or was removed from the verified feed.
        </p>
        <Link href={backHref}>
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Button>
        </Link>
      </div>
    );
  }

  const isClosedWarning = isOlderThan30Days(job.posted_at || job.published_at);
  const targetJobCtx: TargetJobContext = {
    title: job.title,
    company: job.company_name || job.company,
    description: job.description || '',
    category: job.category || 'Software & Engineering',
    location: job.candidate_required_location || 'Remote',
    salary: job.salary || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8 pb-32">
      {/* Top Navigation: Back to jobs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to jobs</span>
        </Link>

        {/* Verification Pill */}
        {job.last_verified_at ? (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"
            title="The application link and role status were checked and verified active by Sync730."
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Link checked {formatStandardDate(job.last_verified_at)}</span>
          </span>
        ) : (
          <span className="text-[11px] text-neutral-400">Standard listing</span>
        )}
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        {/* Company Line & Badges */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              {job.company_name || job.company}
            </span>

            {/* Agency Badge & Tooltip */}
            {job.employer_type === 'agency' && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 cursor-help"
                title="This role is posted by a staffing/outsourcing company on behalf of a client."
              >
                Agency listing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {job.is_featured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                ★ Featured Partner
              </span>
            )}
            <Badge variant="outline" className="text-xs font-medium">
              {job.location_tier}
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              {job.category}
            </Badge>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {job.seniority || 'Mid'}
            </span>
          </div>
        </div>

        {/* Job Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          {job.title}
        </h1>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-1">
            <Globe2 className="h-3.5 w-3.5 text-neutral-400" />
            {job.candidate_required_location || 'Remote'}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
            {job.job_type || 'Full-time'}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 text-neutral-900 dark:text-neutral-100 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
            <SalaryDisplay job={job} />
          </span>
        </div>

        {/* Freshness & Source under the meta line */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
          <span>Posted {formatPostedAgo(job.posted_at || job.published_at)} · via {job.source_name || job.source || 'Direct'}</span>

          {isClosedWarning && (
            <span className="ml-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
              May be closed
            </span>
          )}

          {/* Eligibility Badge */}
          <span className="ml-auto">
            {job.open_to_nigeria ? (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ● Open to Nigeria
              </span>
            ) : (
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                Not open to Nigeria
              </span>
            )}
          </span>
        </div>
      </div>

      {/* AI Match Score & Collapsible Breakdown */}
      {matchScore && (
        <Card className="border-neutral-200/90 dark:border-neutral-800 bg-gradient-to-r from-blue-50/30 via-white to-white dark:from-blue-950/20 dark:via-neutral-950 dark:to-neutral-950 overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                {matchScore.isProfileComplete && matchScore.score !== null ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>{matchScore.score}% match</span>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            matchScore.score >= 80 ? 'bg-emerald-500' : matchScore.score >= 65 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${matchScore.score}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {matchScore.reason}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>Complete your profile to see match scores and detailed breakdown</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {matchScore.isProfileComplete && matchScore.breakdown ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                    className="text-xs h-8 gap-1.5 border-neutral-200 dark:border-neutral-800"
                  >
                    <span>{isBreakdownOpen ? 'Hide breakdown' : 'See breakdown'}</span>
                    {isBreakdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                ) : (
                  <Link href="/dashboard/profile">
                    <Button size="sm" className="text-xs h-8 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                      Complete Profile →
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Collapsible Breakdown */}
            {isBreakdownOpen && matchScore.breakdown && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-neutral-500 text-[10px] uppercase tracking-wider block">Skill Overlap</span>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    {matchScore.breakdown.matchedSkills.length}/{matchScore.breakdown.totalJobSkills} skills matched ({matchScore.breakdown.skillOverlapPct}%)
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate" title={matchScore.breakdown.matchedSkills.join(', ')}>
                    {matchScore.breakdown.matchedSkills.join(', ') || 'No direct overlap'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-neutral-500 text-[10px] uppercase tracking-wider block">Seniority Fit</span>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    {matchScore.breakdown.seniorityFit}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Candidate: {profile?.seniority || 'Mid'} vs Job: {job.seniority || 'Mid'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-neutral-500 text-[10px] uppercase tracking-wider block">Location Eligibility</span>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    {matchScore.breakdown.locationReason}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {job.location_tier}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-neutral-500 text-[10px] uppercase tracking-wider block">Compensation</span>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    {matchScore.breakdown.salaryFit}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Based on your stated minimum
                  </div>
                </div>
              </div>
            )}

            {/* Match Card Footer: Ethical Guarantee & Report Link */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-900 text-[11px] text-neutral-400">
              <span>Scores are based on skills, seniority, location & compensation fit only.</span>
              <button
                type="button"
                onClick={() => setIsReportDialogOpen(true)}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 underline inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                Report a bad match
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Left Column (2 cols): Description, Responsibilities, Requirements */}
        <div className="md:col-span-2 space-y-8">
          {/* Section 1: Role Overview */}
          <section className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
              Role Overview
            </h2>
            <div className="prose dark:prose-invert text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </section>

          {/* Section 2: Key Responsibilities */}
          {job.responsibilities && (
            <section className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Key Responsibilities
              </h2>
              <div className="prose dark:prose-invert text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {job.responsibilities}
              </div>
            </section>
          )}

          {/* Section 3: Requirements & Qualifications */}
          {job.requirements && (
            <section className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Requirements & Qualifications
              </h2>
              <div className="prose dark:prose-invert text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {job.requirements}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (1 col): Eligibility, Skills, Meta Details */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 shadow-none rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Globe2 className="h-4 w-4 text-emerald-600" />
                <span>Eligibility & Work Authorization</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-neutral-500 block">Eligible Countries:</span>
                  <p className="mt-0.5 text-neutral-900 dark:text-neutral-100 font-medium">
                    {job.eligible_countries && job.eligible_countries.length > 0
                      ? job.eligible_countries.join(', ')
                      : 'Eligibility unconfirmed'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-neutral-500 block">Timezone Overlap:</span>
                  <p className="mt-0.5 text-neutral-900 dark:text-neutral-100 font-medium">
                    {job.timezone_overlap || 'Eligibility unconfirmed'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-neutral-500 block">Payment Method:</span>
                  <p className="mt-0.5 text-neutral-900 dark:text-neutral-100 font-medium">
                    {job.payment_method || 'Direct Wire / USD Contract / Local Bank'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills to Strengthen Card (Requirement 4) */}
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none rounded-xl">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>Skills to Strengthen</span>
                </h3>
                {matchScore?.isProfileComplete && matchScore.breakdown && (
                  <Badge variant="outline" className="text-[10px]">
                    {matchScore.breakdown.missingSkills.length} to practice
                  </Badge>
                )}
              </div>

              {matchScore?.isProfileComplete && matchScore.breakdown ? (
                matchScore.breakdown.missingSkills.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Preparing these skills will help close gaps for this role:
                    </p>
                    <div className="space-y-2">
                      {matchScore.breakdown.missingSkills.map((skill) => (
                        <div
                          key={skill}
                          className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                              {skill}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Learning resource & practice
                            </span>
                          </div>
                          <Link
                            href={`/dashboard/prep?role=${encodeURIComponent(job.title)}&skill=${encodeURIComponent(skill)}`}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Interview Prep</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Your profile covers all core skills identified for this position!</span>
                  </div>
                )
              ) : (
                <div className="space-y-2 text-xs text-neutral-500">
                  <p>Complete your candidate profile to identify your specific skill gaps for this position.</p>
                  <Link href="/dashboard/profile">
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                      Set up profile →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills & Technologies Card */}
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none rounded-xl">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-neutral-400" />
                <span>Required Skills</span>
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {job.skills && job.skills.length > 0 ? (
                  job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400">General engineering skills</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Source Info Card */}
          <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none rounded-xl">
            <CardContent className="p-5 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block uppercase tracking-wider text-[11px]">
                Original Source
              </span>
              <p>
                Posted via <strong className="text-neutral-900 dark:text-neutral-100">{job.source_name || job.source}</strong>.
              </p>
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 hover:underline pt-1"
                >
                  <span>View original board post</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 py-3.5 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block truncate max-w-sm">
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {job.title}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {job.company_name || job.company} · <SalaryDisplay job={job} />
            </p>
          </div>

          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-end">
            {/* Save Button (Fixed Width w-[100px] so layout does not shift) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSave}
              disabled={isSaving}
              className="w-[100px] text-xs h-9 font-semibold border-neutral-200 dark:border-neutral-800"
            >
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5 stroke-[2.5]" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
                  <span>Save</span>
                </>
              )}
            </Button>

            {/* Tailor Resume Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTailorPanelOpen(true)}
              className="gap-1.5 text-xs h-9 font-semibold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Tailor Resume</span>
            </Button>

            {/* Apply Directly Button */}
            <Button
              size="sm"
              onClick={handleApplyDirectly}
              className="gap-1.5 text-xs h-9 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 px-4"
            >
              <span>Apply Directly</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Follow-up Apply Prompt Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Did you apply to {job.title}?
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              We opened the application page in another tab for you. If you completed your submission, we can move this to your Applied pipeline in Tracker.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmApplication(false)}
              className="text-xs h-9"
            >
              Not yet
            </Button>
            <Button
              size="sm"
              onClick={() => handleConfirmApplication(true)}
              className="text-xs h-9 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
            >
              Yes, I applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ethical AI Disclosure Footer */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Scores and suggestions are AI-generated and may be wrong. You decide where to apply.
      </div>

      {/* Resume ATS Tailoring Side Panel */}
      <TailorResumePanel
        isOpen={isTailorPanelOpen}
        onClose={() => setIsTailorPanelOpen(false)}
        job={targetJobCtx}
      />

      {/* Report Bad Match Dialog */}
      <ReportMatchDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.company_name || job.company}
        currentScore={matchScore?.score}
      />
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-64 bg-neutral-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
        </div>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
