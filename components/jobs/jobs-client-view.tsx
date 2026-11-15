'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
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
  Check,
  Globe,
  Columns3,
  MapPin,
} from 'lucide-react';
import type { PublicJob, JobFilterParams, PublicJobsStats } from '@/lib/jobs/service';
import { createBrowserClient } from '@/lib/supabase/client';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { fetchCandidateTracker, saveJobToTracker } from '@/lib/tracker';
import { ApplyReadyResult } from '@/lib/candidate/apply-ready-config';
import { ExtendedCandidateProfile } from '@/lib/candidate/profile-store';
import { FinishProfileModal } from '@/components/jobs/finish-profile-modal';
import { ApplyFlowModal } from '@/components/jobs/apply-flow-modal';
import { DidYouApplyModal } from '@/components/jobs/did-you-apply-modal';
import { JobAlertsModal } from '@/components/jobs/job-alerts-modal';
import { FiltersDrawer } from '@/components/jobs/filters-drawer';
import {
  formatSalary,
  CurrencyChoice,
  PeriodChoice,
  EXCHANGE_RATES,
} from '@/lib/jobs/format-salary';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
    countsByModalityForFilters?: {
      all: number;
      remote: number;
      hybrid: number;
      onsite: number;
    };
  };
  filterParams: JobFilterParams;
  basePath?: string;
}

const CATEGORY_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Software Engineering', label: 'Software Engineering' },
  { value: 'Design', label: 'Design' },
  { value: 'Product', label: 'Product' },
  { value: 'Data', label: 'Data' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
];

const POPULAR_LOCATION_PILLS = ['Lagos', 'Abuja', 'Remote global'];

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

export function JobsClientView({
  initialResults,
  filterParams,
  basePath = '/find-work',
}: JobsClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetJobId = searchParams ? searchParams.get('jobId') : null;
  const [isPending, startTransition] = useTransition();

  // Active filter states from URL
  const activeQ = filterParams.q || '';
  const activeModality = (filterParams.modality || 'all').toLowerCase();
  const activeLoc = filterParams.location || 'all';
  const activeCategory = filterParams.category || filterParams.department || 'all';
  const activeOpenTo = filterParams.open_to || 'all';
  const activeSeniority = filterParams.seniority || 'all';
  const activeJobType = filterParams.job_type || 'all';
  const activeMinSalary = filterParams.min_salary || 0;
  const activeSalaryShown = Boolean(filterParams.salary_shown);
  const activeSort = filterParams.sort || 'recent';

  // Currency & Period display toggles
  const [currency, setCurrency] = useState<CurrencyChoice>('ORIGINAL');
  const [period, setPeriod] = useState<PeriodChoice>('ORIGINAL');

  // Input states in hero
  const [searchInput, setSearchInput] = useState(activeQ);
  const [selectedLocation, setSelectedLocation] = useState(activeLoc);

  // Filters Drawer state
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

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

  // Sticky nav and filter bar scroll listener
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isStuck, setIsStuck] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 100) {
        setIsStuck(true);
        if (currentY > lastScrollY.current + 8) {
          setIsNavVisible(false); // Scrolling down: auto-hide main nav
        } else if (currentY < lastScrollY.current - 8) {
          setIsNavVisible(true); // Scrolling up: show main nav
        }
      } else {
        setIsStuck(false);
        setIsNavVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync inputs when URL changes
  useEffect(() => {
    setSearchInput(activeQ);
  }, [activeQ]);

  useEffect(() => {
    setSelectedLocation(activeLoc);
  }, [activeLoc]);

  // Announce results change politely
  useEffect(() => {
    setAnnouncement(`${initialResults.total} roles found`);
  }, [initialResults.total]);

  // Auto-scroll to highlighted job if jobId query parameter is present
  useEffect(() => {
    if (targetJobId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`job-card-${targetJobId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [targetJobId, initialResults.jobs]);

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

          const profileRes = await fetch('/api/candidate/profile');
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.profile) {
              setCandidateProfile(pData.profile);
              setApplyReadyResult(pData.apply_ready);
            }
          }

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
    if (newParams.category !== undefined) {
      if (newParams.category !== 'all') {
        params.set('category', newParams.category);
        params.delete('department');
      } else {
        params.delete('category');
        params.delete('department');
      }
    }
    if (newParams.department !== undefined) {
      if (newParams.department !== 'all') params.set('department', newParams.department);
      else params.delete('department');
    }
    if (newParams.open_to !== undefined) {
      if (newParams.open_to !== 'all') params.set('open_to', newParams.open_to);
      else params.delete('open_to');
    }
    if (newParams.seniority !== undefined) {
      if (newParams.seniority !== 'all') params.set('seniority', newParams.seniority);
      else params.delete('seniority');
    }
    if (newParams.job_type !== undefined) {
      if (newParams.job_type !== 'all') params.set('job_type', newParams.job_type);
      else params.delete('job_type');
    }
    if (newParams.min_salary !== undefined) {
      if (newParams.min_salary > 0) params.set('min_salary', String(newParams.min_salary));
      else params.delete('min_salary');
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
      params.delete('page');
    }

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
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
    });
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSelectedLocation('all');
    startTransition(() => {
      router.push(basePath, { scroll: false });
    });
  };

  const handleTogglePopularPill = (loc: string) => {
    const locLower = loc.toLowerCase();
    if (activeLoc.toLowerCase() === locLower) {
      setSelectedLocation('all');
      updateFilters({ location: 'all' });
    } else {
      setSelectedLocation(locLower);
      updateFilters({ location: locLower });
    }
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

  // Modality counts respecting active filters
  const modalityCounts = initialResults.countsByModalityForFilters || initialResults.stats.countsByModality;

  // Active drawer filters count for badge
  const drawerActiveCount = [
    activeCategory !== 'all',
    activeOpenTo !== 'all',
    activeSeniority !== 'all',
    activeJobType !== 'all',
    Boolean(activeMinSalary && activeMinSalary > 0),
  ].filter(Boolean).length;

  // Active filter chips list
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (activeModality !== 'all') {
    activeChips.push({
      key: 'modality',
      label: `Work mode: ${activeModality.charAt(0).toUpperCase() + activeModality.slice(1)}`,
      onRemove: () => updateFilters({ modality: 'all' }),
    });
  }
  if (activeCategory !== 'all') {
    activeChips.push({
      key: 'category',
      label: `Category: ${activeCategory}`,
      onRemove: () => updateFilters({ category: 'all' }),
    });
  }
  if (activeLoc !== 'all') {
    activeChips.push({
      key: 'location',
      label: `Location: ${activeLoc}`,
      onRemove: () => {
        setSelectedLocation('all');
        updateFilters({ location: 'all' });
      },
    });
  }
  if (activeOpenTo !== 'all') {
    activeChips.push({
      key: 'open_to',
      label: `Open to: ${activeOpenTo}`,
      onRemove: () => updateFilters({ open_to: 'all' }),
    });
  }
  if (activeSeniority !== 'all') {
    activeChips.push({
      key: 'seniority',
      label: `Seniority: ${activeSeniority}`,
      onRemove: () => updateFilters({ seniority: 'all' }),
    });
  }
  if (activeJobType !== 'all') {
    activeChips.push({
      key: 'job_type',
      label: `Type: ${activeJobType}`,
      onRemove: () => updateFilters({ job_type: 'all' }),
    });
  }
  if (activeMinSalary > 0) {
    activeChips.push({
      key: 'min_salary',
      label: `Min pay: $${(activeMinSalary / 1000).toFixed(0)}k+`,
      onRemove: () => updateFilters({ min_salary: 0 }),
    });
  }
  if (activeQ.trim()) {
    activeChips.push({
      key: 'q',
      label: `Keyword: "${activeQ}"`,
      onRemove: () => {
        setSearchInput('');
        updateFilters({ q: '' });
      },
    });
  }

  // Dynamic live roles counter for Hero subline
  const rolesLive = initialResults.stats?.activeRoles || initialResults.total;

  return (
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

      {/* State-Aware Site Header with Auto-Hide on Scroll Down */}
      <SiteHeader ctaMode="profile" isNavVisible={isNavVisible} compact />

      <main id="jobs-content" className="flex-1">
        {/* 1. HERO SECTION (~240-280px tall) */}
        <section className="border-b border-border/70 bg-[#fcfcf9] dark:bg-neutral-950 pt-8 pb-7 px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {/* H1 & Subline */}
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white leading-[1.15]">
                Real remote jobs, open to Africa
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                Verified roles in customer support, engineering and beyond · {rolesLive} {rolesLive === 1 ? 'role' : 'roles'} · all confirmed open to Africa
              </p>
            </div>

            {/* Merged Search Input + Location Select + Visible Search Button */}
            <form onSubmit={handleSearchSubmit} className="mt-5 max-w-4xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-white dark:bg-neutral-900 border border-border/80 rounded-2xl shadow-sm">
                {/* Search Text Input */}
                <div className="flex-1 flex items-center px-3 gap-2.5 min-h-[46px]">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search role, skill, or keyword…"
                    className="w-full bg-transparent text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none"
                    aria-label="Search roles by keyword"
                  />
                </div>

                {/* Location Select */}
                <div className="sm:w-52 border-t sm:border-t-0 sm:border-l border-border/70 flex items-center px-3 gap-2 min-h-[46px]">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer"
                    aria-label="Filter by location"
                  >
                    <option value="all">All locations</option>
                    <option value="lagos">Lagos</option>
                    <option value="abuja">Abuja</option>
                    <option value="remote global">Remote global</option>
                    {initialResults.availableLocations
                      .filter(
                        (l) =>
                          !['lagos', 'abuja', 'remote global'].includes(l.toLowerCase())
                      )
                      .map((loc) => (
                        <option key={loc} value={loc.toLowerCase()}>
                          {loc}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Visible Search Button */}
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0 shadow-sm"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Optional Popular Pills (Lagos, Abuja, Remote global) */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                Popular:
              </span>
              {POPULAR_LOCATION_PILLS.map((pill) => {
                const isActive = activeLoc.toLowerCase() === pill.toLowerCase();
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleTogglePopularPill(pill)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-border/70 hover:border-neutral-950 dark:hover:border-white'
                    }`}
                  >
                    <span>{pill}</span>
                    {isActive && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. TRUST STRIP UNDER HERO (Three Check icons) */}
        <section className="border-b border-border/70 bg-white dark:bg-neutral-900 py-3.5 px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-neutral-800 dark:text-neutral-200 font-medium">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Every role confirmed real</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Africa eligibility stated upfront</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Track applications in SyncFlow</span>
            </div>
          </div>
        </section>

        {/* 3 & 4. STICKY FILTER BAR (~56-60px tall) */}
        <div
          className={cn(
            'sticky z-30 transition-all duration-200 bg-[#fcfcf9] dark:bg-neutral-950 border-b border-border/70 px-5 sm:px-8 lg:px-12 backdrop-blur-md',
            isStuck ? 'shadow-sm' : '',
            isNavVisible ? 'top-16' : 'top-0'
          )}
        >
          <div className="mx-auto max-w-7xl py-2.5 space-y-2">
            {/* Top Row: Work-mode chips + Filters button + Sort select */}
            <div className="flex flex-wrap items-center justify-between gap-3 min-h-[38px]">
              {/* Work-mode Chips with color dot + text + live counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'All', count: modalityCounts.all, dot: 'bg-neutral-400 dark:bg-neutral-500' },
                  { id: 'remote', label: 'Remote', count: modalityCounts.remote, dot: 'bg-emerald-500' },
                  { id: 'hybrid', label: 'Hybrid', count: modalityCounts.hybrid, dot: 'bg-sky-500' },
                  { id: 'onsite', label: 'Onsite', count: modalityCounts.onsite, dot: 'bg-amber-500' },
                ].map((chip) => {
                  const isSelected = activeModality === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => updateFilters({ modality: chip.id as any })}
                      className={`h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white font-semibold'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-border/70 hover:border-neutral-950 dark:hover:border-white'
                      }`}
                    >
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', chip.dot)} aria-hidden="true" />
                      <span>{chip.label}</span>
                      <span className={isSelected ? 'text-white/80 dark:text-neutral-900/80 font-normal' : 'text-muted-foreground'}>
                        ({chip.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Side Controls: Filters button + Sort select */}
              <div className="flex items-center gap-2">
                {/* Filters button with active count badge */}
                <button
                  ref={filtersButtonRef}
                  type="button"
                  aria-expanded={filtersDrawerOpen}
                  onClick={() => setFiltersDrawerOpen(true)}
                  className={`h-8 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                    drawerActiveCount > 0
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white font-semibold'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-border/70 hover:border-neutral-950 dark:hover:border-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {drawerActiveCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white text-[10px] flex items-center justify-center font-bold">
                      {drawerActiveCount}
                    </span>
                  )}
                </button>

                {/* Sort Select */}
                <div className="relative">
                  <select
                    value={activeSort}
                    onChange={(e) => updateFilters({ sort: e.target.value as any })}
                    className="h-8 pl-3 pr-7 rounded-full text-xs font-medium border border-border/70 bg-white dark:bg-neutral-900 text-foreground focus:outline-none cursor-pointer appearance-none"
                    aria-label="Sort listings"
                  >
                    <option value="recent">Newest</option>
                    <option value="salary_desc">Highest salary</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bottom Row: Category Chip Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-t border-border/40">
              {CATEGORY_CHIPS.map((cat) => {
                const isSelected =
                  (cat.value === 'all' && activeCategory === 'all') ||
                  activeCategory.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button
                    key={cat.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateFilters({ category: cat.value as any })}
                    className={`h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex-shrink-0 ${
                      isSelected
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white font-semibold'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-border/60 hover:border-neutral-950 dark:hover:border-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. MAIN RESULTS SECTION */}
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-8 space-y-10">
          {/* Results Heading with aria-live="polite" and Removable Filter Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white"
                aria-live="polite"
              >
                {initialResults.total} {initialResults.total === 1 ? 'active role' : 'active roles'}
              </h2>

              {activeChips.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Removable Active-Filter Chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-border/60"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Remove filter ${chip.label}`}
                      className="p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured Roles Row (Only if >= 3 qualify, limited to 3) */}
          {initialResults.featuredRoles.length >= 3 && (
            <section aria-labelledby="featured-roles-heading" className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3
                  id="featured-roles-heading"
                  className="text-sm font-bold uppercase tracking-wider text-neutral-950 dark:text-white"
                >
                  Featured opportunities
                </h3>
                <span className="text-xs text-muted-foreground">
                  Verified roles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {initialResults.featuredRoles.slice(0, 3).map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  const salaryFormatted = formatSalary(job, currency, period).formatted;

                  return (
                    <article
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`relative group p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        targetJobId === job.id
                          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500 shadow-md'
                          : 'border-border/80 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top row */}
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
                                Featured
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

                        {/* Title & Salary */}
                        <div>
                          <h4 className="text-base font-bold text-neutral-950 dark:text-white group-hover:underline">
                            <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
                              {job.title}
                            </Link>
                          </h4>
                          <p className={`text-xs mt-1 ${salaryFormatted === 'Salary not disclosed' ? 'font-normal text-muted-foreground' : 'font-semibold text-neutral-900 dark:text-neutral-100'}`}>
                            {salaryFormatted}
                          </p>
                        </div>

                        {/* Modality & Location */}
                        <p className="text-xs text-muted-foreground font-medium">
                          {job.modality} · {job.city_location || job.location_rule}
                        </p>
                      </div>

                      {/* Footer */}
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

          {/* All Roles Section: 2-Column Grid on Desktop, 1 on Mobile, Equal-Height Rows */}
          <section aria-labelledby="all-roles-heading" className="space-y-6">
            <h3 id="all-roles-heading" className="sr-only">
              All roles
            </h3>

            {initialResults.jobs.length === 0 ? (
              /* Empty state */
              <div className="py-16 text-center border border-dashed border-border/80 rounded-3xl p-8 space-y-4 bg-white/40 dark:bg-neutral-900/40">
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  No roles match your filters
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing some filters or searching for broader terms like &quot;developer&quot;, &quot;designer&quot;, or &quot;support&quot;.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="px-5 py-2.5 rounded-full border border-neutral-900 dark:border-white text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 transition-colors"
                  >
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertsModalOpen(true)}
                    className="px-5 py-2.5 rounded-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    Get job alerts
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {initialResults.jobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  const salaryFormatted = formatSalary(job, currency, period).formatted;

                  return (
                    <article
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`relative group p-6 rounded-2xl border transition-all flex flex-col justify-between h-full ${
                        targetJobId === job.id
                          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500 shadow-md'
                          : 'border-border/80 bg-white dark:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white'
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Row 1: Employer avatar/initials, Name, Agency tag, Bookmark */}
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
                                {job.is_agency && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                                    Agency
                                  </span>
                                )}
                              </div>
                              {job.industry && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {job.industry}
                                </p>
                              )}
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

                        {/* Row 2: Title & Salary */}
                        <div>
                          <h4 className="text-lg font-bold text-neutral-950 dark:text-white group-hover:underline">
                            <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0">
                              {job.title}
                            </Link>
                          </h4>
                          <p className={`text-sm mt-1 ${salaryFormatted === 'Salary not disclosed' ? 'font-normal text-muted-foreground' : 'font-bold text-neutral-950 dark:text-white'}`}>
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

                        {/* Row 4: Eligibility Line with Popover */}
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

                        {/* Row 6: Skill chips */}
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

                      {/* Card Footer: Posted date & Apply Button */}
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

            {/* Load More & Job Alerts Controls */}
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
                        : `Show ${Math.min(initialResults.limit, initialResults.total - initialResults.jobs.length)} more`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setAlertsModalOpen(true)}
                    className="h-10 px-5 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm"
                  >
                    Get job alerts
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 7. PAGE BOTTOM VALUE STRIP (Three One-Line Items using Check, Globe, Columns3) */}
        <section className="border-t border-border/70 bg-white dark:bg-neutral-900 py-10 px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Item 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                  Real roles only.
                </p>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                  Africa-eligible, stated upfront.
                </p>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Columns3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                  SyncFlow: your private pipeline.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Site Footer */}
      <SiteFooter />

      {/* 5. FILTERS DRAWER (Right drawer on desktop, bottom sheet on mobile) */}
      <FiltersDrawer
        isOpen={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        triggerRef={filtersButtonRef}
        activeCategory={activeCategory}
        activeOpenTo={activeOpenTo}
        activeSeniority={activeSeniority}
        activeJobType={activeJobType}
        activeMinSalary={activeMinSalary}
        currency={currency}
        period={period}
        onCurrencyChange={setCurrency}
        onPeriodChange={setPeriod}
        onApplyFilters={(draft) => {
          updateFilters({
            category: draft.category as any,
            open_to: draft.open_to,
            seniority: draft.seniority,
            job_type: draft.job_type,
            min_salary: draft.min_salary,
          });
        }}
        onClearAll={handleClearAllFilters}
        matchingCount={initialResults.total}
      />

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
  );
}
