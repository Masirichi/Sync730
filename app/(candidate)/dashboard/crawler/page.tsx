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
  Code2,
  Palette,
  BrainCircuit,
  Cloud,
  TrendingUp,
  Headphones,
  Landmark,
  Layers,
} from 'lucide-react';
import { RemoteJob, LocationTier } from '@/lib/supabase/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { saveJobToTracker, getLocalTrackerItems } from '@/lib/tracker';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  JobCategory,
  JOB_CATEGORIES,
  JOB_CATEGORIES_META,
  normalizeJobCategory,
} from '@/lib/crawler/categories';
import { toast } from 'sonner';

// Helper for category icons
function getCategoryIcon(cat: JobCategory) {
  switch (cat) {
    case 'Software & Engineering':
      return <Code2 className="h-3.5 w-3.5" />;
    case 'Product & Design':
      return <Palette className="h-3.5 w-3.5" />;
    case 'Data & AI':
      return <BrainCircuit className="h-3.5 w-3.5" />;
    case 'DevOps & Cloud':
      return <Cloud className="h-3.5 w-3.5" />;
    case 'Sales & Marketing':
      return <TrendingUp className="h-3.5 w-3.5" />;
    case 'Customer Support & Ops':
      return <Headphones className="h-3.5 w-3.5" />;
    case 'Finance & Accounting':
      return <Landmark className="h-3.5 w-3.5" />;
    default:
      return <Layers className="h-3.5 w-3.5" />;
  }
}

export default function CrawlerJobFeedPage() {
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [loading, setLoading] = useState(true);
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

      // Try fetching from Supabase remote_jobs table
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('remote_jobs')
          .select('*')
          .order('published_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const normalized = data.map((j: any) => ({
            ...j,
            category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
          }));
          setJobs(normalized as RemoteJob[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch notice, loading comprehensive seed data:', err);
      }

      // Fallback: hydrated multi-source seed jobs with direct URLs & normalized categories
      const hydratedSeed = SEED_REMOTE_JOBS.map((j, idx) => ({
        ...j,
        id: `seed-job-${idx + 1}`,
        category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
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

  // Manual Trigger: Sync Jobs
  const handleSyncJobs = async () => {
    setSyncing(true);
    const catQuery = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    const catLabel = selectedCategory !== 'All' ? selectedCategory : 'all categories';

    toast.info(`Fetching live remote openings for ${catLabel}...`);

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
          `Sync Complete: ${data.total_processed} verified openings updated with direct apply links!`
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

  // Helper for category metadata & badge
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
                  Complete Your &ldquo;Vet-Once&rdquo; FastTrack
                </h3>
                <Badge variant="secondary" className="text-[11px] font-medium text-primary bg-primary/15">
                  ⭐ Direct Candidate FastTrack
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Get pre-vetted once to unlock fast-tracked direct applications across Software Engineering, Product & Design, Data & AI, DevOps, Sales, and Ops roles.
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
            <h1 className="text-2xl font-bold tracking-tight">Verified Remote Opportunities</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Globe className="h-3 w-3" /> Live Direct Openings
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse actual remote openings with direct application links filtered strictly for Worldwide, EMEA, and African talent.
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
            {syncing ? 'Syncing...' : 'Sync Live Jobs'}
          </Button>
        </div>
      </div>

      {/* Category Filters Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Job Category
          </span>
          <span className="text-xs text-muted-foreground">
            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
          <Button
            size="sm"
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('All')}
            className={`text-xs h-8 px-3 rounded-full transition-colors ${
              selectedCategory === 'All' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Categories
          </Button>

          {JOB_CATEGORIES.map((cat) => {
            const meta = JOB_CATEGORIES_META[cat];
            const active = selectedCategory === cat;
            return (
              <Button
                key={cat}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs h-8 px-3 rounded-full transition-colors whitespace-nowrap gap-1.5 ${
                  active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {getCategoryIcon(cat)}
                {meta.label}
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
            placeholder="Search role, company, or stack (e.g. Next.js, Golang, Figma)..."
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
            Try adjusting your search query, location filter, or category selector, or click &ldquo;Sync Live Jobs&rdquo; to pull the latest open positions.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedTier('All');
              setSelectedCategory('All');
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
            const categoryMeta = getCategoryMeta(job.category || '');

            return (
              <Card
                key={job.id || job.external_id || job.url}
                className="group flex flex-col justify-between border-border/70 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Company, Tier, Category Badge */}
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

                    {/* Category Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold shrink-0 py-0.5 px-2 gap-1 ${categoryMeta.badgeClass}`}
                    >
                      {getCategoryIcon(categoryMeta.id)}
                      {categoryMeta.shortLabel}
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
                      <span>Direct Verified Opening</span>
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

                      {/* Direct Apply Button */}
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="text-xs h-8 gap-1 font-medium hover:border-primary">
                            Apply Directly <ExternalLink className="h-3 w-3 text-primary" />
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
