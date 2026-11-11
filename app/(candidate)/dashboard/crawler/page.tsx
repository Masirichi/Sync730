'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
  Sparkles,
  Search,
  BookmarkPlus,
  Check,
  RefreshCw,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  Building2,
  Filter,
} from 'lucide-react';
import { RemoteJob, LocationTier, JobSource } from '@/lib/supabase/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { saveJobToTracker, getLocalTrackerItems } from '@/lib/tracker';
import { createBrowserClient } from '@/lib/supabase/client';
import { JOB_SOURCES_META, SourceMetadata } from '@/lib/crawler/sources';
import { toast } from 'sonner';

export default function CrawlerJobFeedPage() {
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
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

      // Try fetching from Supabase remote_jobs table
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('remote_jobs')
          .select('*')
          .order('published_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setJobs(data as RemoteJob[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch notice, loading comprehensive seed data:', err);
      }

      // Fallback: hydrated multi-source seed jobs
      const hydratedSeed = SEED_REMOTE_JOBS.map((j, idx) => ({
        ...j,
        id: `seed-job-${idx + 1}`,
      })) as RemoteJob[];

      setJobs(hydratedSeed);
      setLoading(false);
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

  // Manual Trigger: Sync Jobs across 7 verified sources
  const handleSyncJobs = async () => {
    setSyncing(true);
    const targetSourceQuery = selectedSource !== 'All' ? `?source=${selectedSource}` : '';
    const sourceLabel =
      selectedSource !== 'All'
        ? JOB_SOURCES_META[selectedSource as JobSource]?.label || selectedSource
        : 'all 7 verified portals';

    toast.info(`Crawling remote jobs from ${sourceLabel}...`);

    try {
      const res = await fetch(`/api/cron/crawl-jobs${targetSourceQuery}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.sample_jobs) {
        setJobs((prev) => {
          const combined = [...data.sample_jobs, ...prev];
          const map = new Map<string, RemoteJob>();
          combined.forEach((j) => {
            const key = j.external_id || j.id;
            if (!map.has(key)) map.set(key, j);
          });
          return Array.from(map.values());
        });

        toast.success(
          `Sync Complete: ${data.total_processed} remote jobs verified from Scale Army, Bruntwork, Jobberman, Freehire, Direct ATS & Remotive!`
        );
      } else {
        toast.success('Sync complete: listings are up to date.');
      }
    } catch {
      toast.error('External API timeout; active fallback feed is serving listings.');
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
          <span>Saved to your Kanban Tracker!</span>
          <Link
            href="/dashboard/tracker"
            className="text-xs font-semibold underline text-primary shrink-0"
          >
            View Tracker →
          </Link>
        </div>
      );
    } else {
      toast.info('Job is already in your application tracker.');
    }
  };

  // Helper for source metadata & badge
  const getSourceMeta = (sourceKey: string): SourceMetadata => {
    return (
      JOB_SOURCES_META[sourceKey as JobSource] || {
        id: sourceKey as JobSource,
        label: sourceKey,
        shortLabel: sourceKey,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        description: 'Verified remote opportunity',
        website: '#',
      }
    );
  };

  // Filter jobs by Location Tier, Source, and Search query
  const filteredJobs = jobs.filter((job) => {
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

    const matchesSource = selectedSource === 'All' ? true : job.source === selectedSource;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.candidate_required_location.toLowerCase().includes(query) ||
      (job.tags && job.tags.some((t) => t.toLowerCase().includes(query)));

    return matchesTier && matchesSource && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Vet-Once Profile Callout */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground">
                  Complete Your &ldquo;Vet-Once&rdquo; Profile
                </h3>
                <Badge variant="secondary" className="text-[11px] font-medium text-primary bg-primary/15">
                  ⭐ Skip Resume Screens
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Get pre-vetted once on Sync730 to unlock 1-click verified applications to all Worldwide, EMEA, and African remote roles across Scale Army, Bruntwork, Jobberman, Freehire, and direct company career pages.
              </p>
            </div>
          </div>
          <Link href="/candidate">
            <Button size="sm" className="gap-1.5 shrink-0 text-xs font-medium">
              Verify Profile <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Header & Sync Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Verified Multi-Source Remote Feed</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Globe className="h-3 w-3" /> 7 Portals Live
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Crawling Scale Army, Bruntwork, Jobberman, Freehire, Direct Enterprise ATS, Remotive, and Arbeitnow strictly for Worldwide, EMEA, and African talent.
          </p>
        </div>

        {/* Sync Jobs Now Button & Tracker Link */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tracker">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Open Kanban Tracker ({savedJobIds.size})
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleSyncJobs}
            disabled={syncing}
            className="gap-2 text-xs font-semibold shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Crawling Portals...' : 'Sync Jobs Now'}
          </Button>
        </div>
      </div>

      {/* Source Filters Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Career Source / Portal
          </span>
          <span className="text-xs text-muted-foreground">
            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={selectedSource === 'All' ? 'default' : 'outline'}
            onClick={() => setSelectedSource('All')}
            className={`text-xs h-7 px-3 rounded-full transition-colors ${
              selectedSource === 'All' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Sources
          </Button>

          {(Object.keys(JOB_SOURCES_META) as JobSource[]).map((srcKey) => {
            const meta = JOB_SOURCES_META[srcKey];
            const active = selectedSource === srcKey;
            return (
              <Button
                key={srcKey}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setSelectedSource(srcKey)}
                className={`text-xs h-7 px-3 rounded-full transition-colors whitespace-nowrap ${
                  active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {meta.shortLabel}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Search & Location Filter Pills */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search role, company, or stack (e.g. Golang, React, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Location Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Worldwide', 'EMEA', 'Africa Only'] as const).map((tier) => {
            const active = selectedTier === tier;
            return (
              <Button
                key={tier}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setSelectedTier(tier)}
                className={`text-xs h-8 px-3 rounded-full transition-colors ${
                  active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tier === 'All' ? 'All Locations' : tier}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Job Cards Feed */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="animate-pulse p-6">
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="h-16 bg-muted rounded w-full mb-3" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No matching remote jobs found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Try adjusting your search query, location filter, or portal selector, or click &ldquo;Sync Jobs Now&rdquo; to pull the latest crawl updates.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedTier('All');
              setSelectedSource('All');
            }}
            className="mt-4 text-xs"
          >
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => {
            const isSaved =
              savedJobIds.has(job.id) ||
              savedJobIds.has(job.external_id) ||
              savedJobIds.has(`remotive-${job.id}`);
            const sourceMeta = getSourceMeta(job.source as string);

            return (
              <Card
                key={job.id || job.external_id}
                className="group flex flex-col justify-between border-border/70 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Company, Tier, Source Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {job.company}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold py-0 px-2 ${
                            job.location_tier === 'Africa Only'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : job.location_tier === 'EMEA'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          <MapPin className="h-2.5 w-2.5 mr-0.5 inline" />
                          {job.location_tier}
                        </Badge>
                      </div>

                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {job.title}
                      </h2>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold shrink-0 py-0.5 px-2 ${sourceMeta.badgeClass}`}
                    >
                      {sourceMeta.shortLabel}
                    </Badge>
                  </div>

                  {/* Metadata: Location, Salary, Job Type */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {job.candidate_required_location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                      {job.job_type}
                    </span>
                  </div>

                  {/* Description Preview */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  {/* Skills / Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[11px] py-0 px-2 font-normal bg-muted/30"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Card Footer: Vet-Once Badge & Action Buttons */}
                  <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Vet-Once FastTrack</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* One-click Save to Tracker */}
                      <Button
                        size="sm"
                        variant={isSaved ? 'secondary' : 'default'}
                        onClick={() => handleSaveToTracker(job)}
                        className={`text-xs h-8 gap-1.5 transition-all ${
                          isSaved ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : ''
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Saved to Tracker
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-3.5 w-3.5" />
                            Save to Tracker
                          </>
                        )}
                      </Button>

                      {/* External Apply Link */}
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                            Apply <ExternalLink className="h-3 w-3" />
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
