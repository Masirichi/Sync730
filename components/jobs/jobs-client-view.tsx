'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/site/brand-logo';
import {
  Search,
  MapPin,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Bookmark,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import type { PublicJob, JobFilterParams } from '@/lib/jobs/service';
import { createBrowserClient } from '@/lib/supabase/client';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { getCandidateProfile } from '@/lib/candidate/profile';
import { computeJobMatchScore, MatchScoreResult } from '@/lib/candidate/matching';
import { fetchCandidateTracker, saveJobToTracker } from '@/lib/tracker';

const DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'engineering', label: 'Software Engineering' },
  { value: 'frontend', label: 'Frontend Development' },
  { value: 'backend', label: 'Backend Development' },
  { value: 'design', label: 'Product & Design' },
  { value: 'data', label: 'Data & AI' },
  { value: 'devops', label: 'DevOps & Cloud' },
  { value: 'product', label: 'Product Management' },
];

const LOCATIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'nigeria', label: 'Open to Nigeria' },
  { value: 'africa', label: 'Open to Africa' },
  { value: 'worldwide', label: 'Worldwide / Anywhere' },
];

const SENIORITY_LEVELS = [
  { value: 'all', label: 'All Seniority' },
  { value: 'junior', label: 'Junior / Entry' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Staff' },
];

const JOB_TYPES = [
  { value: 'all', label: 'All Job Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
];

export interface JobsClientViewProps {
  initialResults: {
    jobs: PublicJob[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  filterParams: JobFilterParams;
}

export function JobsClientView({ initialResults, filterParams }: JobsClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active filter params
  const queryQ = filterParams.q || '';
  const queryDept = filterParams.department || 'all';
  const queryLoc = filterParams.location || 'all';
  const querySeniority = filterParams.seniority || 'all';
  const queryJobType = filterParams.job_type || 'all';
  const querySalary = Boolean(filterParams.salary_shown);
  const queryPage = filterParams.page || 1;

  // User state
  const [user, setUser] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState(queryQ);

  // Sync searchQuery when URL param changes
  useEffect(() => {
    setSearchQuery(queryQ);
  }, [queryQ]);

  // Auth check on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          const profile = getCandidateProfile();
          setCandidateProfile(profile);

          const tracker = await fetchCandidateTracker(data.user.id);
          const savedIds = new Set(tracker.map((t) => t.job_id).filter(Boolean) as string[]);
          setSavedJobIds(savedIds);
        }
      } catch {}
    }
    checkAuth();
    fireJobAnalytics('jobs_list_view', { page: queryPage });
  }, [queryPage]);

  // Update URL helper
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all' || v === 'false') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });

    startTransition(() => {
      router.push(`/jobs?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchQuery.trim() || null, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    startTransition(() => {
      router.push('/jobs');
    });
  };

  const hasActiveFilters =
    Boolean(queryQ) ||
    queryDept !== 'all' ||
    queryLoc !== 'all' ||
    querySeniority !== 'all' ||
    queryJobType !== 'all' ||
    querySalary;

  const handleToggleSave = async (e: React.MouseEvent, job: PublicJob) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?next=/jobs/${job.slug}`);
      return;
    }

    const nextSaved = new Set(savedJobIds);
    if (nextSaved.has(job.id)) {
      nextSaved.delete(job.id);
    } else {
      nextSaved.add(job.id);
      await saveJobToTracker({
        id: job.id,
        title: job.title,
        company: job.company,
        candidate_required_location: job.location_rule,
      });
    }
    setSavedJobIds(nextSaved);
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#111] flex flex-col font-sans selection:bg-[#edf3ec] selection:text-[#346538]">
      {/* Top Header */}
      <header className="border-b border-[#e6e6e1] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo href="/jobs" />

          <nav className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/crawler"
                  className="text-xs font-semibold text-neutral-700 hover:text-black transition-colors"
                >
                  Candidate Portal
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-bold text-xs"
                >
                  {candidateProfile?.fullName?.slice(0, 2).toUpperCase() || 'CP'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login?next=/jobs"
                  className="text-xs font-semibold text-neutral-700 hover:text-black px-3 py-2 rounded-[6px] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register?next=/jobs"
                  className="text-xs font-semibold text-white bg-[#111] hover:bg-neutral-800 px-3.5 py-2 rounded-[6px] transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-white border-b border-[#e6e6e1] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-block px-2.5 py-0.5 bg-[#edf3ec] text-[#346538] text-[11px] font-semibold rounded-[4px] uppercase tracking-wider">
              Verified Remote &amp; African Tech Roles
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111]">
              Find roles matched to your craft
            </h1>
            <p className="text-sm sm:text-base text-[#6a6a64] leading-relaxed">
              Explore verified engineering, product, and data opportunities open to Nigeria, Africa, and global remote teams.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6a6a64] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, skills (e.g. Next.js, Python), or company..."
                className="w-full h-11 pl-10 pr-4 text-sm bg-neutral-50 border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111]"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-6 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 active:bg-black transition-colors"
            >
              Search Roles
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden h-11 px-4 border border-[#e6e6e1] text-xs font-semibold rounded-[6px] flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </form>

          {/* Filter Bar (Desktop) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-2 border-t border-[#e6e6e1]">
            {/* Department */}
            <select
              value={queryDept}
              onChange={(e) => updateUrl({ department: e.target.value, page: '1' })}
              className="h-9 px-3 text-xs bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111]"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            {/* Location */}
            <select
              value={queryLoc}
              onChange={(e) => updateUrl({ location: e.target.value, page: '1' })}
              className="h-9 px-3 text-xs bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111]"
            >
              {LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            {/* Seniority */}
            <select
              value={querySeniority}
              onChange={(e) => updateUrl({ seniority: e.target.value, page: '1' })}
              className="h-9 px-3 text-xs bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111]"
            >
              {SENIORITY_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Job Type */}
            <select
              value={queryJobType}
              onChange={(e) => updateUrl({ job_type: e.target.value, page: '1' })}
              className="h-9 px-3 text-xs bg-white border border-[#e6e6e1] rounded-[6px] focus-visible:outline-2 focus-visible:outline-[#111]"
            >
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>{jt.label}</option>
              ))}
            </select>

            {/* Salary Shown Checkbox */}
            <label className="flex items-center gap-1.5 px-3 h-9 border border-[#e6e6e1] rounded-[6px] text-xs font-medium cursor-pointer select-none bg-white hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={querySalary}
                onChange={(e) => updateUrl({ salary_shown: e.target.checked ? 'true' : null, page: '1' })}
                className="w-3.5 h-3.5 rounded text-[#111]"
              />
              <span>Salary listed</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-[#9f2f2d] hover:underline font-medium px-2 py-1 ml-auto"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Mobile Filter Sheet */}
          {mobileFiltersOpen && (
            <div className="sm:hidden p-4 bg-neutral-50 border border-[#e6e6e1] rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#e6e6e1]">
                <span className="text-xs font-bold uppercase tracking-wider">Refine roles</span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-xs text-[#6a6a64]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Department</label>
                <select
                  value={queryDept}
                  onChange={(e) => updateUrl({ department: e.target.value, page: '1' })}
                  className="w-full h-9 px-2 text-xs bg-white border rounded"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Location</label>
                <select
                  value={queryLoc}
                  onChange={(e) => updateUrl({ location: e.target.value, page: '1' })}
                  className="w-full h-9 px-2 text-xs bg-white border rounded"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Seniority</label>
                <select
                  value={querySeniority}
                  onChange={(e) => updateUrl({ seniority: e.target.value, page: '1' })}
                  className="w-full h-9 px-2 text-xs bg-white border rounded"
                >
                  {SENIORITY_LEVELS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Job Type</label>
                <select
                  value={queryJobType}
                  onChange={(e) => updateUrl({ job_type: e.target.value, page: '1' })}
                  className="w-full h-9 px-2 text-xs bg-white border rounded"
                >
                  {JOB_TYPES.map((jt) => (
                    <option key={jt.value} value={jt.value}>{jt.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium pt-2">
                <input
                  type="checkbox"
                  checked={querySalary}
                  onChange={(e) => updateUrl({ salary_shown: e.target.checked ? 'true' : null, page: '1' })}
                  className="w-4 h-4 rounded text-[#111]"
                />
                <span>Salary listed</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full py-2 text-xs text-[#9f2f2d] font-semibold text-center border border-[#9f2f2d]/30 rounded mt-2"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Jobs Results List */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#e6e6e1]">
          <h2 className="text-sm font-bold text-[#111]">
            {initialResults.total} {initialResults.total === 1 ? 'Live Role' : 'Live Roles'} Available
          </h2>
          {isPending && (
            <span className="text-xs text-[#6a6a64] animate-pulse">
              Updating list...
            </span>
          )}
        </div>

        {initialResults.jobs.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center border border-dashed border-[#e6e6e1] rounded-[6px] bg-white p-8 space-y-3">
            <Briefcase className="w-8 h-8 text-[#6a6a64] mx-auto opacity-60" />
            <h3 className="text-base font-bold text-[#111]">
              No roles match your search filters
            </h3>
            <p className="text-xs text-[#6a6a64] max-w-sm mx-auto">
              Try broadening your location, keywords, or removing specific seniority constraints.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 bg-[#111] text-white text-xs font-semibold rounded-[6px]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Job Cards Grid */
          <div className="space-y-4">
            {initialResults.jobs.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const matchScore: MatchScoreResult | null =
                user && candidateProfile
                  ? computeJobMatchScore(job as any, candidateProfile)
                  : null;

              return (
                <div
                  key={job.id}
                  className="bg-white border border-[#e6e6e1] rounded-[6px] p-5 sm:p-6 hover:border-neutral-400 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Role Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="text-base sm:text-lg font-bold text-[#111] hover:underline truncate"
                        >
                          {job.title}
                        </Link>
                        {job.employer_verified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#346538] bg-[#edf3ec] px-2 py-0.5 rounded-[4px]">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-[#6a6a64] bg-neutral-100 px-2 py-0.5 rounded-[4px]">
                          {job.source_label}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-neutral-700 flex flex-wrap items-center gap-y-1 gap-x-3">
                        <span className="flex items-center gap-1 text-[#111]">
                          <Building2 className="w-3.5 h-3.5 text-[#6a6a64]" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#6a6a64]" />
                          {job.location_rule}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-[#6a6a64]" />
                          {job.seniority} · {job.employment_type}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          {job.salary || 'Salary not listed'}
                        </span>
                      </div>

                      <p className="text-xs text-[#6a6a64] line-clamp-2 leading-relaxed pt-1">
                        {job.summary}
                      </p>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {job.skills.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="text-[11px] font-medium px-2 py-0.5 bg-neutral-50 border border-[#e6e6e1] rounded-[4px] text-neutral-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Logged-in Match Score Reason */}
                      {user && matchScore && matchScore.score !== null && (
                        <div className="pt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{matchScore.score}% match · {matchScore.reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-2 sm:pt-0">
                      {user ? (
                        /* Logged in: Save and View Details */
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(e, job)}
                            title={isSaved ? 'Remove bookmark' : 'Save job'}
                            className={`p-2 rounded-[6px] border transition-colors ${
                              isSaved
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'border-[#e6e6e1] text-[#6a6a64] hover:text-[#111] hover:bg-neutral-50'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="h-9 px-4 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 flex items-center gap-1.5"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        /* Logged out: Sign up to apply preserving next param */
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/login?next=/jobs/${job.slug}`}
                            className="h-9 px-3 border border-[#e6e6e1] text-xs font-semibold rounded-[6px] text-neutral-700 hover:text-black hover:bg-neutral-50 flex items-center"
                          >
                            Log in
                          </Link>
                          <Link
                            href={`/register?next=/jobs/${job.slug}`}
                            onClick={() => fireJobAnalytics('apply_click_logged_out', { job_id: job.id })}
                            className="h-9 px-3.5 bg-[#111] text-white text-xs font-semibold rounded-[6px] hover:bg-neutral-800 flex items-center gap-1"
                          >
                            <span>Sign up to apply</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination / Load More (12 at a time) */}
        {initialResults.totalPages > 1 && (
          <div className="pt-8 flex items-center justify-between border-t border-[#e6e6e1] mt-8 text-xs font-medium">
            <button
              type="button"
              disabled={queryPage <= 1}
              onClick={() => updateUrl({ page: String(queryPage - 1) })}
              className="px-4 py-2 border border-[#e6e6e1] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Previous Page
            </button>
            <span className="text-[#6a6a64]">
              Page {queryPage} of {initialResults.totalPages} ({initialResults.total} total jobs)
            </span>
            <button
              type="button"
              disabled={!initialResults.hasMore}
              onClick={() => updateUrl({ page: String(queryPage + 1) })}
              className="px-4 py-2 bg-[#111] text-white rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800"
            >
              Next Page
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e6e6e1] bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6a6a64]">
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
