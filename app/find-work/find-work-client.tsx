'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Building2,
  Star,
  Bookmark,
  Check,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
  Briefcase,
  Globe2,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { RemoteJob } from '@/lib/supabase/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { saveJobToTracker, getLocalTrackerItems } from '@/lib/tracker';
import SalaryDisplay from '@/components/ui/SalaryDisplay';
import { toast } from 'sonner';

interface FindWorkClientProps {
  initialJobs: RemoteJob[];
}

type WorkModeFilter = 'ALL' | 'REMOTE' | 'HYBRID' | 'ONSITE';
type LocationFilter = 'ALL' | 'LAGOS' | 'ABUJA' | 'PORT_HARCOURT' | 'REMOTE_GLOBAL';

export function FindWorkClient({ initialJobs }: FindWorkClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<RemoteJob[]>(initialJobs);
  const [user, setUser] = useState<any>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState<WorkModeFilter>('ALL');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('ALL');

  // Check user auth and load saved tracker items
  useEffect(() => {
    async function initAuth() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
        }
      } catch {
        // Logged out / local mode
      }

      const tracker = getLocalTrackerItems();
      const savedIds = new Set(tracker.map((t) => t.job_id).filter(Boolean) as string[]);
      setSavedJobIds(savedIds);
    }

    initAuth();

    const handleTrackerUpdate = () => {
      const tracker = getLocalTrackerItems();
      const savedIds = new Set(tracker.map((t) => t.job_id).filter(Boolean) as string[]);
      setSavedJobIds(savedIds);
    };

    window.addEventListener('sync730_tracker_updated', handleTrackerUpdate);
    window.addEventListener('sync730_remote_jobs_updated', reloadJobs);
    window.addEventListener('sync730_admin_jobs_updated', reloadJobs);

    return () => {
      window.removeEventListener('sync730_tracker_updated', handleTrackerUpdate);
      window.removeEventListener('sync730_remote_jobs_updated', reloadJobs);
      window.removeEventListener('sync730_admin_jobs_updated', reloadJobs);
    };
  }, []);

  const reloadJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data?.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch {
      // Keep initial jobs on network fail
    }
  };

  // Helper to determine exact work mode
  const getJobWorkMode = (job: RemoteJob): 'REMOTE' | 'HYBRID' | 'ONSITE' => {
    if (job.work_mode) {
      const m = job.work_mode.toUpperCase();
      if (m === 'HYBRID') return 'HYBRID';
      if (m === 'ONSITE') return 'ONSITE';
      return 'REMOTE';
    }
    const loc = (job.candidate_required_location || job.city_location || '').toLowerCase();
    if (loc.includes('hybrid')) return 'HYBRID';
    if (loc.includes('onsite') || loc.includes('on-site')) return 'ONSITE';
    return 'REMOTE';
  };

  // Helper to determine city location display
  const getCityLocationDisplay = (job: RemoteJob): string => {
    if (job.city_location && job.city_location.trim()) {
      return job.city_location.trim();
    }
    const reqLoc = (job.candidate_required_location || '').trim();
    if (reqLoc && !['worldwide', 'remote', 'emea', 'africa'].includes(reqLoc.toLowerCase())) {
      return reqLoc;
    }
    const mode = getJobWorkMode(job);
    if (mode === 'REMOTE') {
      return job.location_tier === 'Africa Only' ? 'Remote (Africa)' : 'Remote (Worldwide)';
    }
    return reqLoc || 'Nigeria / Remote';
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Keyword search (title, skill, company, city)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = job.title?.toLowerCase().includes(q);
        const compMatch = (job.company_name || job.company || '').toLowerCase().includes(q);
        const cityMatch = (job.city_location || job.candidate_required_location || '').toLowerCase().includes(q);
        const skillsMatch = (job.skills || job.tags || []).some((s) => s.toLowerCase().includes(q));
        const descMatch = (job.description || '').toLowerCase().includes(q);

        if (!titleMatch && !compMatch && !cityMatch && !skillsMatch && !descMatch) {
          return false;
        }
      }

      // 2. Work Arrangement filter
      const mode = getJobWorkMode(job);
      if (workModeFilter === 'REMOTE' && mode !== 'REMOTE') return false;
      if (workModeFilter === 'HYBRID' && mode !== 'HYBRID') return false;
      if (workModeFilter === 'ONSITE' && mode !== 'ONSITE') return false;

      // 3. Location filter
      if (locationFilter !== 'ALL') {
        const fullLoc = `${job.city_location || ''} ${job.candidate_required_location || ''} ${job.location_tier || ''}`.toLowerCase();
        if (locationFilter === 'LAGOS' && !fullLoc.includes('lagos')) return false;
        if (locationFilter === 'ABUJA' && !fullLoc.includes('abuja')) return false;
        if (locationFilter === 'PORT_HARCOURT' && !fullLoc.includes('port harcourt') && !fullLoc.includes('rivers')) return false;
        if (locationFilter === 'REMOTE_GLOBAL') {
          const isRemoteOrGlobal = mode === 'REMOTE' || fullLoc.includes('worldwide') || fullLoc.includes('emea') || fullLoc.includes('africa');
          if (!isRemoteOrGlobal) return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, workModeFilter, locationFilter]);

  // Counts by work mode
  const counts = useMemo(() => {
    let remote = 0;
    let hybrid = 0;
    let onsite = 0;

    jobs.forEach((j) => {
      const mode = getJobWorkMode(j);
      if (mode === 'HYBRID') hybrid++;
      else if (mode === 'ONSITE') onsite++;
      else remote++;
    });

    return { all: jobs.length, remote, hybrid, onsite };
  }, [jobs]);

  // Handle CTA Click: Logged-in saves and navigates to crawler; Logged-out redirects to signup
  const handleApplyOrSave = async (job: RemoteJob, e: React.MouseEvent) => {
    e.stopPropagation();
    const jobId = job.id || job.external_id;

    if (!user) {
      // Logged-out: smooth route to signup preserving redirect and job ID
      router.push(`/register?redirect=/dashboard/crawler&jobId=${encodeURIComponent(jobId)}`);
      return;
    }

    // Logged-in candidate: auto-save to tracker and direct to tracker / crawler
    setSavingJobId(jobId);
    try {
      const res = await saveJobToTracker(job, user.id);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.add(jobId);
        return next;
      });

      if (res.isNew) {
        toast.success(`Saved "${job.title}" at ${job.company} to your Application Tracker!`);
      } else {
        toast.info(`"${job.title}" is already in your Application Tracker.`);
      }

      // Navigate to candidate crawler workspace with active target job
      router.push(`/dashboard/crawler?jobId=${encodeURIComponent(jobId)}`);
    } catch (err) {
      console.warn('Failed to save to tracker:', err);
      router.push(`/dashboard/crawler?jobId=${encodeURIComponent(jobId)}`);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setWorkModeFilter('ALL');
    setLocationFilter('ALL');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || workModeFilter !== 'ALL' || locationFilter !== 'ALL';

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#111] antialiased">
      {/* Hero Section */}
      <section className="border-b border-[#e6e6e1] bg-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>🇳🇬 NIGERIA, AFRICA &amp; GLOBAL REMOTE ROLES</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#111] leading-[1.12]">
              Find Work Built For Your Ambition
            </h1>
            <p className="text-base sm:text-lg text-[#555] leading-relaxed">
              Explore verified <span className="font-semibold text-emerald-700">Remote</span>,{' '}
              <span className="font-semibold text-amber-700">Hybrid</span>, and{' '}
              <span className="font-semibold text-indigo-700">Onsite</span> opportunities across Lagos, Abuja, Port Harcourt, and worldwide distributed teams.
            </p>
          </div>

          {/* Location highlight pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-neutral-500 font-medium">Popular hubs:</span>
            <button
              onClick={() => {
                setLocationFilter('LAGOS');
                setWorkModeFilter('ALL');
              }}
              className="px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-medium transition-colors"
            >
              📍 Lagos (Lekki / Ikeja / Island)
            </button>
            <button
              onClick={() => {
                setLocationFilter('ABUJA');
                setWorkModeFilter('ALL');
              }}
              className="px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-medium transition-colors"
            >
              🏛️ Abuja (Maitama / Central)
            </button>
            <button
              onClick={() => {
                setWorkModeFilter('REMOTE');
                setLocationFilter('ALL');
              }}
              className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 font-medium transition-colors"
            >
              🌍 100% Remote Global
            </button>
          </div>
        </div>
      </section>

      {/* Main Search & Filter Console (Fast, Clean, Low-Bandwidth) */}
      <section className="sticky top-[76px] z-30 bg-[#fafaf8]/95 backdrop-blur-md border-b border-[#e6e6e1] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-3.5">
          {/* Row 1: Keyword Search Bar & Location Dropdown */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, skills (e.g. Next.js, Figma, Python), or company..."
                className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-white border border-[#e6e6e1] rounded-xl focus:border-[#111] focus:outline-none transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 p-1"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Location Filter Dropdown */}
            <div className="sm:w-64">
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value as LocationFilter)}
                  aria-label="Filter jobs by location"
                  className="w-full h-11 pl-9 pr-8 text-xs sm:text-sm bg-white border border-[#e6e6e1] rounded-xl focus:border-[#111] focus:outline-none appearance-none cursor-pointer transition-colors shadow-xs font-medium text-neutral-800"
                >
                  <option value="ALL">All Locations</option>
                  <option value="LAGOS">Lagos, Nigeria</option>
                  <option value="ABUJA">Abuja, Nigeria</option>
                  <option value="PORT_HARCOURT">Port Harcourt, Nigeria</option>
                  <option value="REMOTE_GLOBAL">Remote (Africa / Worldwide)</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-xs">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Work Arrangement Tabs / Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                onClick={() => setWorkModeFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  workModeFilter === 'ALL'
                    ? 'bg-[#111] text-white shadow-xs'
                    : 'bg-white border border-[#e6e6e1] text-neutral-600 hover:border-neutral-400'
                }`}
              >
                All Jobs ({counts.all})
              </button>

              <button
                onClick={() => setWorkModeFilter('REMOTE')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  workModeFilter === 'REMOTE'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-[#e6e6e1] text-neutral-600 hover:border-emerald-500 hover:text-emerald-700'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${workModeFilter === 'REMOTE' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Remote ({counts.remote})</span>
              </button>

              <button
                onClick={() => setWorkModeFilter('HYBRID')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  workModeFilter === 'HYBRID'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white border border-[#e6e6e1] text-neutral-600 hover:border-amber-500 hover:text-amber-800'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${workModeFilter === 'HYBRID' ? 'bg-white' : 'bg-amber-500'}`} />
                <span>Hybrid ({counts.hybrid})</span>
              </button>

              <button
                onClick={() => setWorkModeFilter('ONSITE')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  workModeFilter === 'ONSITE'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-white border border-[#e6e6e1] text-neutral-600 hover:border-indigo-500 hover:text-indigo-800'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${workModeFilter === 'ONSITE' ? 'bg-white' : 'bg-indigo-500'}`} />
                <span>Onsite ({counts.onsite})</span>
              </button>
            </div>

            {/* Results count & Clear */}
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="font-medium">
                Showing <strong className="text-neutral-900">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'role' : 'roles'}
              </span>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Job Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#e6e6e1] rounded-2xl space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">No matching jobs found</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We couldn&apos;t find any roles matching your current search and filters. Try adjusting your keywords or clearing the location filter.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#111] text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredJobs.map((job) => {
              const jobId = job.id || job.external_id;
              const mode = getJobWorkMode(job);
              const cityLoc = getCityLocationDisplay(job);
              const isSaved = savedJobIds.has(jobId);
              const isSaving = savingJobId === jobId;
              const isFeatured = Boolean(job.is_featured);

              return (
                <div
                  key={jobId}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-neutral-400/80 group ${
                    isFeatured
                      ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/20 to-white shadow-xs'
                      : 'border-[#e6e6e1]'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Company Name, Work Mode Badge & Featured Partner */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400 stroke-[1.5]" />
                            <span>{job.company_name || job.company}</span>
                          </span>

                          {job.employer_type === 'agency' && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200"
                              title="Staffing/recruitment agency listing"
                            >
                              Agency
                            </span>
                          )}
                        </div>

                        {/* Job Title */}
                        <h2 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-rose-600 transition-colors leading-snug">
                          {job.title}
                        </h2>
                      </div>

                      {/* Featured Partner Badge */}
                      {isFeatured && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Row: Work Mode, City Location, Salary */}
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                      {/* Work Mode Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          mode === 'HYBRID'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : mode === 'ONSITE'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {mode === 'HYBRID' ? 'Hybrid' : mode === 'ONSITE' ? 'Onsite' : 'Remote'}
                      </span>

                      {/* City Location */}
                      <span className="inline-flex items-center gap-1 text-neutral-600 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{cityLoc}</span>
                      </span>

                      {/* Salary Display */}
                      <span className="inline-flex items-center gap-1 font-semibold text-neutral-800 text-xs bg-neutral-100/80 px-2 py-0.5 rounded-md">
                        {job.salary ? (
                          <SalaryDisplay job={job} className="text-neutral-800 font-semibold" />
                        ) : (
                          <span className="text-neutral-600 font-medium">Competitive</span>
                        )}
                      </span>
                    </div>

                    {/* Description Excerpt */}
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {job.description || `Exciting technical role at ${job.company_name || job.company}.`}
                    </p>

                    {/* Skills Pills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/60"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 text-neutral-400">
                            +{job.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Action Button */}
                  <div className="pt-4 mt-4 border-t border-[#f0f0ed] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {job.source_type === 'ADMIN_CURATED' ? 'Verified Partner' : 'Platform Verified'}
                    </span>

                    <button
                      onClick={(e) => handleApplyOrSave(job, e)}
                      disabled={isSaving}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                          : 'bg-[#111] hover:bg-neutral-800 text-white shadow-xs'
                      }`}
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span>Saved · Open in App</span>
                        </>
                      ) : user ? (
                        <>
                          <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
                          <span>Apply &amp; Save to Tracker</span>
                        </>
                      ) : (
                        <>
                          <span>Apply / Save to Tracker</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informational Guidance Section at Bottom */}
        <section className="mt-16 pt-12 border-t border-[#e6e6e1] grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-600">
          <div className="space-y-1.5 bg-white p-5 rounded-2xl border border-[#e6e6e1]">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2]" />
              <span>Strictly Verified Contracts</span>
            </div>
            <p className="leading-relaxed">
              Every position displayed on Sync730 is checked for verifiable company registration, prompt monthly payroll, and legitimate engineering contracts.
            </p>
          </div>

          <div className="space-y-1.5 bg-white p-5 rounded-2xl border border-[#e6e6e1]">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
              <Briefcase className="w-4 h-4 text-amber-600 stroke-[2]" />
              <span>Remote, Hybrid &amp; Onsite</span>
            </div>
            <p className="leading-relaxed">
              Whether you prefer 100% remote asynchronous flexibility or physical innovation hubs in Lekki, Lagos and Maitama, Abuja, roles are explicitly labeled with work mode and location.
            </p>
          </div>

          <div className="space-y-1.5 bg-white p-5 rounded-2xl border border-[#e6e6e1]">
            <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 stroke-[2]" />
              <span>One-Click Kanban Tracker</span>
            </div>
            <p className="leading-relaxed">
              Save any position into your private Kanban application tracker with status stages (Saved, Applied, Interviewing, Offered) and tailored CV hints.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
