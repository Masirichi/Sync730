'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Video,
  Coins,
  Clock,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { AdminMetrics } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { toast } from 'sonner';

export default function CommandMetricsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Crawler telemetry state
  const [lastCrawledAt, setLastCrawledAt] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sync730_crawler_last_run') || '';
    }
    return '';
  });
  const [lastCrawledCount, setLastCrawledCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sync730_crawler_last_count');
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.warn('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteCrawler = async () => {
    setIsCrawling(true);
    toast.info('Starting remote job crawler across verified sources...');

    try {
      const res = await fetch('/api/cron/crawl-jobs', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        const count = data.upserted_count || data.total_processed || 0;
        const now = new Date().toISOString();
        setLastCrawledAt(now);
        setLastCrawledCount(count);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sync730_crawler_last_run', now);
          localStorage.setItem('sync730_crawler_last_count', count.toString());
        }
        toast.success(`Crawler finished: ${count} roles fetched with status "Needs review". None are publicly visible.`);
        setIsConfirmOpen(false);
        fetchMetrics();
      } else {
        throw new Error(data.error || 'Failed to crawl jobs');
      }
    } catch (err: any) {
      toast.error(err.message || 'Crawler execution failed.');
    } finally {
      setIsCrawling(false);
    }
  };

  const grossRevFormatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(metrics?.gross_revenue_ngn || 0);

  const lastRunInfo = lastCrawledAt
    ? formatLagosDateTime(lastCrawledAt)
    : { formatted: 'Not recorded yet', relative: 'never' };

  return (
    <div className="space-y-6">
      {/* Top Banner / Operations Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
              Operations Center
            </span>
            <Badge
              variant="outline"
              className="text-xs font-semibold border-neutral-700 text-neutral-300 bg-neutral-800 gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Live sync</span>
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Platform overview
          </h1>
          <p className="text-sm text-neutral-400">
            Real-time telemetry, verification pipelines, token liquidity, and automated scrapers.
          </p>
        </div>

        {/* Crawler Action: Secondary Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl border-neutral-800 bg-neutral-900 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsConfirmOpen(true)}
            disabled={isCrawling}
            variant="outline"
            className="h-10 px-4 rounded-xl border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs transition-all"
          >
            {isCrawling ? 'Running crawler...' : 'Trigger Remote Job Crawler'}
          </Button>
        </div>
      </div>

      {/* 5 Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Registered Candidates */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Total candidates
            </span>
            <div className="h-8 w-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics?.total_candidates ?? 142}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Registered job seekers
            </div>
          </div>
        </Card>

        {/* KPI 2: Active Corporate Workspaces */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Corporate workspaces
            </span>
            <div className="h-8 w-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics?.active_workspaces ?? 3}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Active employers
            </div>
          </div>
        </Card>

        {/* KPI 3: Completed Video Assessments */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Video assessments
            </span>
            <div className="h-8 w-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
              <Video className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics?.completed_assessments ?? 3}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              First-round interviews
            </div>
          </div>
        </Card>

        {/* KPI 4: Total Tokens Unlocked */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Tokens unlocked
            </span>
            <div className="h-8 w-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
              <Coins className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics?.tokens_unlocked ?? 1}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Profiles unlocked
            </div>
          </div>
        </Card>

        {/* KPI 5: Gross Platform Revenue (₦) */}
        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Gross revenue (₦)
            </span>
            <div className="h-8 w-8 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
              <Coins className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-white tracking-tight truncate">
              {grossRevFormatted}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              B2B tokens & tools
            </div>
          </div>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Col 7): Operations Modules */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-neutral-300 stroke-[1.5]" aria-hidden="true" />
                <span>Command operations modules</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tile 1: Finance */}
              <Link
                href="/command/finance"
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                    Token liquidity & finance
                  </span>
                  <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Manage corporate workspace balances, execute token adjustments, and inspect transactions.
                </p>
              </Link>

              {/* Tile 2: Video Anti-Cheat */}
              <Link
                href="/command/vetting"
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                    Video vetting & integrity
                  </span>
                  <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Inspect candidate video recordings and proctoring telemetry for human review.
                </p>
              </Link>

              {/* Tile 3: User Roles */}
              <Link
                href="/command/users"
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                    User directory & roles
                  </span>
                  <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Search registered users, grant platform admin access, and manage permissions.
                </p>
              </Link>

              {/* Tile 4: Job Board */}
              <Link
                href="/command/jobs"
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                    Job curation & moderation
                  </span>
                  <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Review crawled roles, approve verified openings, and pin qualifying featured jobs.
                </p>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column (Col 5): Activity Feed */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-300 stroke-[1.5]" />
                <span>Recent operations activity</span>
              </h2>
            </div>

            <div className="divide-y divide-neutral-800">
              {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                metrics.recent_activity.map((item) => (
                  <div key={item.id} className="py-3 space-y-1">
                    <p className="text-xs font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {item.description}
                    </p>
                    <span className="text-[11px] text-neutral-500 font-mono block">
                      {formatLagosDateTime(item.timestamp).formatted}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No recent activity recorded yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Remote Job Crawler */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Trigger Remote Job Crawler?"
        description="Scrapes verified remote openings across Remotive, Jobicy, RemoteOK, and Himalayas. Newly fetched roles enter as 'Needs review' and are NOT publicly visible until verified by an administrator."
        actionLabel="Trigger crawler"
        requireReason={false}
        isLoading={isCrawling}
        onConfirm={handleExecuteCrawler}
      >
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Sources fetched:</span>
            <span className="font-semibold text-white">Remotive, Jobicy, RemoteOK, Himalayas</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Last crawl execution:</span>
            <span className="font-mono text-neutral-300">
              {lastRunInfo.formatted} ({lastRunInfo.relative})
            </span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span>Jobs fetched in last run:</span>
            <span className="font-mono text-neutral-300">
              {lastCrawledCount > 0 ? `${lastCrawledCount} jobs` : 'None recorded'}
            </span>
          </div>
          <div className="flex items-center justify-between text-neutral-400 pt-1 border-t border-neutral-900">
            <span>Initial review status:</span>
            <span className="font-semibold text-amber-400">Needs review (Not public)</span>
          </div>
        </div>
      </ConfirmationDialog>
    </div>
  );
}
