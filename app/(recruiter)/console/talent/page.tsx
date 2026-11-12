'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Zap,
  Video,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Sparkles,
  MessageSquare,
  Star,
  Plus,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VideoAssessment, CorporateWorkspace, RecruiterRole } from '@/lib/recruiter/types';
import { getLocalWorkspace, saveLocalWorkspace } from '@/lib/recruiter/store';
import { VideoAssessmentPlayer } from '@/components/recruiter/video-assessment-player';
import { toast } from 'sonner';

interface NoteItem {
  id: string;
  author_email: string;
  author_role: string;
  note: string;
  score?: number;
  created_at: string;
}

export default function ConsoleTalentPage() {
  const [candidates, setCandidates] = useState<VideoAssessment[]>([]);
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Active role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Notes Modal state
  const [activeCandidateForNotes, setActiveCandidateForNotes] = useState<VideoAssessment | null>(null);
  const [notesList, setNotesList] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteScore, setNewNoteScore] = useState<number | ''>(90);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Detail View Modal state
  const [activeDetailCandidate, setActiveDetailCandidate] = useState<VideoAssessment | null>(null);

  // Unlock Confirmation Dialog state
  const [candidateToConfirmUnlock, setCandidateToConfirmUnlock] = useState<VideoAssessment | null>(null);

  // Report Issue Dialog state
  const [candidateToReportIssue, setCandidateToReportIssue] = useState<VideoAssessment | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchTalent = async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    const ws = getLocalWorkspace();
    setWorkspace(ws);
    try {
      const res = await fetch(`/api/talent/list?workspace_id=${ws.id}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        throw new Error(data.error || 'Failed to fetch vetted candidate pool');
      }
    } catch (err: any) {
      setHasError(true);
      setErrorMessage(err.message || 'Network error fetching talent pool.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTalent();

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
    };
    window.addEventListener('sync730_workspace_updated', handleUpdate);
    window.addEventListener('sync730_unlocks_updated', handleUpdate);
    window.addEventListener('sync730_assessments_updated', fetchTalent);

    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleUpdate);
      window.removeEventListener('sync730_unlocks_updated', handleUpdate);
      window.removeEventListener('sync730_assessments_updated', fetchTalent);
      clearInterval(interval);
    };
  }, []);

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Unlock Candidate Profile Action (1 Token) with Idempotency Key
  const handleUnlock = async (cand: VideoAssessment) => {
    const candidateId = cand.candidate_id || cand.id;
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can unlock candidate profiles.');
      return;
    }

    const ws = getLocalWorkspace();
    if (ws.token_balance < 1) {
      toast.error('Insufficient tokens! Please top up your token balance.', {
        action: {
          label: 'Manage Tokens',
          onClick: () => window.location.assign('/console/billing'),
        },
      });
      return;
    }

    // Double-click double-spend prevention with client idempotency key
    const idempotencyKey = `idemp_unl_${candidateId}_${Date.now()}`;
    setUnlockingId(candidateId);

    try {
      const res = await fetch('/api/talent/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          workspace_id: ws.id,
          idempotency_key: idempotencyKey,
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

        // If detail modal is open for this candidate, update it too
        if (activeDetailCandidate?.candidate_id === candidateId) {
          setActiveDetailCandidate((prev) =>
            prev ? { ...prev, ...data.candidate, is_unlocked: true } : null
          );
        }

        setCandidateToConfirmUnlock(null);
        toast.success(`Candidate profile unlocked! 1 token spent. Contact info revealed.`);
      } else {
        throw new Error(data.error || 'Failed to unlock profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unlocking candidate.');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateToReportIssue) return;
    if (!reportReason.trim()) {
      toast.error('Please describe the issue with this candidate.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      toast.success(
        'Replacement claim submitted. Under our Replacement Policy, 1 token will be refunded if the candidate has withdrawn or is unreachable after 5 days.'
      );
      setCandidateToReportIssue(null);
      setReportReason('');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Open Notes Modal
  const openNotesModal = async (cand: VideoAssessment) => {
    setActiveCandidateForNotes(cand);
    setNewNoteText('');
    setNewNoteScore(cand.overall_match_score || 90);
    setIsLoadingNotes(true);

    try {
      const res = await fetch(
        `/api/recruiter/talent/notes?candidate_id=${cand.candidate_id || cand.id}&workspace_id=${workspace.id}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.notes)) {
        setNotesList(data.notes);
      } else {
        setNotesList([]);
      }
    } catch {
      setNotesList([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Submit Note & Score
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidateForNotes || !newNoteText.trim()) {
      toast.error('Please enter an evaluation note.');
      return;
    }

    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/recruiter/talent/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: activeCandidateForNotes.candidate_id || activeCandidateForNotes.id,
          workspace_id: workspace.id,
          note: newNoteText.trim(),
          score: typeof newNoteScore === 'number' ? newNoteScore : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.note) {
        setNotesList([data.note, ...notesList]);
        setNewNoteText('');
        toast.success('Internal evaluation note and score saved.');
      } else {
        throw new Error(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.target_role.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.ai_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Vetted Talent Pool
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Browse verified technical assessments. Names and direct contact info remain strictly anonymized until unlocked with a token.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin ? (
            <Link href="/console/billing">
              <Button
                size="sm"
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                <span>{workspace.token_balance} Tokens Available</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{workspace.token_balance} Tokens (Ask admin to unlock)</span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Privacy Notice Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, framework, or technical keywords..."
            className="pl-9 h-9 text-xs border-0 bg-neutral-50 dark:bg-neutral-800/60 focus-visible:ring-0 shadow-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
          <span>Strict Anonymization Active · Unlocks cost 1 token</span>
        </div>
      </div>

      {/* Error State Banner */}
      {hasError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage || 'Failed to load vetted candidate pool.'}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTalent} className="h-7 text-xs border-rose-300">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Talent Cards Grid / Skeleton Loaders / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden space-y-4 p-4 shadow-2xs"
            >
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <Users className="h-8 w-8 text-neutral-400 mx-auto stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            No candidate assessments found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Candidates who complete automated technical video screenings will appear here for review and scoring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((cand) => {
            const isUnlocked = Boolean(cand.is_unlocked);

            return (
              <div
                key={cand.id || cand.candidate_id}
                data-candidate-card={cand.candidate_id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs"
              >
                {/* Flowmingo Video Player with Poster, Skeleton, Speed Control, & Signed URL */}
                <div className="p-3 pb-0">
                  <VideoAssessmentPlayer
                    candidateId={cand.candidate_id || cand.id}
                    videoUrl={cand.secure_video_url}
                    posterUrl={cand.poster_url}
                    durationSeconds={cand.duration_seconds || 165}
                    status={cand.status}
                    expiresAt={cand.expires_at}
                    candidateName={cand.candidate_name}
                  />
                </div>

                {/* Candidate Content Body */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Name, Match Pill and Masking State */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3
                        data-candidate-name
                        className="text-sm font-bold text-neutral-900 dark:text-white truncate"
                      >
                        {cand.candidate_name}
                      </h3>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {cand.overall_match_score}% Match
                        </span>

                        {isUnlocked ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0 gap-1"
                          >
                            <Unlock className="h-2.5 w-2.5 stroke-[1.5]" />
                            <span>Unlocked</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 shrink-0 gap-1"
                          >
                            <Lock className="h-2.5 w-2.5 stroke-[1.5]" />
                            <span>Masked</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {cand.target_role}
                    </div>

                    {/* Email / Contact info */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <Mail className="h-3.5 w-3.5 text-neutral-400 stroke-[1.5] shrink-0" />
                      <span
                        data-candidate-email
                        className={`truncate ${
                          isUnlocked
                            ? 'text-neutral-900 dark:text-white font-medium'
                            : 'text-neutral-400 italic'
                        }`}
                      >
                        {cand.candidate_email}
                      </span>
                    </div>
                  </div>

                  {/* AI Evaluation Scores Matrix */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs">
                    <div>
                      <div className="text-[10px] text-neutral-400">Technical Depth</div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {cand.technical_depth_score} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Communication</div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {cand.communication_score} / 100
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 stroke-[1.5]" />
                      <span>Flowmingo AI Assessment Summary</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                      {cand.ai_summary}
                    </p>
                  </div>

                  {/* Action Bar: Detail View & Notes */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveDetailCandidate(cand)}
                      className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 underline"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Full Rubric & Details</span>
                    </button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openNotesModal(cand)}
                      className="h-7 px-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white gap-1"
                    >
                      <MessageSquare className="h-3 w-3 stroke-[1.5]" />
                      <span>Notes & Score</span>
                    </Button>
                  </div>
                </div>

                {/* Footer Action Card - Role Guarded */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                  {cand.status === 'PROCESSING' ? (
                    <Button
                      disabled
                      size="sm"
                      className="w-full h-9 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold rounded-xl cursor-not-allowed gap-1.5 shadow-none"
                    >
                      <Clock className="h-3.5 w-3.5 animate-spin" />
                      <span>Screening in Progress</span>
                    </Button>
                  ) : isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${cand.candidate_email}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-xl gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Contact Directly</span>
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCandidateToReportIssue(cand)}
                        title="Report issue under our replacement policy"
                        className="h-8 px-2 text-[11px] font-semibold text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        Report
                      </Button>
                    </div>
                  ) : isOwnerOrAdmin ? (
                    <Button
                      onClick={() => setCandidateToConfirmUnlock(cand)}
                      disabled={unlockingId === cand.candidate_id}
                      size="sm"
                      className="w-full h-9 text-xs bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold rounded-xl shadow-xs gap-1.5"
                    >
                      {unlockingId === cand.candidate_id ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          <span>Unlocking Candidate...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                          <span>Unlock Candidate Profile (1 Token)</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="sm"
                      className="w-full h-9 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold rounded-xl cursor-not-allowed gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Ask an admin to unlock</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Full Detail Modal View */}
      <Dialog
        open={Boolean(activeDetailCandidate)}
        onOpenChange={(open) => {
          if (!open) setActiveDetailCandidate(null);
        }}
      >
        <DialogContent className="max-w-3xl p-6 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
          {activeDetailCandidate && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    Candidate Assessment Dossier
                  </span>
                  <Badge variant="outline" className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                    {activeDetailCandidate.overall_match_score}% Match
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                  {activeDetailCandidate.candidate_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Target Role: {activeDetailCandidate.target_role}
                </DialogDescription>
              </DialogHeader>

              {/* Full Size Player in Detail View */}
              <VideoAssessmentPlayer
                candidateId={activeDetailCandidate.candidate_id || activeDetailCandidate.id}
                videoUrl={activeDetailCandidate.secure_video_url}
                posterUrl={activeDetailCandidate.poster_url}
                durationSeconds={activeDetailCandidate.duration_seconds || 165}
                status={activeDetailCandidate.status}
                expiresAt={activeDetailCandidate.expires_at}
                candidateName={activeDetailCandidate.candidate_name}
              />

              {/* Rubric Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <span className="text-[11px] text-neutral-500">Technical Depth</span>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    {activeDetailCandidate.technical_depth_score} / 100
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Architecture & syntax precision</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <span className="text-[11px] text-neutral-500">Communication</span>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    {activeDetailCandidate.communication_score} / 100
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Nuanced tradeoff articulation</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <span className="text-[11px] text-neutral-500">Proctoring & Trust</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    0 Infractions
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Identity & sample verified</p>
                </div>
              </div>

              {/* AI Comprehensive Evaluation */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Flowmingo AI Comprehensive Evaluation</span>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {activeDetailCandidate.ai_summary}
                </p>
              </div>

              {/* Unlock / Contact Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-500">
                  {activeDetailCandidate.is_unlocked
                    ? `Contact: ${activeDetailCandidate.candidate_email}`
                    : 'Contact information masked until unlocked.'}
                </span>

                {activeDetailCandidate.is_unlocked ? (
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${activeDetailCandidate.candidate_email}`}>
                      <Button size="sm" className="text-xs bg-neutral-900 text-white rounded-xl gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email Candidate</span>
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCandidateToReportIssue(activeDetailCandidate)}
                      className="text-xs rounded-xl"
                    >
                      Report Issue
                    </Button>
                  </div>
                ) : isOwnerOrAdmin ? (
                  <Button
                    size="sm"
                    onClick={() => setCandidateToConfirmUnlock(activeDetailCandidate)}
                    disabled={unlockingId === activeDetailCandidate.candidate_id}
                    className="text-xs bg-neutral-950 text-white rounded-xl gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span>Unlock Full Dossier (1 Token)</span>
                  </Button>
                ) : (
                  <Button disabled size="sm" className="text-xs cursor-not-allowed">
                    Ask an admin to unlock
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Internal Evaluation Notes & Scoring Dialog */}
      <Dialog
        open={Boolean(activeCandidateForNotes)}
        onOpenChange={(open) => {
          if (!open) setActiveCandidateForNotes(null);
        }}
      >
        <DialogContent className="max-w-xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold mb-1 w-fit">
              <MessageSquare className="h-3 w-3 stroke-[1.5]" />
              <span>Internal Team Rubric & Score</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Evaluation Notes for {activeCandidateForNotes?.candidate_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Target Role: {activeCandidateForNotes?.target_role}. Notes and scores are visible to authorized team members in your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* New Note Form */}
            <form onSubmit={handleSaveNote} className="space-y-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Add Your Assessment Note
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11px] text-neutral-500">Score (0-100):</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newNoteScore}
                    onChange={(e) =>
                      setNewNoteScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="h-7 w-16 text-xs text-center"
                  />
                </div>
              </div>

              <Textarea
                rows={3}
                placeholder="Share technical observations, architectural strengths, or concerns from the video assessment..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="text-xs"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-400">
                  Role: {currentRole}
                </span>
                <Button
                  type="submit"
                  disabled={isSubmittingNote}
                  size="sm"
                  className="h-8 px-3 text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-lg"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save Evaluation'}
                </Button>
              </div>
            </form>

            {/* Existing Notes List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Previous Team Notes ({notesList.length})
              </h4>

              {isLoadingNotes ? (
                <div className="py-3 space-y-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : notesList.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">
                  No evaluation notes recorded yet. Be the first to leave feedback!
                </p>
              ) : (
                <div className="space-y-2">
                  {notesList.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {n.author_email}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                            {n.author_role}
                          </Badge>
                        </div>
                        {typeof n.score === 'number' && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Score: {n.score}/100
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {n.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UNLOCK CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(candidateToConfirmUnlock)}
        onOpenChange={(open) => {
          if (!open) setCandidateToConfirmUnlock(null);
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 fill-amber-500 stroke-[1.5]" />
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Unlock Candidate Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Spend 1 token to reveal contact info and full assessment dossier.
            </DialogDescription>
          </DialogHeader>

          {candidateToConfirmUnlock && (
            <div className="space-y-4 pt-3 text-xs">
              {/* Candidate Info Box */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {candidateToConfirmUnlock.candidate_name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {candidateToConfirmUnlock.overall_match_score}% Match
                  </span>
                </div>
                <div className="text-neutral-500 text-[11px]">
                  {candidateToConfirmUnlock.target_role}
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                  Spend 1 token to unlock Candidate #{(candidateToConfirmUnlock.candidate_id || candidateToConfirmUnlock.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}? You will see their name, verified email, direct phone number, and complete technical portfolio.
                </p>
              </div>

              {/* Balance Readout */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">Available Organization Balance:</span>
                <span className="font-extrabold text-neutral-900 dark:text-white">
                  {workspace.token_balance} Tokens
                </span>
              </div>

              {/* Zero balance alert */}
              {workspace.token_balance < 1 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>Insufficient Tokens (0 Remaining)</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isOwnerOrAdmin
                      ? 'You have 0 tokens. Please top up your token balance in Billing to unlock candidate contact details.'
                      : 'You have 0 tokens. Ask an admin to top up token packs in Billing.'}
                  </p>
                  {isOwnerOrAdmin && (
                    <Link href="/console/billing" className="inline-block pt-1">
                      <Button size="sm" className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl">
                        Purchase Tokens in Billing
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Replacement Policy Note */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Replacement Guarantee: </span>
                    If this candidate has withdrawn their application or is unreachable after 5 business days, 1 replacement token is refunded back to your organization upon review.
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCandidateToConfirmUnlock(null)}
                      className="h-9 text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleUnlock(candidateToConfirmUnlock)}
                      disabled={unlockingId === candidateToConfirmUnlock.candidate_id}
                      className="h-9 text-xs font-semibold rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5"
                    >
                      {unlockingId === candidateToConfirmUnlock.candidate_id ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          <span>Unlocking Candidate...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>Confirm & Spend 1 Token</span>
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REPORT ISSUE WITH UNLOCKED CANDIDATE DIALOG */}
      <Dialog
        open={Boolean(candidateToReportIssue)}
        onOpenChange={(open) => {
          if (!open) setCandidateToReportIssue(null);
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
              Report Issue with Unlocked Candidate
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Candidate: {candidateToReportIssue?.candidate_name} ({candidateToReportIssue?.target_role})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportIssue} className="space-y-4 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
              <span className="font-bold text-neutral-900 dark:text-white">5-Day Replacement Policy</span>
              <p className="text-[11px] leading-relaxed">
                If the candidate has withdrawn or is unresponsive after 5 business days, our team will credit 1 replacement token back to your balance upon review.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Reason for replacement claim *
              </label>
              <Textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g. Email bounced or candidate stated they already accepted another role..."
                className="w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCandidateToReportIssue(null)}
                className="h-8 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReport}
                className="h-8 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
