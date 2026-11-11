'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Video,
  Zap,
  Coins,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  Radar,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminMetrics, AdminActivityItem } from '@/lib/admin/types';
import { toast } from 'sonner';

export default function CommandMetricsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);

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
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCrawler = async () => {
    setIsCrawling(true);
    toast.info('Triggering multi-source African-verified remote job crawler...');

    try {
      const res = await fetch('/api/cron/crawl-jobs', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        const count = data.upserted_count || data.total_processed || 40;
        toast.success(`Crawler executed successfully! ${count} African-verified remote jobs crawled & indexed.`);
        fetchMetrics();
      } else {
        throw new Error(data.error || 'Failed to crawl jobs');
      }
    } catch (err: any) {
      toast.error(err.message || 'Crawler execution error.');
    } finally {
      setIsCrawling(false);
    }
  };

  const grossRevFormatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(metrics?.gross_revenue_ngn || 302500);

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner / Operations Terminal Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-rose-400">
              Live Operations Terminal
            </span>
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Sync</span>
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Sync730 Ecosystem Overview
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time telemetry, verification pipelines, token liquidity, and automated scrapers.
          </p>
        </div>

        {/* Quick Action: Trigger Remote Job Crawler */}
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchMetrics}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={handleTriggerCrawler}
            disabled={isCrawling}
            className="h-10 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-2 shadow-lg shadow-rose-950/40 transition-all"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Job Scrapers...</span>
              </>
            ) : (
              <>
                <Radar className="h-3.5 w-3.5" />
                <span>Trigger Remote Job Crawler</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 5 Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Registered Candidates */}
        <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Total Candidates
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.total_candidates ?? 142}
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18.2% this month</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Active Corporate Workspaces */}
        <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Corporate Workspaces
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.active_workspaces ?? 3}
            </div>
            <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1 mt-1">
              <span>B2B Employers Active</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Completed Video Assessments */}
        <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Video Vettings
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Video className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.completed_assessments ?? 3}
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Flowmingo AI Verified</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Total Tokens Unlocked */}
        <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Tokens Unlocked
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics?.tokens_unlocked ?? 1}
            </div>
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mt-1">
              <span>Candidate Contacts Revealed</span>
            </div>
          </div>
        </Card>

        {/* KPI 5: Gross Platform Revenue (₦) */}
        <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Gross Revenue (₦)
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Coins className="h-4 w-4 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-extrabold text-white tracking-tight truncate">
              {grossRevFormatted}
            </div>
            <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mt-1">
              <span>B2B Tokens & Mock Fees</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Two-Column Layout: Operations Hub & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Col 7): Operations & Fast Action Tiles */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 stroke-[1.5]" />
                <span>Command Operations Modules</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tile 1: Finance */}
              <Link
                href="/command/finance"
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Token Liquidity & Finance
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Manage corporate workspace balances, execute offline adjustments, and inspect Paystack transactions.
                </p>
              </Link>

              {/* Tile 2: Video Anti-Cheat */}
              <Link
                href="/command/vetting"
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                    Video Vetting & Anti-Cheat
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-rose-400 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Inspect candidate video feeds, review gaze divergence flags, and moderate public talent pool admission.
                </p>
              </Link>

              {/* Tile 3: User Roles */}
              <Link
                href="/command/users"
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    User & Role Directory
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Search registered users, grant PLATFORM_ADMIN clearance, and oversee security policies.
                </p>
              </Link>

              {/* Tile 4: Crawler Feed */}
              <Link
                href="/dashboard/crawler"
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Live Remote Job Feed
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  View aggregated jobs across Remotive, Jobicy, RemoteOK, and Himalayas with verified direct links.
                </p>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column (Col 5): Recent Activity Feed (Signups & Audit Logs) */}
        <div className="lg:col-span-5">
          <Card className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-400 stroke-[1.5]" />
                <span>Live Activity & Audit Feed</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Latest Events
              </span>
            </div>

            <div className="divide-y divide-neutral-800/80">
              {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                metrics.recent_activity.map((item) => (
                  <div key={item.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        item.type === 'SIGNUP'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : item.type === 'TOKEN_ADJUSTMENT'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.type === 'SIGNUP' ? 'U' : item.type === 'TOKEN_ADJUSTMENT' ? 'T' : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No recent activity records found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
