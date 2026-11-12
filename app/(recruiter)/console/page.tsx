'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  UserPlus,
  Play,
  Mail,
  Video,
  Info,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
} from '@/lib/recruiter/store';
import {
  CorporateWorkspace,
  VideoAssessment,
  RecruiterRole,
  DashboardMetrics,
  RecruiterTask,
} from '@/lib/recruiter/types';
import { toast } from 'sonner';

export default function ConsoleDashboardOverview() {
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [candidates, setCandidates] = useState<VideoAssessment[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tasks, setTasks] = useState<RecruiterTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Loading & Error states
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  // View all tasks modal
  const [isAllTasksOpen, setIsAllTasksOpen] = useState(false);

  // Fetch Metrics & Tasks from server
  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);
    const ws = getLocalWorkspace();
    try {
      const res = await fetch(`/api/recruiter/metrics?workspace_id=${ws.id}`);
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
        setTasks(data.tasks || []);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard metrics');
      }
    } catch (err: any) {
      setMetricsError(err.message || 'Error loading metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Fetch Candidates list
  const fetchCandidates = async () => {
    setIsLoadingCandidates(true);
    setCandidatesError(null);
    const ws = getLocalWorkspace();
    try {
      const res = await fetch(`/api/talent/list?workspace_id=${ws.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        throw new Error(data.error || 'Failed to load candidate pipeline');
      }
    } catch (err: any) {
      setCandidatesError(err.message || 'Error loading candidates');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchCandidates();

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleUpdate = () => {
      setWorkspace(getLocalWorkspace());
      fetchMetrics();
      fetchCandidates();
    };

    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);
    window.addEventListener('sync730_assessments_updated', handleUpdate);

    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
      window.removeEventListener('sync730_assessments_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Quick Unlock Handler for Table Rows
  const handleQuickUnlock = async (candidateId: string) => {
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can unlock candidate profiles.');
      return;
    }

    const ws = getLocalWorkspace();
    if (ws.token_balance < 1) {
      toast.error('Insufficient tokens! Please top up your token balance.', {
        action: {
          label: 'Manage Tokens',
          onClick: () => window.location.assign('/console/team#tokens'),
        },
      });
      return;
    }

    setUnlockingId(candidateId);
    try {
      const res = await fetch('/api/talent/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          workspace_id: ws.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.candidate) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.candidate_id === candidateId || c.id === candidateId
              ? { ...c, ...data.candidate, is_unlocked: true }
              : c
          )
        );

        if (typeof data.token_balance === 'number') {
          const updatedWs = { ...ws, token_balance: data.token_balance };
          setWorkspace(updatedWs);
          saveLocalWorkspace(updatedWs);
        }

        fetchMetrics();
        toast.success('Candidate profile unlocked! 1 token spent.');
      } else {
        throw new Error(data.error || 'Failed to unlock profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unlocking candidate.');
    } finally {
      setUnlockingId(null);
    }
  };

  // Filtered recent candidates
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const name = (c.candidate_name || '').toLowerCase();
    const role = (c.target_role || '').toLowerCase();
    const email = (c.candidate_email || '').toLowerCase();
    return name.includes(q) || role.includes(q) || email.includes(q);
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Error Banner if Metrics Failed */}
        {metricsError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{metricsError}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchMetrics}
              className="h-7 text-xs border-rose-300 dark:border-rose-800 gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Top Section: Metrics Cards - Fitted Height with Tooltips */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 3 Stat Cards (Col 8) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Vetted Candidates Available */}
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs h-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Vetted Candidates
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                    <p className="font-semibold mb-0.5">How this is calculated:</p>
                    <p className="text-neutral-300">
                      Verified candidates matching active technical requirements and passing standards in your organization&apos;s candidate pool.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {isLoadingMetrics ? (
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {metrics ? metrics.vetted_candidates_count : 0}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {metrics?.unlocked_candidates_count || 0} unlocked profile dossiers
                  </div>
                </div>
              )}
            </Card>

            {/* Card 2: Assessment Funnel & Completion */}
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs h-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Assessment Funnel
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                    <p className="font-semibold mb-0.5">How this is calculated:</p>
                    <p className="text-neutral-300">
                      Progression of candidate screenings across your workspace: Invited → Started → Completed → Passed Flowmingo AI video review.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {isLoadingMetrics ? (
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                      {metrics ? metrics.funnel.completion_rate_percent : 0}%
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      {metrics?.funnel.completed || 0}/{metrics?.funnel.invited || 0} Finished
                    </span>
                  </div>

                  {/* Funnel Pipeline Counts */}
                  <div className="mt-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] font-medium text-neutral-500 flex items-center justify-between">
                    <span title="Invited">Invited: <strong>{metrics?.funnel.invited || 0}</strong></span>
                    <span>→</span>
                    <span title="Started">Started: <strong>{metrics?.funnel.started || 0}</strong></span>
                    <span>→</span>
                    <span title="Passed">Passed: <strong className="text-emerald-600">{metrics?.funnel.passed || 0}</strong></span>
                  </div>
                </div>
              )}
            </Card>

            {/* Card 3: Average Match Score */}
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs h-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/50 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Avg Match Score
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                    <p className="font-semibold mb-0.5">How this is calculated:</p>
                    <p className="text-neutral-300">
                      Weighted composite score across technical depth and communication skills for candidates evaluated against your workspace&apos;s active roles.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {isLoadingMetrics ? (
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {metrics ? metrics.avg_match_score : 0}%
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    For {metrics?.active_roles_count || 0} active role posting(s)
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right 2 Cards (Col 4) */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Card 4: Available Tokens - Role Guarded */}
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs h-auto flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                  <span>Available Tokens</span>
                </div>
                {isLoadingMetrics ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {workspace.token_balance} Tokens
                  </div>
                )}
                <div className="text-[11px] text-neutral-400">
                  1 token unlocks 1 full candidate profile
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Active
                </span>
                {currentRole === 'INTERVIEWER' ? (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Ask an admin to top up
                  </span>
                ) : (
                  <Link
                    href="/console/team#tokens"
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline"
                  >
                    Manage Tokens
                  </Link>
                )}
              </div>
            </Card>

            {/* Card 5: Active Screenings */}
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs h-auto flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <Video className="h-3.5 w-3.5 text-blue-500 stroke-[1.5]" />
                  <span>Active Screenings</span>
                </div>
                {isLoadingMetrics ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {metrics ? metrics.funnel.started : 0} In Review
                  </div>
                )}
                <div className="text-[11px] text-neutral-400">
                  Flowmingo AI verified assessments
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                  Pending
                </span>
                <Link
                  href="/console/talent"
                  className="text-[11px] font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-0.5"
                >
                  <span>Review</span>
                  <ChevronRight className="h-3 w-3 stroke-[1.5]" />
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Global Empty State When Workspace Has Zero Jobs */}
        {!isLoadingMetrics && metrics && !metrics.has_jobs && (
          <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Briefcase className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              No active job screenings yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Create your company&apos;s first role to initialize an automated Flowmingo AI candidate screening project and populate real matching metrics.
            </p>
            {isOwnerOrAdmin && (
              <Link href="/console/jobs">
                <Button className="mt-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-xs">
                  <Plus className="h-4 w-4" />
                  <span>Post Your First Role</span>
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Middle Section: "Things to do (N)" - Dynamic Tasks from Real Events */}
        <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Things to do ({tasks.length})
              </h2>
            </div>
            {tasks.length > 3 && (
              <button
                type="button"
                onClick={() => setIsAllTasksOpen(true)}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all ({tasks.length})</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[1.5]" />
              </button>
            )}
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoadingMetrics ? (
              <div className="py-4 space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                <span>All caught up! No pending recruiter action items.</span>
              </div>
            ) : (
              tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      {task.type === 'REVIEW_VIDEO' ? (
                        <Video className="h-5 w-5 stroke-[1.5] text-blue-600" />
                      ) : task.type === 'PENDING_INVITE' ? (
                        <UserPlus className="h-5 w-5 stroke-[1.5] text-indigo-600" />
                      ) : task.type === 'LOW_TOKENS' ? (
                        <Zap className="h-5 w-5 stroke-[1.5] text-amber-600" />
                      ) : (
                        <Briefcase className="h-5 w-5 stroke-[1.5] text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] text-neutral-400 font-medium hidden md:inline">
                      {task.relative_due_label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        task.is_overdue
                          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300'
                      }`}
                    >
                      {task.badge_label}
                    </Badge>
                    <Link href={task.link}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <ChevronRight className="h-4 w-4 stroke-[1.5] text-neutral-400" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* View All Tasks Dialog */}
        <Dialog open={isAllTasksOpen} onOpenChange={setIsAllTasksOpen}>
          <DialogContent className="max-w-xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                All Action Items ({tasks.length})
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Real-time hiring tasks generated from pending candidate videos, invites, and active jobs.
              </DialogDescription>
            </DialogHeader>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 pt-3">
              {tasks.map((task) => (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{task.description}</p>
                  </div>
                  <Link href={task.link}>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-lg">
                      Open
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bottom Two-Column Section: Recent Candidate Pipeline + Talent Pool Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recent Candidate Unlocks Table (Col 8) */}
          <div className="lg:col-span-8">
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                    Recent Candidate Pipeline
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Vetted video assessments and unlocked candidate profiles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search candidate..."
                      className="h-8 pl-8 pr-3 text-xs w-44 rounded-full border-neutral-200 dark:border-neutral-800"
                    />
                  </div>
                </div>
              </div>

              {/* Table / Loading Skeleton / Empty State */}
              {isLoadingCandidates ? (
                <div className="space-y-3 py-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : candidatesError ? (
                <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400 space-y-2">
                  <p>{candidatesError}</p>
                  <Button size="sm" variant="outline" onClick={fetchCandidates} className="text-xs">
                    Retry
                  </Button>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  <Users className="h-8 w-8 text-neutral-400 mx-auto mb-2 opacity-50 stroke-[1.5]" />
                  <span>No candidate assessments match your search.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 text-[11px] font-semibold">
                        <th className="pb-3 font-semibold">Candidate</th>
                        <th className="pb-3 font-semibold">Target Role</th>
                        <th className="pb-3 font-semibold">Match Score</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {filteredCandidates.map((cand) => {
                        const isUnlocked = Boolean(cand.is_unlocked);
                        const isProcessing = cand.status === 'PROCESSING';
                        const initials = (cand.candidate_name || 'VC')
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <tr
                            key={cand.id || cand.candidate_id}
                            className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                          >
                            {/* Name & Avatar */}
                            <td className="py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 rounded-full border border-neutral-200 dark:border-neutral-800">
                                  <AvatarFallback className="bg-neutral-900 text-white text-[10px] font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold text-neutral-900 dark:text-white">
                                    {cand.candidate_name}
                                  </div>
                                  <div className="text-[11px] text-neutral-400">
                                    {isUnlocked ? cand.candidate_email : 'Contact masked'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Target Role */}
                            <td className="py-3.5 text-neutral-700 dark:text-neutral-300 font-medium">
                              {cand.target_role}
                            </td>

                            {/* Match Score */}
                            <td className="py-3.5">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {cand.overall_match_score}%
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3.5">
                              {isProcessing ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                  <span>Processing</span>
                                </span>
                              ) : isUnlocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                  <Unlock className="h-2.5 w-2.5 stroke-[1.5]" />
                                  <span>Paid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                  <Lock className="h-2.5 w-2.5 stroke-[1.5]" />
                                  <span>Masked</span>
                                </span>
                              )}
                            </td>

                            {/* Action - Role Guarded */}
                            <td className="py-3.5 text-right">
                              {isProcessing ? (
                                <span className="text-[11px] text-neutral-400 italic">
                                  Screening in progress
                                </span>
                              ) : isUnlocked ? (
                                <a href={`mailto:${cand.candidate_email}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-[11px] rounded-full font-semibold border-neutral-200 gap-1"
                                  >
                                    <Mail className="h-3 w-3 stroke-[1.5]" />
                                    <span>Contact</span>
                                  </Button>
                                </a>
                              ) : isOwnerOrAdmin ? (
                                <Button
                                  onClick={() => handleQuickUnlock(cand.candidate_id)}
                                  disabled={unlockingId === cand.candidate_id}
                                  size="sm"
                                  className="h-7 px-3 text-[11px] rounded-full font-semibold bg-neutral-900 text-white hover:bg-neutral-800 gap-1 shadow-2xs"
                                >
                                  <Zap className="h-3 w-3 text-amber-400 fill-amber-400 stroke-[1.5]" />
                                  <span>Unlock (1 Token)</span>
                                </Button>
                              ) : (
                                <Link href="/console/talent">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-[11px] rounded-full font-semibold border-neutral-200 gap-1"
                                  >
                                    <Video className="h-3 w-3 stroke-[1.5]" />
                                    <span>View Video</span>
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Talent Pool Breakdown */}
          <div className="lg:col-span-4">
            <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  Talent Pool Breakdown
                </h3>
                <Link
                  href="/console/talent"
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                >
                  <span>View all</span>
                  <ChevronRight className="h-3 w-3 stroke-[1.5]" />
                </Link>
              </div>

              {/* Total Count & Trend */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/50 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {metrics ? metrics.vetted_candidates_count : 0}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                    Verified pool
                  </span>
                </div>
              </div>

              {/* Striped Visual Distribution Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                  <span>Frontend</span>
                  <span>Full Stack & Backend</span>
                  <span>AI / Systems</span>
                </div>

                <div className="h-8 w-full flex rounded-2xl overflow-hidden p-1 bg-neutral-100 dark:bg-neutral-800 gap-1">
                  <div
                    className="h-full rounded-xl bg-amber-400 flex items-center justify-center"
                    style={{ width: '25%' }}
                    title="Frontend: 25%"
                  />
                  <div
                    className="h-full rounded-xl bg-indigo-600 flex items-center justify-center"
                    style={{ width: '50%' }}
                    title="Full Stack: 50%"
                  />
                  <div
                    className="h-full rounded-xl bg-emerald-500 flex items-center justify-center"
                    style={{ width: '25%' }}
                    title="AI / Systems: 25%"
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="text-neutral-600 dark:text-neutral-400">Frontend & Mobile</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">1 candidate</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    <span className="text-neutral-600 dark:text-neutral-400">Full Stack & Cloud</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">2 candidates</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">AI / ML & Systems</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">1 candidate</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
