'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  ChevronDown,
  X,
} from 'lucide-react';
import type { PublicJob, JobFilterParams, PublicJobsStats } from '@/lib/jobs/service';
import { createBrowserClient } from '@/lib/supabase/client';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { computeJobMatchScore, MatchScoreResult } from '@/lib/candidate/matching';
import { fetchCandidateTracker, saveJobToTracker } from '@/lib/tracker';
import { evaluateApplyReady, ApplyReadyResult } from '@/lib/candidate/apply-ready-config';
import { ExtendedCandidateProfile } from '@/lib/candidate/profile-store';
import { FinishProfileModal } from '@/components/jobs/finish-profile-modal';
import { ApplyFlowModal } from '@/components/jobs/apply-flow-modal';
import { DidYouApplyModal } from '@/components/jobs/did-you-apply-modal';
import { JobAlertsModal } from '@/components/jobs/job-alerts-modal';
import {
  formatSalary,
  CurrencyChoice,
  PeriodChoice,
  EXCHANGE_RATES,
} from '@/lib/jobs/format-salary';
import {
  VERIFICATION_CLAIMS,
  BENEFIT_STRIP_ITEMS,
  HIRING_LINE_COPY,
  formatH1Subline,
} from '@/lib/jobs/trust-copy';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface JobsClientViewProps {
  initialResults: {
    jobs: PublicJob[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
    featuredRoles: PublicJob[];
    stats: PublicJobsStats;
    availableLocations: string[];
  };
  filterParams: JobFilterParams;
}

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

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function JobsClientView({ initialResults, filterParams }: JobsClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active filter states from URL
  const activeQ = filterParams.q || '';
  const activeModality = (filterParams.modality || 'all').toLowerCase();
  const activeLoc = filterParams.location || 'all';
  const activeDept = filterParams.department || 'all';
  const activeSeniority = filterParams.seniority || 'all';
  const activeJobType = filterParams.job_type || 'all';
  const activeSalaryShown = Boolean(filterParams.salary_shown);
  const activeSort = filterParams.sort || 'recent';

  // Currency & Period display toggles
  const [currency, setCurrency] = useState<CurrencyChoice>('ORIGINAL');
  const [period, setPeriod] = useState<PeriodChoice>('ORIGINAL');

  // Input states
  const [searchInput, setSearchInput] = useState(activeQ);
  const [selectedLocation, setSelectedLocation] = useState(activeLoc);
  const [selectedModality, setSelectedModality] = useState(activeModality);

  // Popular searches
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Mobile filters drawer
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  // Alerts modal
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  // Apply & Profile modals
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [didYouApplyOpen, setDidYouApplyOpen] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState<PublicJob | null>(null);

  // User & Candidate auth state
  const [user, setUser] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<ExtendedCandidateProfile | null>(null);
  const [applyReadyResult, setApplyReadyResult] = useState<ApplyReadyResult | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Polite live announcement message
  const [announcement, setAnnouncement] = useState('');

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(activeQ);
  }, [activeQ]);

  useEffect(() => {
    setSelectedLocation(activeLoc);
  }, [activeLoc]);

  useEffect(() => {
    setSelectedModality(activeModality);
  }, [activeModality]);

  // Load Popular Searches on mount
  useEffect(() => {
    async function loadPopular() {
      try {
        const res = await fetch('/api/public/jobs/popular-searches');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.popularSearches)) {
            setPopularSearches(data.popularSearches);
          }
        }
      } catch {}
    }
    loadPopular();
  }, []);

  // Announce results change
  useEffect(() => {
    setAnnouncement(`${initialResults.total} roles found`);
  }, [initialResults.total]);

  // Auth & profile check
  useEffect(() => {
    fireJobAnalytics('jobs_list_view', {
      total: initialResults.total,
      modality: activeModality,
    });

    async function checkUser() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();

        if (data?.user) {
          setUser(data.user);

          // Candidate profile & apply_ready status
          const profileRes = await fetch('/api/candidate/profile');
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.profile) {
              setCandidateProfile(pData.profile);
              setApplyReadyResult(pData.apply_ready);
            }
          }

          // Saved jobs in tracker
          const tracker = await fetchCandidateTracker(data.user.id);
          const savedIds = new Set<string>();
          tracker.forEach((t) => {
            if (t.job_id) savedIds.add(t.job_id);
          });
          setSavedJobIds(savedIds);
        }
      } catch {}
    }

    checkUser();
  }, [initialResults.total, activeModality]);

  // URL Query Updater
  const updateFilters = (newParams: Partial<JobFilterParams>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Merge parameters
    if (newParams.q !== undefined) {
      if (newParams.q.trim()) params.set('q', newParams.q.trim());
      else params.delete('q');
    }
    if (newParams.modality !== undefined) {
      if (newParams.modality !== 'all') params.set('modality', newParams.modality);
      else params.delete('modality');
    }
    if (newParams.location !== undefined) {
      if (newParams.location !== 'all') params.set('location', newParams.location);
      else params.delete('location');
    }
    if (newParams.department !== undefined) {
      if (newParams.department !== 'all') params.set('department', newParams.department);
      else params.delete('department');
    }
    if (newParams.seniority !== undefined) {
      if (newParams.seniority !== 'all') params.set('seniority', newParams.seniority);
      else params.delete('seniority');
    }
    if (newParams.job_type !== undefined) {
      if (newParams.job_type !== 'all') params.set('job_type', newParams.job_type);
      else params.delete('job_type');
    }
    if (newParams.salary_shown !== undefined) {
      if (newParams.salary_shown) params.set('salary_shown', 'true');
      else params.delete('salary_shown');
    }
    if (newParams.sort !== undefined) {
      if (newParams.sort !== 'recent') params.set('sort', newParams.sort);
      else params.delete('sort');
    }
    if (newParams.page !== undefined) {
      if (newParams.page > 1) params.set('page', String(newParams.page));
      else params.delete('page');
    } else {
      // Reset page to 1 whenever filters change
      params.delete('page');
    }

    startTransition(() => {
      router.push(`/jobs?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Log search query for popular searches pipeline
      fetch('/api/public/jobs/popular-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchInput.trim() }),
      }).catch(() => {});
      fireJobAnalytics('job_search', { query: searchInput.trim() });
    }

    updateFilters({
      q: searchInput,
      location: selectedLocation,
      modality: selectedModality as any,
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedLocation('all');
    setSelectedModality('all');
    startTransition(() => {
      router.push('/jobs', { scroll: false });
    });
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, job: PublicJob) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/register?next=/jobs/${job.slug}&save=1`);
      return;
    }

    const isCurrentlySaved = savedJobIds.has(job.id);
    const updated = new Set(savedJobIds);

    if (isCurrentlySaved) {
      updated.delete(job.id);
    } else {
      updated.add(job.id);
      await saveJobToTracker({
        id: job.id,
        title: job.title,
        company: job.company,
        candidate_required_location: job.location_rule,
      });
      fireJobAnalytics('job_saved', { job_id: job.id });
    }

    setSavedJobIds(updated);
  };

  const handleCardApplyClick = (e: React.MouseEvent, job: PublicJob) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      fireJobAnalytics('apply_click_logged_out', { job_id: job.id });
      router.push(`/register?next=/jobs/${job.slug}`);
      return;
    }

    if (!applyReadyResult?.is_apply_ready) {
      setSelectedJobForModal(job);
      setFinishModalOpen(true);
      return;
    }

    setSelectedJobForModal(job);
    if (job.source_type === 'employer') {
      setApplyModalOpen(true);
    } else {
      // External / Curated job
      fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.apply_url) {
            window.open(data.apply_url, '_blank', 'noopener,noreferrer');
            setDidYouApplyOpen(true);
          }
        })
        .catch(() => {});
    }
  };

  const activeFilterCount = [
    activeDept !== 'all',
    activeSeniority !== 'all',
    activeJobType !== 'all',
    activeSalaryShown,
  ].filter(Boolean).length;

  const stats = initialResults.stats;
  const isConvertedAny = currency !== 'ORIGINAL';

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#fcfcf9] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
        {/* Skip to Content Link */}
        <a
          href="#jobs-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-neutral-900 text-white px-4 py-2 rounded-full text-xs font-medium outline-none ring-2 ring-neutral-900"
        >
          Skip to job listings
        </a>

        {/* Polite Live Region for Screen Readers */}
        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        {/* State-Aware Site Header */}
        <SiteHeader ctaMode="profile" />

        <main id="jobs-content" className="flex-1">
          {/* Hero Section */}
          <section className="border-b border-border/60 bg-[#fcfcf9] dark:bg-neutral-950 pt-10 pb-8 px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">
              {/* Live Hiring Line above H1 */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest text-[11px]">
                    {HIRING_LINE_COPY.desk}
                  </span>
                  <span>·</span>
                  <span>{HIRING_LINE_COPY.formatUpdated(getRelativeTimeString(stats.latestPublishDate))}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium">
                  {stats.hasVerifiedEmployers && (
                    <span>{HIRING_LINE_COPY.rightEmployers}</span>
                  )}
                  {stats.hasVerifiedEmployers && <span>·</span>}
                  <span>{HIRING_LINE_COPY.rightPay}</span>
                </div>
              </div>

              {/* H1 & Subline */}
              <div className="pt-6 pb-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 dark:text-white leading-[1.15]">
                  Active Remote and Onsite jobs, with <u className="decoration-2 underline-offset-4 decoration-neutral-900 dark:decoration-white">Fit for You</u>.
                </h1>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground font-medium">
                  {formatH1Subline({
                    activeRoles: stats.activeRoles,
                    activeEmployers: stats.activeEmployers,
                    hasVerifiedEmployers: stats.hasVerifiedEmployers,
                  })}
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="mt-2">
                <div className="flex flex-col md:flex-row items-stretch gap-2.5 p-2 bg-white dark:bg-neutral-900 border border-border/80 rounded-2xl shadow-sm">
                  {/* Keyword Input */}
                  <div className="flex-1 flex items-center px-3.5 gap-2.5 min-h-[48px]">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search role, tech stack, keyword…"
                      className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  {/* Location Select */}
                  <div className="md:w-56 border-t md:border-t-0 md:border-l border-border/70 flex items-center px-3.5 min-h-[48px]">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer"
                      aria-label="Filter by location"
                    >
                      <option value="all">All locations</option>
                      {initialResults.availableLocations.map((loc) => (
                        <option key={loc} value={loc.toLowerCase()}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Modality Select */}
                  <div className="md:w-44 border-t md:border-t-0 md:border-l border-border/70 flex items-center px-3.5 min-h-[48px]">
                    <select
                      value={selectedModality}
                      onChange={(e) => setSelectedModality(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer"
                      aria-label="Filter by modality"
                    >
                      <option value="all">Modality: Any</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <span>Search roles</span>
                    <span>→</span>
                  </button>
                </div>
              </form>

              {/* Benefit Strip (3 Plain Text Items, NO Icons) */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/40">
                {BENEFIT_STRIP_ITEMS.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 dark:text-neutral-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Popular Searches Row (Conditional: >= 3 qualify) */}
              {popularSearches.length >= 3 && (
                <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
                  <span className="text-xs font-medium text-muted-foreground mr-1">
                    Popular searches:
                  </span>
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchInput(term);
                        updateFilters({ q: term });
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium border border-border/70 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Sticky Filter Bar under Header */}
          <div className="sticky top-[76px] z-30 bg-[#fcfcf9] dark:bg-neutral-950 border-b border-border/70 py-3 px-5 sm:px-8 lg:px-12 backdrop-blur-md">
            <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
              {/* Modality Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: `All roles (${stats.countsByModality.all})` },
                  { id: 'remote', label: `Remote (${stats.countsByModality.remote})` },
                  { id: 'hybrid', label: `Hybrid (${stats.countsByModality.hybrid})` },
                  { id: 'onsite', label: `Onsite (${stats.countsByModality.onsite})` },
                ].map((pill) => {
                  const isSelected = activeModality === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => updateFilters({ modality: pill.id as any })}
                      className={`h-9 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        isSelected
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                          : 'bg-white dark:bg-neutral-900 text-muted-foreground border-border/70 hover:border-neutral-900 dark:hover:border-white'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Controls: Filters Drawer, Sort, Currency & Period Toggles */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Currency Toggles */}
                <div className="inline-flex rounded-full border border-border/70 p-0.5 bg-white dark:bg-neutral-900 text-xs">
                  {(['ORIGINAL', 'NGN', 'USD'] as CurrencyChoice[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        currency === c
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {c === 'ORIGINAL' ? 'Original' : c === 'NGN' ? '₦' : '$'}
                    </button>
                  ))}
                </div>

                {/* Period Toggles */}
                <div className="inline-flex rounded-full border border-border/70 p-0.5 bg-white dark:bg-neutral-900 text-xs">
                  {(['MONTHLY', 'YEARLY'] as PeriodChoice[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        period === p
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                    </button>
                  ))}
                </div>

                {/* More Filters Drawer Button */}
                <button
                  type="button"
                  aria-expanded={filtersDrawerOpen}
                  onClick={() => setFiltersDrawerOpen(!filtersDrawerOpen)}
                  className={`h-9 px-3 rounded-full text-xs font-medium border border-border/70 bg-white dark:bg-neutral-900 flex items-center gap-1.5 transition-colors ${
                    activeFilterCount > 0 ? 'border-neutral-950 dark:border-white text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[10px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={activeSort}
                  onChange={(e) => updateFilters({ sort: e.target.value as any })}
                  className="h-9 px-3 rounded-full text-xs font-medium border border-border/70 bg-white dark:bg-neutral-900 text-foreground focus:outline-none cursor-pointer"
                  aria-label="Sort listings"
                >
                  <option value="recent">Most recent</option>
                  {applyReadyResult?.is_apply_ready && (
                    <option value="match">Best match</option>
                  )}
                </select>
              </div>
            </div>

            {/* Currency conversion notice */}
            {isConvertedAny && (
              <div className="mx-auto max-w-7xl pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                <span>≈ Exchange rates updated {EXCHANGE_RATES.lastUpdatedDate}</span>
              </div>
            )}
          </div>

          {/* Filters Drawer (Inline collapse/expand) */}
          {filtersDrawerOpen && (
            <div className="border-b border-border/70 bg-white dark:bg-neutral-900 py-4 px-5 sm:px-8 lg:px-12 transition-all">
              <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Department */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Department
                  </label>
                  <select
                    value={activeDept}
                    onChange={(e) => updateFilters({ department: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-border/70 bg-background text-xs focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seniority */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Seniority
                  </label>
                  <select
                    value={activeSeniority}
                    onChange={(e) => updateFilters({ seniority: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-border/70 bg-background text-xs focus:outline-none"
                  >
                    {SENIORITY_LEVELS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Job Type
                  </label>
                  <select
                    value={activeJobType}
                    onChange={(e) => updateFilters({ job_type: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-border/70 bg-background text-xs focus:outline-none"
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salary Shown & Reset */}
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none mb-2">
                    <input
                      type="checkbox"
                      checked={activeSalaryShown}
                      onChange={(e) => updateFilters({ salary_shown: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span>Only show roles with listed pay</span>
                  </label>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs text-muted-foreground hover:text-foreground underline text-left"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Listings Section */}
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 space-y-12">
            {/* Featured Roles (Section 2 & 4: Only if >= 3 qualify) */}
            {initialResults.featuredRoles.length >= 3 && (
              <section aria-labelledby="featured-roles-heading" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2
                    id="featured-roles-heading"
                    className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white"
                  >
                    Featured roles
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    Curated by our talent desk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {initialResults.featuredRoles.map((job) => {
                    const isSaved = savedJobIds.has(job.id);
                    const salaryFormatted = formatSalary(job, currency, period).formatted;

                    return (
                      <article
                        key={job.id}
                        className="relative group p-5 rounded-2xl border border-border/80 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Top row: Employer initials/logo + label + bookmark */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-border/60 flex items-center justify-center font-bold text-xs text-foreground flex-shrink-0">
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
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                  {job.company}
                                </p>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                  {job.is_sponsored ? 'Sponsored' : 'Featured'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleBookmarkToggle(e, job)}
                              aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                              className="relative z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isSaved ? 'fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white' : ''}`}
                              />
                            </button>
                          </div>

                          {/* Title with stretched link */}
                          <div>
                            <h3 className="text-base font-bold text-neutral-950 dark:text-white group-hover:underline">
                              <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
                                {job.title}
                              </Link>
                            </h3>
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                              {salaryFormatted}
                            </p>
                          </div>

                          {/* Modality & Location */}
                          <p className="text-xs text-muted-foreground font-medium">
                            {job.modality} · {job.city_location || job.location_rule}
                          </p>
                        </div>

                        {/* Footer: Posted date & Apply button */}
                        <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Posted {getRelativeTimeString(job.posted_date)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCardApplyClick(e, job)}
                            className="relative z-10 px-3.5 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                          >
                            {!user ? 'Sign up to apply' : !applyReadyResult?.is_apply_ready ? 'Finish profile' : 'Apply'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Open Roles List (Section 4 & 5: Two-Column Grid) */}
            <section aria-labelledby="open-roles-heading" className="space-y-6">
              <div>
                <h2
                  id="open-roles-heading"
                  className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white"
                >
                  Open roles
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Roles posted by employers, with pay ranges shown up front.
                </p>
              </div>

              {/* Roles Grid */}
              {initialResults.jobs.length === 0 ? (
                /* Empty state */
                <div className="py-16 text-center border border-dashed border-border/80 rounded-2xl p-8 space-y-4 bg-white/40 dark:bg-neutral-900/40">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    No roles match your filters
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try clearing some filters or searching for broader terms like &quot;developer&quot;, &quot;designer&quot;, or &quot;remote&quot;.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-4 py-2 rounded-full border border-neutral-900 dark:border-white text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 transition-colors"
                    >
                      Clear filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertsModalOpen(true)}
                      className="px-4 py-2 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Get job alerts
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {initialResults.jobs.map((job) => {
                    const isSaved = savedJobIds.has(job.id);
                    const salaryFormatted = formatSalary(job, currency, period).formatted;

                    return (
                      <article
                        key={job.id}
                        className="relative group p-6 rounded-2xl border border-border/80 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3.5">
                          {/* Row 1: Employer avatar/initials, Name, Verified Chip, Agency tag, Bookmark */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
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
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                    {job.company}
                                  </span>

                                  {/* Employer Verified Plain Text Chip */}
                                  {job.employer_verified && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-help">
                                          {VERIFICATION_CLAIMS.employer_verified.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs text-xs">
                                        {VERIFICATION_CLAIMS.employer_verified.getTooltip(job.employer_verified_at)}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}

                                  {/* Agency Listing Tag */}
                                  {job.is_agency && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground cursor-help">
                                          {VERIFICATION_CLAIMS.agency_listing.label}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs text-xs">
                                        {VERIFICATION_CLAIMS.agency_listing.tooltip}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                {job.industry && (
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {job.industry}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Bookmark Button */}
                            <button
                              type="button"
                              onClick={(e) => handleBookmarkToggle(e, job)}
                              aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                              className="relative z-10 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isSaved ? 'fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white' : ''}`}
                              />
                            </button>
                          </div>

                          {/* Row 2: Title & Salary */}
                          <div>
                            <h3 className="text-lg font-bold text-neutral-950 dark:text-white group-hover:underline">
                              <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
                                {job.title}
                              </Link>
                            </h3>
                            <p className="text-sm font-bold text-neutral-950 dark:text-white mt-1">
                              {salaryFormatted}
                            </p>
                          </div>

                          {/* Row 3: Modality, Location & Employment Type */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span>
                              {job.modality} · {job.city_location || job.location_rule}
                            </span>
                            <span>·</span>
                            <span>{job.employment_type}</span>
                          </div>

                          {/* Row 4: Eligibility Line with Accessible Popover */}
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>
                              Open to {job.eligible_countries.slice(0, 3).join(', ')}
                            </span>
                            {job.eligible_countries.length > 3 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative z-10 underline font-semibold text-neutral-900 dark:text-neutral-100 hover:no-underline"
                                    aria-label={`View all ${job.eligible_countries.length} eligible countries`}
                                  >
                                    +{job.eligible_countries.length - 3}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 text-xs bg-white dark:bg-neutral-900 border border-border shadow-md rounded-xl">
                                  <p className="font-semibold text-foreground mb-1.5">
                                    Eligible Locations ({job.eligible_countries.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {job.eligible_countries.map((c) => (
                                      <span
                                        key={c}
                                        className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px]"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>

                          {/* Row 5: Two-line summary */}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {job.summary}
                          </p>

                          {/* Row 6: Skill chips (up to 4 +N) */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {job.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border/70 bg-white dark:bg-neutral-950 text-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 4 && (
                              <span className="text-[11px] font-medium text-muted-foreground px-1">
                                +{job.skills.length - 4}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer: Posted relative time & Apply Button */}
                        <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">
                            Posted {getRelativeTimeString(job.posted_date)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleCardApplyClick(e, job)}
                            className="relative z-10 px-4 py-2 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                          >
                            {!user
                              ? 'Sign up to apply'
                              : !applyReadyResult?.is_apply_ready
                              ? 'Finish profile to apply'
                              : 'Apply'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls & Get Job Alerts */}
              {initialResults.jobs.length > 0 && (
                <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground font-medium">
                    Showing {initialResults.jobs.length} of {initialResults.total} roles
                  </span>

                  <div className="flex items-center gap-3">
                    {initialResults.hasMore && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => updateFilters({ page: (filterParams.page || 1) + 1 })}
                        className="h-10 px-5 rounded-full border border-border/80 bg-white dark:bg-neutral-900 text-xs font-semibold hover:border-neutral-950 dark:hover:border-white transition-colors"
                      >
                        {isPending
                          ? 'Loading...'
                          : `Load more roles (${initialResults.total - initialResults.jobs.length})`}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setAlertsModalOpen(true)}
                      className="h-10 px-5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                    >
                      Get job alerts
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Employer Band (Section 4 & 10: Strict Styling) */}
            <section className="rounded-3xl border border-border/80 bg-white dark:bg-neutral-900 p-8 sm:p-10">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Are you a tech founder or hiring manager?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Post a role on Sync730 and review a ranked, evidence-backed shortlist from AI-moderated interviews.
                </p>
                <div className="pt-3 flex flex-wrap gap-3">
                  <Link
                    href="/recruiter/register"
                    className="h-11 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center"
                  >
                    Post a role
                  </Link>
                  <Link
                    href="/employer-guide"
                    className="h-11 px-6 rounded-full border border-border/80 bg-transparent text-xs font-semibold text-foreground hover:border-neutral-950 dark:hover:border-white transition-colors flex items-center justify-center"
                  >
                    Employer guide
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Shared Site Footer */}
        <SiteFooter />

        {/* Finish Profile Modal (gated apply) */}
        {selectedJobForModal && applyReadyResult && (
          <FinishProfileModal
            isOpen={finishModalOpen}
            onClose={() => setFinishModalOpen(false)}
            jobTitle={selectedJobForModal.title}
            jobSlug={selectedJobForModal.slug}
            missingItems={applyReadyResult.missing_items}
            completedSteps={applyReadyResult.completed_steps}
            totalSteps={applyReadyResult.total_steps}
          />
        )}

        {/* Employer Application Flow Modal */}
        {selectedJobForModal && candidateProfile && (
          <ApplyFlowModal
            isOpen={applyModalOpen}
            onClose={() => setApplyModalOpen(false)}
            job={selectedJobForModal}
            candidateProfile={candidateProfile}
            onSuccess={() => {
              setApplyModalOpen(false);
              const nextSaved = new Set(savedJobIds);
              nextSaved.add(selectedJobForModal.id);
              setSavedJobIds(nextSaved);
            }}
          />
        )}

        {/* Did You Apply Modal (for external tracker flow) */}
        {selectedJobForModal && (
          <DidYouApplyModal
            isOpen={didYouApplyOpen}
            onClose={() => setDidYouApplyOpen(false)}
            jobTitle={selectedJobForModal.title}
            companyName={selectedJobForModal.company}
          />
        )}

        {/* Job Alerts Modal */}
        <JobAlertsModal
          isOpen={alertsModalOpen}
          onClose={() => setAlertsModalOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
