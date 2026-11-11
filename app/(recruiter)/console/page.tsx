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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  getLocalAssessments,
} from '@/lib/recruiter/store';
import { CorporateWorkspace, VideoAssessment } from '@/lib/recruiter/types';
import { toast } from 'sonner';

export default function ConsoleDashboardOverview() {
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [candidates, setCandidates] = useState<VideoAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Sync workspace and fetch candidates
  const loadData = async () => {
    const ws = getLocalWorkspace();
    setWorkspace(ws);

    try {
      const res = await fetch(`/api/talent/list?workspace_id=${ws.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setWorkspace(getLocalWorkspace());
      loadData();
    };

    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);
    window.addEventListener('sync730_assessments_updated', handleUpdate);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
      window.removeEventListener('sync730_assessments_updated', handleUpdate);
    };
  }, []);

  // Quick Unlock Handler for Table Rows
  const handleQuickUnlock = async (candidateId: string) => {
    const ws = getLocalWorkspace();
    if (ws.token_balance < 1) {
      toast.error('Insufficient tokens! Please top up your token balance.', {
        action: {
          label: 'Top Up',
          onClick: () => window.location.assign('/console/team'),
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

  // Dev Test Top Up
  const handleDevTopUp = async () => {
    try {
      const res = await fetch('/api/recruiter/tokens/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          tokens_to_add: 5,
        }),
      });
      const data = await res.json();
      if (data.success && data.workspace) {
        setWorkspace(data.workspace);
        saveLocalWorkspace(data.workspace);
        toast.success('+5 Dev Test Tokens added!');
      }
    } catch {
      const updated = { ...workspace, token_balance: workspace.token_balance + 5 };
      setWorkspace(updated);
      saveLocalWorkspace(updated);
      toast.success('+5 Dev Test Tokens added!');
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
    <div className="space-y-6">
      {/* Top Section: 3 Stats Cards + 2 Right Cards (HireHR Design Logic) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 3 Stat Cards (Col 8) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Candidates Vetted (Total employee style) */}
          <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Vetted Candidates
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                1,243
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                +12.08%
              </span>
            </div>
          </Card>

          {/* Card 2: Attendance rate -> Vet-Once Completion */}
          <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Vet-Once Pass Rate
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                98%
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                +10.29%
              </span>
            </div>
          </Card>

          {/* Card 3: Total Revenue -> Talent Matches */}
          <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/50 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 stroke-[1.5]" />
              </div>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Talent Match Index
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                88%
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                +9.01%
              </span>
            </div>
          </Card>
        </div>

        {/* Right 2 Payroll-Style Cards (Col 4) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Card 4: Previous Payroll Style -> Available Tokens */}
          <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                <span>Available Tokens</span>
              </div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {workspace.token_balance} Tokens
              </div>
              <div className="text-[11px] text-neutral-400">
                1 token unlocks 1 full candidate profile
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Active
              </span>
              <button
                onClick={handleDevTopUp}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline"
              >
                +5 Test Tokens
              </button>
            </div>
          </Card>

          {/* Card 5: Upcoming Payroll Style -> Active Screenings */}
          <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <Video className="h-3.5 w-3.5 text-blue-500 stroke-[1.5]" />
                <span>Active Screenings</span>
              </div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                3 In Review
              </div>
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

      {/* Middle Section: "Things to do (6)" Hiring Actions */}
      <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
              Things to do (6)
            </h2>
          </div>
          <Link
            href="/console/jobs"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[1.5]" />
          </Link>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Item 1 */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 -mx-2 px-2 rounded-xl transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Assess and review candidate video submissions
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Two candidates completed Vet-Once interviews and need your scoring attention.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-[11px] text-neutral-400 font-medium hidden md:inline">
                Fri, 10 Oct
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400"
              >
                Overdue
              </Badge>
              <Link href="/console/talent">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <MoreHorizontal className="h-4 w-4 stroke-[1.5] text-neutral-400" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Item 2 */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 -mx-2 px-2 rounded-xl transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Onboard new technical interviewers
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Invite engineering teammates to review video assessments with INTERVIEWER permissions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-[11px] text-neutral-400 font-medium hidden md:inline">
                Sun, 12 Oct
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400"
              >
                2 Day Left
              </Badge>
              <Link href="/console/team">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <MoreHorizontal className="h-4 w-4 stroke-[1.5] text-neutral-400" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Item 3 */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 -mx-2 px-2 rounded-xl transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Calibrate Flowmingo screening rubric
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Tune technical depth criteria and questions for the Senior Full Stack role.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-[11px] text-neutral-400 font-medium hidden md:inline">
                Mon, 13 Oct
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400"
              >
                6 Day Left
              </Badge>
              <Link href="/console/jobs">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <MoreHorizontal className="h-4 w-4 stroke-[1.5] text-neutral-400" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom Two-Column Section: Recent Candidate Unlocks (Payroll Table) + Talent Distribution (Total Employee) */}
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

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-full border-neutral-200 dark:border-neutral-800 text-xs font-semibold gap-1.5"
                >
                  <SlidersHorizontal className="h-3 w-3 stroke-[1.5]" />
                  <span>Filters</span>
                </Button>
              </div>
            </div>

            {/* Table (HireHR Recent Payroll Style) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 text-[11px] font-semibold">
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Target Role</th>
                    <th className="pb-3 font-semibold">Match Score</th>
                    <th className="pb-3 font-semibold">Unlock Cost</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredCandidates.map((cand) => {
                    const isUnlocked = Boolean(cand.is_unlocked);
                    const initials = (cand.candidate_name || 'VC')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={cand.id || cand.candidate_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
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

                        {/* Unlock Cost */}
                        <td className="py-3.5 text-neutral-600 dark:text-neutral-300">
                          {isUnlocked ? '0 Tokens' : '1 Token'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <Unlock className="h-2.5 w-2.5 stroke-[1.5]" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              <Lock className="h-2.5 w-2.5 stroke-[1.5]" />
                              <span>Masked</span>
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 text-right">
                          {isUnlocked ? (
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
                          ) : (
                            <Button
                              onClick={() => handleQuickUnlock(cand.candidate_id)}
                              disabled={unlockingId === cand.candidate_id}
                              size="sm"
                              className="h-7 px-3 text-[11px] rounded-full font-semibold bg-neutral-900 text-white hover:bg-neutral-800 gap-1 shadow-2xs"
                            >
                              <Zap className="h-3 w-3 text-amber-400 fill-amber-400 stroke-[1.5]" />
                              <span>Unlock</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Total Employee / Talent Distribution Visual (Col 4) */}
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
                  3,200
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40">
                  +45 this week
                </span>
              </div>
            </div>

            {/* Segmented Barcode / Striped Distribution Bar (HireHR Visual) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                <span>15%</span>
                <span>63%</span>
                <span>22%</span>
              </div>

              {/* Striped Visual Barcode Bar */}
              <div className="h-10 w-full flex rounded-2xl overflow-hidden p-1 bg-neutral-100 dark:bg-neutral-800 gap-1">
                {/* 15% Orange Striped Bar */}
                <div
                  className="h-full rounded-xl bg-amber-400 flex items-center justify-center relative overflow-hidden"
                  style={{ width: '15%' }}
                  title="Frontend & Mobile: 15%"
                >
                  <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_6px)]" />
                </div>

                {/* 63% Indigo/Blue Striped Bar */}
                <div
                  className="h-full rounded-xl bg-indigo-600 flex items-center justify-center relative overflow-hidden"
                  style={{ width: '63%' }}
                  title="Full Stack & Backend: 63%"
                >
                  <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#fff,#fff_2px,transparent_2px,transparent_6px)]" />
                </div>

                {/* 22% Emerald Striped Bar */}
                <div
                  className="h-full rounded-xl bg-emerald-500 flex items-center justify-center relative overflow-hidden"
                  style={{ width: '22%' }}
                  title="AI / ML & Cloud: 22%"
                >
                  <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_6px)]" />
                </div>
              </div>
            </div>

            {/* Legend and Headcounts */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Full Stack & Backend
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <span>2,000 People</span>
                  <ExternalLink className="h-3 w-3 stroke-[1.5]" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Frontend & Mobile
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <span>500 People</span>
                  <ExternalLink className="h-3 w-3 stroke-[1.5]" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    AI / ML & Cloud
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <span>700 People</span>
                  <ExternalLink className="h-3 w-3 stroke-[1.5]" />
                </div>
              </div>
            </div>

            {/* CTA Link */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Link href="/console/talent">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 rounded-2xl border-neutral-200 dark:border-neutral-800 font-semibold gap-1.5"
                >
                  <span>Explore All 3,200 Candidates</span>
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
