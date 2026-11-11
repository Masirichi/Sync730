'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { RemoteJob } from '@/lib/supabase/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { saveJobToTracker, getLocalTrackerItems } from '@/lib/tracker';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  JOB_CATEGORIES,
  JOB_CATEGORIES_META,
  normalizeJobCategory,
} from '@/lib/crawler/categories';
import { toast } from 'sonner';

// Pre-normalize seed jobs for instant zero-latency first render
const HYDRATED_INITIAL_JOBS: RemoteJob[] = SEED_REMOTE_JOBS.map((j, idx) => ({
  ...j,
  id: `seed-job-${idx + 1}`,
  category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
})) as RemoteJob[];

export default function CrawlerJobFeedPage() {
  const [jobs, setJobs] = useState<RemoteJob[]>(HYDRATED_INITIAL_JOBS);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Load jobs and current tracker state on mount
  useEffect(() => {
    async function loadData() {
      // Load saved tracker items to reflect "Saved" state
      const trackerItems = getLocalTrackerItems();
      const savedIds = new Set(
        trackerItems.map((i) => i.job_id).filter((id): id is string => Boolean(id))
      );
      setSavedJobIds(savedIds);

      // Try fetching from Supabase remote_jobs table with timeout
      try {
        const supabase = createBrowserClient();
        const fetchPromise = supabase
          .from('remote_jobs')
          .select('*')
          .order('published_at', { ascending: false });

        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2500)
        );

        const res: any = await Promise.race([fetchPromise, timeoutPromise]);
        if (res && !res.error && res.data && res.data.length > 0) {
          const normalized = res.data.map((j: any) => ({
            ...j,
            category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
          }));
          setJobs(normalized as RemoteJob[]);
        }
      } catch (err) {
        // Keeps initial hydrated seed jobs
      }
    }

    loadData();

    // Listen for tracker updates across tabs / components
    const handleTrackerUpdate = () => {
      const trackerItems = getLocalTrackerItems();
      const savedIds = new Set(
        trackerItems.map((i) => i.job_id).filter((id): id is string => Boolean(id))
      );
      setSavedJobIds(savedIds);
    };

    window.addEventListener('sync730_tracker_updated', handleTrackerUpdate);
    return () => window.removeEventListener('sync730_tracker_updated', handleTrackerUpdate);
  }, []);

  // Compute live counts per category for the tab bar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: jobs.length };
    JOB_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });

    jobs.forEach((j) => {
      const cat = normalizeJobCategory(j.category || '', j.title, j.description || '');
      if (counts[cat] !== undefined) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [jobs]);

  // Manual Trigger: Sync Jobs
  const handleSyncJobs = async () => {
    setSyncing(true);
    const catQuery = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    const catLabel = selectedCategory !== 'All' ? selectedCategory : 'all categories';

    toast.info(`Fetching live openings for ${catLabel}...`);

    try {
      const res = await fetch(`/api/cron/crawl-jobs${catQuery}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.sample_jobs) {
        setJobs((prev) => {
          const combined = [...data.sample_jobs, ...prev];
          const map = new Map<string, RemoteJob>();
          combined.forEach((j) => {
            const key = j.external_id || j.id || j.direct_apply_url;
            if (!map.has(key)) {
              map.set(key, {
                ...j,
                url: j.direct_apply_url || j.url,
                category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
              });
            }
          });
          return Array.from(map.values());
        });

        toast.success(
          `Sync Complete: ${data.total_processed} verified openings updated with direct links.`
        );
      } else {
        toast.success('Sync complete: listings are up to date.');
      }
    } catch {
      toast.error('External API timeout; serving latest verified catalog.');
    } finally {
      setSyncing(false);
    }
  };

  // One-click Save to Tracker
  const handleSaveToTracker = async (job: RemoteJob) => {
    const res = await saveJobToTracker(job);
    const identifier = job.id || job.external_id;

    setSavedJobIds((prev) => new Set([...Array.from(prev), identifier, job.external_id]));

    if (res.isNew) {
      toast.success(
        <div className="flex items-center justify-between w-full gap-2">
          <span>Saved to your application tracker.</span>
          <Link
            href="/dashboard/tracker"
            className="text-xs font-semibold underline text-neutral-900 dark:text-neutral-100 shrink-0"
          >
            View Tracker →
          </Link>
        </div>
      );
    } else {
      toast.info('Job is already in your application tracker.');
    }
  };

  // Helper for category metadata
  const getCategoryMeta = (catStr: string) => {
    const canonical = normalizeJobCategory(catStr);
    return JOB_CATEGORIES_META[canonical] || JOB_CATEGORIES_META['Software & Engineering'];
  };

  // Filter jobs by Category, Location Tier, and Search query
  const filteredJobs = jobs.filter((job) => {
    const canonicalJobCat = normalizeJobCategory(job.category || '', job.title, job.description || '');

    const matchesCategory =
      selectedCategory === 'All' ? true : canonicalJobCat === selectedCategory;

    const matchesTier =
      selectedTier === 'All'
        ? true
        : selectedTier === 'Worldwide'
        ? job.location_tier === 'Worldwide'
        : selectedTier === 'EMEA'
        ? job.location_tier === 'EMEA'
        : selectedTier === 'Africa Only'
        ? job.location_tier === 'Africa Only'
        : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.candidate_required_location.toLowerCase().includes(query) ||
      canonicalJobCat.toLowerCase().includes(query) ||
      (job.tags && job.tags.some((t) => t.toLowerCase().includes(query)));

    return matchesCategory && matchesTier && matchesQuery;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Callout: Vet-Once Profile (Scale Army human-crafted aesthetic) */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Pre-Vet Once. Apply Directly to Remote Teams.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Complete a single assessment cycle to unlock direct routing to hiring managers across Engineering, Product, Data, DevOps, and Operations.
            </p>
          </div>
          <Link href="/candidate">
            <Button
              size="sm"
              className="gap-2 shrink-0 text-xs font-semibold h-9 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Verify Profile <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Remote Opportunities
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Open positions with direct application endpoints for Worldwide, EMEA, and African talent.
          </p>
        </div>

        {/* Sync Jobs Now Button & Tracker Link */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/tracker">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3.5 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium text-neutral-700 dark:text-neutral-300"
            >
              Tracker ({savedJobIds.size})
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleSyncJobs}
            disabled={syncing}
            className="gap-2 text-xs font-semibold h-9 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Live Jobs'}
          </Button>
        </div>
      </div>

      {/* Scale Army Category Pill Tabs with Live Role Counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Filter by Department
          </span>
          <span>
            {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'} available
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium ${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            All Roles ({categoryCounts['All'] || jobs.length})
          </button>

          {JOB_CATEGORIES.map((cat) => {
            const meta = JOB_CATEGORIES_META[cat];
            const active = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Location Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search role, company, or stack (e.g. Next.js, Go, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm h-10 border-neutral-200 dark:border-neutral-800 rounded-lg"
          />
        </div>

        {/* Location Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Worldwide', 'EMEA', 'Africa Only'] as const).map((tier) => {
            const active = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {tier === 'All' ? 'All Locations' : tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale Army Job Listings Feed */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-6 border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mb-3 animate-pulse" />
              <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4 mb-4 animate-pulse" />
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded w-full mb-4 animate-pulse" />
              <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
            No matching openings found
          </h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria, location filter, or category tab, or click &ldquo;Sync Live Jobs&rdquo; to fetch updated postings.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedTier('All');
              setSelectedCategory('All');
            }}
            className="mt-4 text-xs rounded-lg border-neutral-200 dark:border-neutral-800"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => {
            const isSaved =
              savedJobIds.has(job.id) ||
              savedJobIds.has(job.external_id) ||
              savedJobIds.has(`remotive-${job.id}`);
            const categoryMeta = getCategoryMeta(job.category || '');

            return (
              <Card
                key={job.id || job.external_id || job.url}
                className="group flex flex-col justify-between border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-none"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Bar: Company Name & Location / Category Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {job.company}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900">
                        {job.location_tier}
                      </span>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {categoryMeta.shortLabel}
                      </span>
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-snug">
                      {job.title}
                    </h2>

                    {/* Metadata Line (Clean middot separator, zero cartoon icons) */}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span>{job.candidate_required_location || 'Remote'}</span>
                      <span className="mx-1.5">·</span>
                      <span>{job.job_type || 'Full-time'}</span>
                      {job.salary && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span className="text-neutral-900 dark:text-neutral-200 font-semibold">
                            {job.salary}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Role Description Preview */}
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  {/* Skills / Tech Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-normal px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer: Status Label & Scale Army Action Buttons */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      Direct verified application
                    </span>

                    <div className="flex items-center gap-2">
                      {/* One-click Save to Tracker */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveToTracker(job)}
                        className={`text-xs h-9 px-3.5 rounded-lg font-medium transition-colors ${
                          isSaved
                            ? 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-neutral-100/60 dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        {isSaved ? '✓ Saved' : 'Save to Tracker'}
                      </Button>

                      {/* Scale Army High-Contrast Direct Apply Button */}
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="sm"
                            className="text-xs h-9 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold"
                          >
                            Apply Directly ↗
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
