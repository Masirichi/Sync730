'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Users,
  Download,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Search,
  AlertCircle,
  ShieldAlert,
  Play,
  Video,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  Info,
  DollarSign,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  EmployerJob,
  PipelineCandidate,
  PipelineStage,
  RecruiterRole,
  ScorecardEntry,
  ScheduledInterview,
} from '@/lib/recruiter/types';
import {
  getLocalJobs,
  getLocalPipelineCandidates,
  updateLocalPipelineCandidateStage,
  addScorecardToPipelineCandidate,
  addNoteToPipelineCandidate,
  scheduleInterviewForPipelineCandidate,
  getLocalMembers,
} from '@/lib/recruiter/store';
import { formatSalaryDisplay } from '@/lib/salary/formatSalary';
import { toast } from 'sonner';

const PIPELINE_STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'Shortlisted', label: 'Shortlisted', color: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'Contacted', label: 'Contacted', color: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { id: 'Interviewing', label: 'Interviewing', color: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'Offer', label: 'Offer', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'Hired', label: 'Hired', color: 'border-emerald-600/30 bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold' },
  { id: 'Rejected', label: 'Rejected', color: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
];

const REJECTION_PRESETS = [
  'Skill mismatch: Lacks required technical depth in core stack',
  'Compensation mismatch: Declared salary expectation exceeds budget',
  'Culture & collaboration values mismatch',
  'Failed technical problem-solving & architecture assessment',
  'Position filled / role closed internally',
  'Candidate declined offer or withdrew application',
];

export default function JobPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<EmployerJob | null>(null);
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scorecards' | 'notes' | 'timeline' | 'interview'>('overview');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Dialog State
  const [rejectDialogCandidate, setRejectDialogCandidate] = useState<PipelineCandidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionText, setCustomRejectionText] = useState('');

  // Scorecard Form State
  const [scoreTech, setScoreTech] = useState(4);
  const [scoreProblem, setScoreProblem] = useState(4);
  const [scoreCulture, setScoreCulture] = useState(4);
  const [scoreComm, setScoreComm] = useState(4);
  const [scoreNotes, setScoreNotes] = useState('');

  // Internal Note Form State
  const [noteText, setNoteText] = useState('');

  // Interview Schedule Form State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewDuration, setInterviewDuration] = useState('45');
  const [interviewLink, setInterviewLink] = useState('https://meet.google.com/sync-730-int');
  const [interviewNotes, setInterviewNotes] = useState('Technical Deep-Dive & System Design Round');

  // Recruiter Session Role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');
  const [currentUserName, setCurrentUserName] = useState('Alex Morgan (Owner)');

  // Notification Banner for teammate updates
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  const loadData = () => {
    const jobs = getLocalJobs();
    const currentJob = jobs.find((j) => j.id === jobId) || null;
    setJob(currentJob);

    const cands = getLocalPipelineCandidates(jobId);
    setCandidates(cands);

    // Keep drawer candidate in sync
    if (selectedCandidate) {
      const refreshed = cands.find((c) => c.id === selectedCandidate.id);
      if (refreshed) setSelectedCandidate(refreshed);
    }
  };

  useEffect(() => {
    loadData();

    // Check recruiter active role
    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) {
          setCurrentRole(r);
          setCurrentUserName(r === 'INTERVIEWER' ? 'Sarah Chen (Tech Lead)' : 'Alex Morgan (Owner)');
        }
      }
    };
    updateRole();

    const handlePipelineUpdate = () => {
      loadData();
    };
    window.addEventListener('sync730_pipeline_updated', handlePipelineUpdate);
    window.addEventListener('sync730_jobs_updated', loadData);

    return () => {
      window.removeEventListener('sync730_pipeline_updated', handlePipelineUpdate);
      window.removeEventListener('sync730_jobs_updated', loadData);
    };
  }, [jobId]);

  const canExportCsv = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Filter candidates by search
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.masked_id.toLowerCase().includes(q) ||
        (c.candidate_name && c.candidate_name.toLowerCase().includes(q)) ||
        c.skills.some((s) => s.toLowerCase().includes(q)) ||
        c.seniority.toLowerCase().includes(q)
      );
    });
  }, [candidates, searchQuery]);

  // Handle stage move
  const handleStageMove = async (candidate: PipelineCandidate, targetStage: PipelineStage) => {
    if (targetStage === 'Rejected') {
      // Trigger mandatory rejection reason dialog
      setRejectDialogCandidate(candidate);
      setRejectionReason(REJECTION_PRESETS[0]);
      setCustomRejectionText('');
      return;
    }

    try {
      const res = await fetch('/api/recruiter/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move_stage',
          candidate_id: candidate.id,
          stage: targetStage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        toast.success(`Candidate moved to ${targetStage}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to move candidate');
    }
  };

  // Confirm rejection with required reason
  const handleConfirmRejection = async () => {
    if (!rejectDialogCandidate) return;

    const finalReason = customRejectionText.trim()
      ? `${rejectionReason}: ${customRejectionText.trim()}`
      : rejectionReason;

    if (!finalReason.trim()) {
      toast.error('A rejection reason is strictly required.');
      return;
    }

    try {
      const res = await fetch('/api/recruiter/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move_stage',
          candidate_id: rejectDialogCandidate.id,
          stage: 'Rejected',
          reason: finalReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        toast.success('Candidate moved to Rejected with documented reason.');
        setRejectDialogCandidate(null);
        setCustomRejectionText('');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject candidate');
    }
  };

  // Submit Scorecard
  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      const res = await fetch('/api/recruiter/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scorecard',
          candidate_id: selectedCandidate.id,
          technical_depth: scoreTech,
          problem_solving: scoreProblem,
          culture_values: scoreCulture,
          communication: scoreComm,
          notes: scoreNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
        setScoreNotes('');
        toast.success(data.message);
        setRecentNotification(`New scorecard submitted by ${currentUserName} for ${selectedCandidate.masked_id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit scorecard');
    }
  };

  // Submit Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !noteText.trim()) return;

    try {
      const res = await fetch('/api/recruiter/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note',
          candidate_id: selectedCandidate.id,
          text: noteText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
        setNoteText('');
        toast.success('Internal note saved.');
        setRecentNotification(`New note added by ${currentUserName}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !interviewDate) {
      toast.error('Please pick an interview date and time.');
      return;
    }

    try {
      const res = await fetch('/api/recruiter/jobs/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_interview',
          candidate_id: selectedCandidate.id,
          scheduled_at: new Date(interviewDate).toISOString(),
          duration_minutes: Number(interviewDuration),
          meeting_link: interviewLink,
          notes: interviewNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();

        // Download ICS calendar invite file
        if (data.ics_calendar) {
          const blob = new Blob([data.ics_calendar], { type: 'text/calendar;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview-${selectedCandidate.masked_id}.ics`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        toast.success(`Interview scheduled & calendar invite generated! Candidate advanced to Interviewing.`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule interview');
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    if (!canExportCsv) {
      toast.error('Export restricted: Only Workspace Admins and Owners can export pipeline data.');
      return;
    }

    try {
      window.location.href = `/api/recruiter/jobs/export?job_id=${jobId}`;
      toast.success('Pipeline CSV export initiated and recorded in audit log.');
    } catch (err: any) {
      toast.error('Failed to export CSV: ' + err.message);
    }
  };

  if (!job) {
    return (
      <div className="p-12 text-center space-y-4">
        <Briefcase className="h-10 w-10 text-neutral-400 mx-auto" />
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">Role Not Found</h2>
        <p className="text-xs text-neutral-500">The requested job pipeline could not be loaded.</p>
        <Link href="/console/jobs">
          <Button size="sm" variant="outline" className="text-xs">
            Return to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teammate Activity Toast / Banner */}
      {recentNotification && (
        <div className="p-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium">{recentNotification}</span>
          </div>
          <button
            onClick={() => setRecentNotification(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Job Summary & Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link
            href="/console/jobs"
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Jobs</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">Hiring Pipeline</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {job.job_title}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-bold ${
                  job.status === 'active'
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : job.status === 'paused'
                    ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : job.status === 'closed'
                    ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                    : 'border-neutral-500/30 text-neutral-600 dark:text-neutral-400 bg-neutral-500/10'
                }`}
              >
                {job.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 stroke-[1.5]" />
                {job.department || 'Engineering'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 stroke-[1.5]" />
                {job.location || 'Remote'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-neutral-200">
                <DollarSign className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                {formatSalaryDisplay(job)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 stroke-[1.5]" />
                {candidates.length} candidates in pipeline
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={!canExportCsv}
              title={canExportCsv ? 'Export pipeline dataset to CSV' : 'Export restricted to Admins'}
              className="text-xs h-9 px-3 rounded-xl border-neutral-200 dark:border-neutral-800 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>

            {/* Vetted Talent link */}
            <Link href={`/console/talent?job=${job.id}`}>
              <Button
                size="sm"
                className="text-xs h-9 px-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Pool Candidates</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by ID, skills, or seniority..."
            className="pl-9 h-9 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none"
          />
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.id);

            return (
              <div
                key={stage.id}
                className="bg-neutral-50/80 dark:bg-neutral-900/60 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-800 flex flex-col min-h-[480px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {stage.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${stage.color}`}
                    >
                      {stageCandidates.length}
                    </Badge>
                  </div>
                </div>

                {/* Candidate Cards Column */}
                <div className="space-y-2.5 flex-1">
                  {stageCandidates.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[11px] text-neutral-400 text-center px-2">
                      No candidates in {stage.label}
                    </div>
                  ) : (
                    stageCandidates.map((candidate) => {
                      const avgRating =
                        candidate.scorecards && candidate.scorecards.length > 0
                          ? (
                              candidate.scorecards.reduce((acc, s) => acc + s.overall_rating, 0) /
                              candidate.scorecards.length
                            ).toFixed(1)
                          : null;

                      return (
                        <div
                          key={candidate.id}
                          className="bg-white dark:bg-neutral-900 rounded-xl p-3.5 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs transition-all space-y-2.5 group cursor-pointer"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-neutral-900 dark:text-white">
                                {candidate.candidate_name || candidate.masked_id}
                              </p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {candidate.seniority} · {candidate.years_of_experience || 5}+ yrs
                              </p>
                            </div>

                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
                            >
                              {candidate.overall_match_score}% match
                            </Badge>
                          </div>

                          {/* Skills preview */}
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="text-[10px] text-neutral-400 self-center">
                                +{candidate.skills.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Scores & Activity Indicators */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800 text-neutral-500">
                            <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                              Tech: {candidate.technical_depth_score}%
                            </span>

                            {avgRating ? (
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Star className="h-3 w-3 fill-amber-500" />
                                <span>{avgRating}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">No score</span>
                            )}
                          </div>

                          {/* Rejection notice if rejected */}
                          {candidate.stage === 'Rejected' && candidate.rejection_reason && (
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[10px] text-rose-700 dark:text-rose-300">
                              <p className="font-semibold line-clamp-2">
                                {candidate.rejection_reason}
                              </p>
                            </div>
                          )}

                          {/* Scheduled interview badge if present */}
                          {candidate.scheduled_interviews && candidate.scheduled_interviews.length > 0 && (
                            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-center gap-1.5 text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {new Date(candidate.scheduled_interviews[0].scheduled_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Quick Stage Transition Actions */}
                          <div
                            className="pt-2 flex items-center justify-between gap-1 border-t border-neutral-100 dark:border-neutral-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={candidate.stage}
                              onChange={(e) => handleStageMove(candidate, e.target.value as PipelineStage)}
                              className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 border-0 rounded px-1.5 py-1 text-neutral-700 dark:text-neutral-300 focus:ring-1 focus:ring-neutral-400"
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Move to {s.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setIsDrawerOpen(true);
                              }}
                              className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Overall Fit</th>
                  <th className="py-3 px-4">Technical Depth</th>
                  <th className="py-3 px-4">Seniority</th>
                  <th className="py-3 px-4">Scorecards</th>
                  <th className="py-3 px-4">Applied</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredCandidates.map((c) => {
                  const stageObj = PIPELINE_STAGES.find((s) => s.id === c.stage);
                  const avgRating =
                    c.scorecards && c.scorecards.length > 0
                      ? (
                          c.scorecards.reduce((acc, s) => acc + s.overall_rating, 0) /
                          c.scorecards.length
                        ).toFixed(1)
                      : null;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {c.candidate_name || c.masked_id}
                          </p>
                          <p className="text-[11px] text-neutral-500">{c.location || 'Remote'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${stageObj?.color || ''}`}
                        >
                          {c.stage}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {c.overall_match_score}%
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-700 dark:text-neutral-300">
                        {c.technical_depth_score}%
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                        {c.seniority}
                      </td>
                      <td className="py-3.5 px-4">
                        {avgRating ? (
                          <span className="flex items-center gap-1 font-bold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span>{avgRating} ({c.scorecards.length})</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Unrated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {new Date(c.applied_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={c.stage}
                            onChange={(e) => handleStageMove(c, e.target.value as PipelineStage)}
                            className="text-xs bg-neutral-100 dark:bg-neutral-800 border-0 rounded px-2 py-1 text-neutral-700 dark:text-neutral-300"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCandidate(c);
                              setIsDrawerOpen(true);
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            Review →
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANDATORY REJECTION REASON DIALOG */}
      <Dialog
        open={Boolean(rejectDialogCandidate)}
        onOpenChange={(open) => {
          if (!open) setRejectDialogCandidate(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Document Rejection Reason</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              For fair hiring standards, every candidate rejection requires a documented reason before transitioning stages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-neutral-900 dark:text-white">
                Candidate: {rejectDialogCandidate?.candidate_name || rejectDialogCandidate?.masked_id}
              </p>
              <p className="text-neutral-500">
                Fit: {rejectDialogCandidate?.overall_match_score}% · {rejectDialogCandidate?.seniority}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Primary Reason Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2.5"
              >
                {REJECTION_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Specific Feedback / Notes (Optional)
              </label>
              <Textarea
                value={customRejectionText}
                onChange={(e) => setCustomRejectionText(e.target.value)}
                placeholder="Add specific notes on assessment results or skill gaps..."
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogCandidate(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRejection}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CANDIDATE DEEP DIVE DRAWER */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-6 space-y-6">
          {selectedCandidate && (
            <>
              <SheetHeader className="space-y-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                      {selectedCandidate.candidate_name || selectedCandidate.masked_id}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-neutral-500">
                      {selectedCandidate.seniority} · {selectedCandidate.years_of_experience || 5}+ yrs exp · {selectedCandidate.location || 'Remote'}
                    </SheetDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    {selectedCandidate.overall_match_score}% fit
                  </Badge>
                </div>

                {/* Stage switcher in Drawer */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-neutral-500">Stage:</span>
                  <select
                    value={selectedCandidate.stage}
                    onChange={(e) => handleStageMove(selectedCandidate, e.target.value as PipelineStage)}
                    className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border-0 rounded px-2 py-1 text-neutral-900 dark:text-white"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drawer Tab Navigation */}
                <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
                  {(
                    [
                      { id: 'overview', label: 'Overview & Video' },
                      { id: 'scorecards', label: `Scorecards (${selectedCandidate.scorecards?.length || 0})` },
                      { id: 'notes', label: `Notes (${selectedCandidate.notes?.length || 0})` },
                      { id: 'interview', label: 'Schedule Interview' },
                      { id: 'timeline', label: 'Activity' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </SheetHeader>

              {/* TAB 1: OVERVIEW & VIDEO */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Flowmingo AI Video Player Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-emerald-600" />
                        <span>Flowmingo AI Technical Screening Video</span>
                      </span>
                      <span className="text-[11px] text-neutral-500">Duration: 2:45</span>
                    </div>

                    <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden relative group">
                      <video
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        controls
                        controlsList="nodownload"
                        poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Vetting Rubrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-500">Technical Depth</span>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {selectedCandidate.technical_depth_score}%
                      </p>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${selectedCandidate.technical_depth_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                      <span className="text-[11px] text-neutral-500">Communication Clarity</span>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {selectedCandidate.communication_score}%
                      </p>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${selectedCandidate.communication_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Verified Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.skills.map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Expected Salary:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {selectedCandidate.expected_salary || 'Competitive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Location:</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {selectedCandidate.location || 'Remote'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Applied On:</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {new Date(selectedCandidate.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedCandidate.stage === 'Rejected' && selectedCandidate.rejection_reason && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 text-rose-600 dark:text-rose-400">
                        <span className="font-bold">Rejection Reason: </span>
                        <span>{selectedCandidate.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SCORECARDS & COLLABORATION */}
              {activeTab === 'scorecards' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-neutral-500">Average Team Score</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                        <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {selectedCandidate.scorecards?.length
                            ? (
                                selectedCandidate.scorecards.reduce((acc, s) => acc + s.overall_rating, 0) /
                                selectedCandidate.scorecards.length
                              ).toFixed(1)
                            : 'N/A'}
                        </span>
                        <span className="text-xs text-neutral-400">/ 5.0</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-neutral-500">
                      <span>{selectedCandidate.scorecards?.length || 0} reviews submitted</span>
                    </div>
                  </div>

                  {/* List of submitted scorecards */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Reviewer Feedback
                    </h4>
                    {selectedCandidate.scorecards && selectedCandidate.scorecards.length > 0 ? (
                      selectedCandidate.scorecards.map((sc) => (
                        <div
                          key={sc.id}
                          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 dark:text-white">
                                {sc.interviewer_name}
                              </span>
                              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                {sc.interviewer_role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-500" />
                              <span>{sc.overall_rating} / 5</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] text-neutral-500">
                            <div>Tech: <span className="font-bold text-neutral-900 dark:text-white">{sc.technical_depth}</span></div>
                            <div>Problem: <span className="font-bold text-neutral-900 dark:text-white">{sc.problem_solving}</span></div>
                            <div>Culture: <span className="font-bold text-neutral-900 dark:text-white">{sc.culture_values}</span></div>
                            <div>Comm: <span className="font-bold text-neutral-900 dark:text-white">{sc.communication}</span></div>
                          </div>

                          {sc.notes && (
                            <p className="pt-2 text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800 italic">
                              &ldquo;{sc.notes}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-400 pt-1">
                            Submitted {new Date(sc.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No scorecards submitted yet.</p>
                    )}
                  </div>

                  {/* Add Scorecard Form */}
                  <form
                    onSubmit={handleSubmitScorecard}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>Submit Your Scorecard ({currentUserName})</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-neutral-500">Technical Depth (1-5)</label>
                        <select
                          value={scoreTech}
                          onChange={(e) => setScoreTech(Number(e.target.value))}
                          className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 mt-1"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} Stars</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-500">Problem Solving (1-5)</label>
                        <select
                          value={scoreProblem}
                          onChange={(e) => setScoreProblem(Number(e.target.value))}
                          className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 mt-1"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} Stars</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-500">Culture & Values (1-5)</label>
                        <select
                          value={scoreCulture}
                          onChange={(e) => setScoreCulture(Number(e.target.value))}
                          className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 mt-1"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} Stars</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-500">Communication (1-5)</label>
                        <select
                          value={scoreComm}
                          onChange={(e) => setScoreComm(Number(e.target.value))}
                          className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 mt-1"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} Stars</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-500">Evaluation Notes & Justification</label>
                      <Textarea
                        value={scoreNotes}
                        onChange={(e) => setScoreNotes(e.target.value)}
                        placeholder="Detail candidate problem-solving nuances and hire recommendation..."
                        className="text-xs min-h-[70px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="w-full text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
                    >
                      Save & Broadcast Scorecard
                    </Button>
                  </form>
                </div>
              )}

              {/* TAB 3: INTERNAL NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add an internal note visible only to your hiring team..."
                      className="text-xs min-h-[80px]"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Post Internal Note</span>
                    </Button>
                  </form>

                  <div className="space-y-2.5 pt-2">
                    {selectedCandidate.notes && selectedCandidate.notes.length > 0 ? (
                      selectedCandidate.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 dark:text-white">
                              {note.author_name} ({note.author_role})
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                            {note.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No notes posted yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: INTERVIEW SCHEDULING */}
              {activeTab === 'interview' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Automated Calendar Dispatch</p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                        Scheduling generates an .ics calendar invite for Google Calendar, Outlook, and Apple Calendar, and moves candidate to Interviewing.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleScheduleInterview} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Interview Date & Time <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Duration
                        </label>
                        <select
                          value={interviewDuration}
                          onChange={(e) => setInterviewDuration(e.target.value)}
                          className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2"
                        >
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">60 minutes</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Meeting Link
                        </label>
                        <Input
                          type="url"
                          value={interviewLink}
                          onChange={(e) => setInterviewLink(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Agenda & Meeting Notes
                      </label>
                      <Textarea
                        value={interviewNotes}
                        onChange={(e) => setInterviewNotes(e.target.value)}
                        className="text-xs min-h-[60px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Confirm & Send Calendar Invite</span>
                    </Button>
                  </form>

                  {/* Existing scheduled interviews */}
                  {selectedCandidate.scheduled_interviews && selectedCandidate.scheduled_interviews.length > 0 && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        Scheduled Sessions
                      </h4>
                      {selectedCandidate.scheduled_interviews.map((int) => (
                        <div
                          key={int.id}
                          className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 dark:text-white">
                              {new Date(int.scheduled_at).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {int.duration_minutes} mins
                            </Badge>
                          </div>
                          <p className="text-neutral-500">{int.notes}</p>
                          <a
                            href={int.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold underline flex items-center gap-1"
                          >
                            <span>Open Meeting Room</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ACTIVITY TIMELINE & STAGE HISTORY */}
              {activeTab === 'timeline' && (
                <div className="space-y-4 text-xs">
                  <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px]">
                    Chronological Activity Trail
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                    {selectedCandidate.stage_history && selectedCandidate.stage_history.length > 0 ? (
                      selectedCandidate.stage_history.map((hist, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-neutral-900 dark:bg-white ring-4 ring-white dark:ring-neutral-950" />
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            Stage transitioned: {hist.from_stage} → {hist.to_stage}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            By {hist.moved_by} · {new Date(hist.moved_at).toLocaleString()}
                          </p>
                          {hist.reason && (
                            <p className="p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300">
                              Reason: {hist.reason}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-neutral-400 italic">No stage history recorded yet.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
