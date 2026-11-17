'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Clock,
  Check,
  Building2,
  Video,
  Briefcase,
  Flag,
  Users,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminMetricsData } from '@/lib/admin/types';
import { formatLagosDateTime } from '@/lib/admin/date';
import { useAdminHeader } from '@/components/admin/admin-header-context';

export default function CommandOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { includeDemo, lastUpdated, triggerRefresh, isRefreshing } = useAdminHeader();

  // Set document title
  useEffect(() => {
    document.title = 'Overview | Command Center';
  }, []);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/metrics?include_demo=${includeDemo ? 'true' : 'false'}`);
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.warn('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, lastUpdated]);

  // Listen to header refresh events
  useEffect(() => {
    const handleHeaderRefresh = () => fetchMetrics();
    window.addEventListener('sync730_admin_refresh_metrics', handleHeaderRefresh);
    return () => window.removeEventListener('sync730_admin_refresh_metrics', handleHeaderRefresh);
  }, [fetchMetrics]);

  const updatedTimeLabel = metrics?.metadata.updated_at
    ? formatLagosDateTime(metrics.metadata.updated_at).relative
    : 'just now';

  // Attention counts
  const rolesToVerify = metrics?.attention?.roles_to_verify ?? metrics?.roles?.needs_review ?? 0;
  const openReports = metrics?.attention?.open_reports ?? metrics?.reports?.open ?? 0;
  const flaggedVideos = metrics?.attention?.flagged_videos ?? metrics?.flagged_videos?.total ?? 0;
  const rolesGoingStale = metrics?.attention?.roles_going_stale ?? 0;

  // Pipeline counts
  const pipelineNeedsReview = metrics?.role_pipeline?.needs_review ?? rolesToVerify;
  const pipelineVerified = metrics?.role_pipeline?.verified ?? (metrics?.roles?.live ?? 0);
  const pipelineLive = metrics?.role_pipeline?.live ?? (metrics?.roles?.live ?? 0);
  const pipelineGoingStale = metrics?.role_pipeline?.going_stale ?? rolesGoingStale;
  const pipelineRemoved30d = metrics?.role_pipeline?.removed_last_30_days ?? 0;

  // Recent activity items (up to 10 audit entries)
  const recentActivity = metrics?.recent_activity ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description, Updated time & single refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Overview
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            System health, verification telemetry, and platform operations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-neutral-400 tabular-nums">
            Updated {updatedTimeLabel}
          </span>
          <Button
            onClick={triggerRefresh}
            disabled={isRefreshing || isLoading}
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-medium text-xs transition-all flex items-center gap-1.5"
          >
            {isRefreshing || isLoading ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
            ) : (
              <Clock className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: "Needs your attention"
          Four count cards, each a link to its filtered queue; zero shows "All clear" in text
         ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-white uppercase tracking-wider text-xs text-neutral-400">
          Needs your attention
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Roles to verify */}
          <Link
            href="/command/roles?status=needs_review"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-all block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                Roles to verify
              </span>
              <div className="h-7 w-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                <Briefcase className="h-3.5 w-3.5 stroke-[1.5]" />
              </div>
            </div>
            <div className="mt-4">
              {rolesToVerify === 0 ? (
                <div className="text-lg font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 stroke-[2]" />
                  <span>All clear</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                  {rolesToVerify}
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                Needs review queue
              </div>
            </div>
          </Link>

          {/* Card 2: Open reports */}
          <Link
            href="/command/reports"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-all block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                Open reports
              </span>
              <div className="h-7 w-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                <Flag className="h-3.5 w-3.5 stroke-[1.5]" />
              </div>
            </div>
            <div className="mt-4">
              {openReports === 0 ? (
                <div className="text-lg font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 stroke-[2]" />
                  <span>All clear</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                  {openReports}
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                Community flags
              </div>
            </div>
          </Link>

          {/* Card 3: Flagged videos */}
          <Link
            href="/command/video-review?tab=flagged"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-all block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                Flagged videos
              </span>
              <div className="h-7 w-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                <Video className="h-3.5 w-3.5 stroke-[1.5]" />
              </div>
            </div>
            <div className="mt-4">
              {flaggedVideos === 0 ? (
                <div className="text-lg font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 stroke-[2]" />
                  <span>All clear</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                  {flaggedVideos}
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                Proctoring review queue
              </div>
            </div>
          </Link>

          {/* Card 4: Roles going stale */}
          <Link
            href="/command/roles?filter=going_stale"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-all block group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                Roles going stale
              </span>
              <div className="h-7 w-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
              </div>
            </div>
            <div className="mt-4">
              {rolesGoingStale === 0 ? (
                <div className="text-lg font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-4 w-4 stroke-[2]" />
                  <span>All clear</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                  {rolesGoingStale}
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                3 days or fewer to 14-day limit
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: "Role pipeline"
          A horizontal strip of counts: Needs review, Verified, Live, Going stale, Removed (last 30 days). Numbers only, no charts.
         ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Role pipeline
        </h2>

        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
            {/* Slot 1: Needs review */}
            <div className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-neutral-400 block">
                Needs review
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums mt-2">
                {pipelineNeedsReview}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Pending human check
              </div>
            </div>

            {/* Slot 2: Verified */}
            <div className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-neutral-400 block">
                Verified
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums mt-2">
                {pipelineVerified}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Human confirmed live
              </div>
            </div>

            {/* Slot 3: Live */}
            <div className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-neutral-400 block">
                Live
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums mt-2">
                {pipelineLive}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Public Find Work catalog
              </div>
            </div>

            {/* Slot 4: Going stale */}
            <div className="p-4 sm:p-5">
              <span className="text-xs font-semibold text-neutral-400 block">
                Going stale
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums mt-2">
                {pipelineGoingStale}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                ≤ 3 days left
              </div>
            </div>

            {/* Slot 5: Removed (last 30 days) */}
            <div className="p-4 sm:p-5 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-neutral-400 block">
                Removed (30d)
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums mt-2">
                {pipelineRemoved30d}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Deactivated / expired
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* =========================================================================
          SECTION 3: "Health against our mission"
          Neutral colours, three columns.
          Sample >= 20 required to show values; otherwise "Not enough data yet".
          Untracked metrics show "Not tracked yet".
         ========================================================================= */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Health against our mission
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: FASTER */}
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 shadow-sm">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                FASTER
              </h3>
            </div>

            <div className="space-y-4">
              {/* Metric 1: Median time from application to shortlist */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Median time from application to shortlist
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  Not tracked yet
                </div>
                <div className="text-[11px] text-neutral-500">
                  Employer shortlist timestamps not recorded
                </div>
              </div>

              {/* Metric 2: Median age of a role when verified */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Median age of a role when verified
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  {metrics?.mission_health?.faster?.median_role_age_when_verified?.status === 'available'
                    ? metrics.mission_health.faster.median_role_age_when_verified.value
                    : 'Not enough data yet'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {metrics?.mission_health?.faster?.median_role_age_when_verified?.sample_size !== undefined
                    ? `Sample: ${metrics.mission_health.faster.median_role_age_when_verified.sample_size} (minimum 20)`
                    : 'Requires 20+ verified role records'}
                </div>
              </div>
            </div>
          </Card>

          {/* Column 2: FAIRER */}
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 shadow-sm">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                FAIRER
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Metric 1: Retake rate */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Retake rate
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  Not tracked yet
                </div>
                <div className="text-[11px] text-neutral-500">
                  Single assessment attempt enforced
                </div>
              </div>

              {/* Metric 2: Appeal overturn rate */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Appeal overturn rate
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  Not tracked yet
                </div>
                <div className="text-[11px] text-neutral-500">
                  Appeals handled via email review protocol
                </div>
              </div>

              {/* Metric 3: Flagged-video rate */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Flagged-video rate
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  {metrics?.mission_health?.fairer?.flagged_video_rate?.status === 'available'
                    ? metrics.mission_health.fairer.flagged_video_rate.value
                    : 'Not enough data yet'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {metrics?.mission_health?.fairer?.flagged_video_rate?.sample_size !== undefined
                    ? `Sample: ${metrics.mission_health.fairer.flagged_video_rate.sample_size} (minimum 20)`
                    : 'Requires 20+ completed video assessments'}
                </div>
              </div>

              {/* Metric 4: Reviewer overrides of AI recommendation */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  How often reviewers change AI's recommendation
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  Not tracked yet
                </div>
                <div className="text-[11px] text-neutral-500">
                  Reviewer recommendation diff not logged
                </div>
              </div>
            </div>
          </Card>

          {/* Column 3: REAL */}
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 shadow-sm">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                REAL
              </h3>
            </div>

            <div className="space-y-4">
              {/* Metric 1: Share of live roles verified in last 14 days */}
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Share of live roles verified in last 14 days
                </span>
                <div className="text-sm font-semibold text-white tabular-nums">
                  {metrics?.mission_health?.real?.share_verified_last_14_days?.status === 'available'
                    ? metrics.mission_health.real.share_verified_last_14_days.value
                    : 'Not enough data yet'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {metrics?.mission_health?.real?.share_verified_last_14_days?.description ||
                    'All live roles active and fresh'}
                </div>
              </div>

              {/* Metric 2: Open reports */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Open reports
                </span>
                <div className="text-sm font-semibold text-white tabular-nums">
                  {openReports === 0 ? '0' : openReports}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {openReports === 0 ? 'All clear (no open flags)' : `${openReports} unresolved community flags`}
                </div>
              </div>

              {/* Metric 3: Median time to take down a reported role */}
              <div className="space-y-1 pt-2 border-t border-neutral-800/60">
                <span className="text-xs text-neutral-400 block leading-tight">
                  Median time to take down a reported role
                </span>
                <div className="text-sm font-semibold text-neutral-300">
                  Not tracked yet
                </div>
                <div className="text-[11px] text-neutral-500">
                  Report resolution duration not recorded
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: "Recent activity"
          The last 10 audit entries, each "{Actor} {action} {target}, {time}" with a link to the item.
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Recent activity
          </h2>
          <Link
            href="/command/audit"
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            View full audit log →
          </Link>
        </div>

        <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No recent audit entries recorded.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/80">
              {recentActivity.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.link}
                      className="group inline-flex items-baseline flex-wrap gap-1.5 text-neutral-300 hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">
                        {item.actor_name}
                      </span>
                      <span className="text-neutral-400">
                        {item.action_verb}
                      </span>
                      <span className="font-medium text-neutral-200 underline decoration-neutral-700 underline-offset-2 group-hover:decoration-neutral-400 transition-colors">
                        {item.target_label}
                      </span>
                      <span className="text-neutral-500">
                        · {item.time_ago}
                      </span>
                    </Link>
                  </div>
                  <Link
                    href={item.link}
                    className="shrink-0 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
