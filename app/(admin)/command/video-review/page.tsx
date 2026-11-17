'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Video,
  Flag,
  Check,
  X,
  Search,
  Clock,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  Play,
  Pause,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { formatLagosDateTime } from '@/lib/admin/date';
import { toast } from 'sonner';

type QueueTab = 'PENDING' | 'FLAGGED' | 'RETAKE_REQUESTED' | 'APPROVED' | 'REJECTED';

interface StructuredFlag {
  id: string;
  type: string;
  timestamp_seconds: number;
  timestamp_label: string;
  severity: 'For review';
  description?: string;
}

interface VettingAssessment {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  real_name?: string;
  real_email?: string;
  target_role: string;
  overall_match_score: number;
  interview_score: number;
  resume_match_score: number;
  ai_summary: string;
  secure_video_url: string;
  poster_url?: string;
  duration_seconds?: number;
  proctoring_flags: string[];
  structured_flags: StructuredFlag[];
  status: string;
  moderation_status: 'PENDING' | 'FLAGGED' | 'RETAKE_REQUESTED' | 'APPROVED' | 'REJECTED';
  decision_by?: string | null;
  decision_date?: string | null;
  decision_reason?: string | null;
  ai_recommendation?: 'APPROVED' | 'REJECTED' | 'FLAGGED';
  ai_overridden?: boolean;
  retention_period?: string | null;
  deletion_status?: string | null;
  created_at: string;
  skills?: string[];
  seniority?: string;
  transcript?: Array<{ time: number; timestamp_label: string; text: string }>;
}

function CommandVideoReviewContent() {
  const searchParams = useSearchParams();
  const [assessments, setAssessments] = useState<VettingAssessment[]>([]);
  const [activeTab, setActiveTab] = useState<QueueTab>('FLAGGED');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Decision Dialog state
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    decision: 'APPROVED' | 'RETAKE_REQUESTED' | 'REJECTED' | 'REVOKE';
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    requireReason: boolean;
  }>({
    open: false,
    decision: 'APPROVED',
    title: '',
    description: '',
    actionLabel: '',
    isDestructive: false,
    requireReason: false,
  });

  useEffect(() => {
    document.title = 'Video review | Command Center';
  }, []);

  // Fetch queue from API
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setPermissionDenied(null);
    try {
      const res = await fetch('/api/admin/vetting');
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        setPermissionDenied(errData.error || 'Your role does not have permission to access Video review.');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.assessments)) {
        setAssessments(data.assessments);
      }
    } catch (err) {
      console.warn('Failed to fetch vetting queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Handle URL query parameter ?tab=flagged / ?tab=pending
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const upper = tabParam.toUpperCase();
      if (['PENDING', 'FLAGGED', 'RETAKE_REQUESTED', 'APPROVED', 'REJECTED'].includes(upper)) {
        setActiveTab(upper as QueueTab);
      }
    }
  }, [searchParams]);

  // Filter candidates by tab and search
  const filteredAssessments = assessments.filter((a) => {
    if (a.moderation_status !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (a.candidate_name || a.real_name || '').toLowerCase();
    const role = (a.target_role || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  // Automatically select first candidate in active queue if none selected or selection moved tab
  useEffect(() => {
    if (filteredAssessments.length > 0) {
      if (!selectedId || !filteredAssessments.some((a) => a.id === selectedId)) {
        setSelectedId(filteredAssessments[0].id);
      }
    } else {
      setSelectedId(null);
    }
    setVideoError(null);
  }, [activeTab, filteredAssessments, selectedId]);

  const selectedCandidate = assessments.find((a) => a.id === selectedId) || null;

  // Log video view access server-side whenever a candidate is viewed
  useEffect(() => {
    if (!selectedCandidate) return;
    const candName = selectedCandidate.candidate_name || selectedCandidate.real_name || selectedCandidate.target_role;
    fetch('/api/admin/vetting/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_id: selectedCandidate.id,
        candidate_name: candName,
      }),
    }).catch(() => {});
  }, [selectedCandidate?.id]);

  // Jump video player to flag timestamp
  const handleJumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
      toast.info(`Jumped to ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    }
  };

  // Open Decision Dialog
  const handleOpenDecisionDialog = (decision: 'APPROVED' | 'RETAKE_REQUESTED' | 'REJECTED' | 'REVOKE') => {
    if (!selectedCandidate) return;
    const name = selectedCandidate.candidate_name || selectedCandidate.real_name || 'this candidate';

    if (decision === 'APPROVED') {
      setDecisionModal({
        open: true,
        decision: 'APPROVED',
        title: `Approve video assessment for ${name}?`,
        description: 'Approving confirms this candidate has met identity and rubric integrity standards. Verified scorecards will be published to employers.',
        actionLabel: 'Approve assessment',
        isDestructive: false,
        requireReason: false,
      });
    } else if (decision === 'RETAKE_REQUESTED') {
      setDecisionModal({
        open: true,
        decision: 'RETAKE_REQUESTED',
        title: `Request interview retake for ${name}?`,
        description: 'Candidate will be invited to record a fresh assessment session. The reason provided will be delivered to the candidate alongside an appeal option.',
        actionLabel: 'Request retake',
        isDestructive: false,
        requireReason: true,
      });
    } else if (decision === 'REJECTED') {
      setDecisionModal({
        open: true,
        decision: 'REJECTED',
        title: `Reject video assessment for ${name}?`,
        description: 'Rejecting invalidates this submission. A human must provide a clear constructive reason, which is communicated to the candidate.',
        actionLabel: 'Reject assessment',
        isDestructive: true,
        requireReason: true,
      });
    } else if (decision === 'REVOKE') {
      setDecisionModal({
        open: true,
        decision: 'REVOKE',
        title: `Revoke previous decision for ${name}?`,
        description: 'Revoking will return this candidate back to the review queue for re-evaluation. A reason is required.',
        actionLabel: 'Revoke decision',
        isDestructive: true,
        requireReason: true,
      });
    }
  };

  // Submit Decision
  const handleConfirmDecision = async (reason: string) => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/vetting/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: selectedCandidate.id,
          decision: decisionModal.decision,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Decision recorded as ${decisionModal.decision}.`);
        setDecisionModal((prev) => ({ ...prev, open: false }));
        await fetchQueue();
      } else {
        throw new Error(data.error || 'Failed to submit moderation decision');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error recording decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Shortcuts: A approve, R retake, X reject, J next, K previous
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (selectedCandidate && selectedCandidate.moderation_status !== 'APPROVED') {
          handleOpenDecisionDialog('APPROVED');
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (selectedCandidate) {
          handleOpenDecisionDialog('RETAKE_REQUESTED');
        }
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (selectedCandidate) {
          handleOpenDecisionDialog('REJECTED');
        }
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        // Next candidate in queue
        if (filteredAssessments.length > 0) {
          const currentIdx = filteredAssessments.findIndex((a) => a.id === selectedId);
          if (currentIdx < filteredAssessments.length - 1) {
            setSelectedId(filteredAssessments[currentIdx + 1].id);
          }
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        // Previous candidate in queue
        if (filteredAssessments.length > 0) {
          const currentIdx = filteredAssessments.findIndex((a) => a.id === selectedId);
          if (currentIdx > 0) {
            setSelectedId(filteredAssessments[currentIdx - 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCandidate, filteredAssessments, selectedId]);

  // Queue Counts
  const counts = {
    PENDING: assessments.filter((a) => a.moderation_status === 'PENDING').length,
    FLAGGED: assessments.filter((a) => a.moderation_status === 'FLAGGED').length,
    RETAKE_REQUESTED: assessments.filter((a) => a.moderation_status === 'RETAKE_REQUESTED').length,
    APPROVED: assessments.filter((a) => a.moderation_status === 'APPROVED').length,
    REJECTED: assessments.filter((a) => a.moderation_status === 'REJECTED').length,
  };

  // Integrity Check: Has flags and review is not finished
  const hasFlags = selectedCandidate ? (selectedCandidate.structured_flags?.length > 0 || selectedCandidate.proctoring_flags?.length > 0) : false;
  const isReviewPending = selectedCandidate ? (selectedCandidate.moderation_status === 'FLAGGED' || selectedCandidate.moderation_status === 'PENDING') : false;
  const showScorePending = hasFlags && isReviewPending;

  if (permissionDenied) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-neutral-400">{permissionDenied}</p>
        <div className="pt-2">
          <Button asChild variant="outline" className="border-neutral-800 text-xs text-neutral-300 hover:text-white">
            <a href="/command">Return to Overview</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header: Exactly one h1 and one line of description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-neutral-300 stroke-[1.5]" />
            <span>Video review</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Human-first verification of candidate spoken submissions. Flags guide review; they never score or reject automatically.
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueue}
          disabled={isLoading}
          className="h-9 px-3 text-xs rounded-xl border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
        >
          <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh queue</span>
        </Button>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue with Tabs & Candidate Rows */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[1.5]" />
              <input
                type="text"
                placeholder="Search candidate name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
              />
            </div>

            {/* Queue Tabs with Badges */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {(['FLAGGED', 'PENDING', 'RETAKE_REQUESTED', 'APPROVED', 'REJECTED'] as QueueTab[]).map((tab) => {
                const label = tab === 'FLAGGED'
                  ? 'Flagged'
                  : tab === 'PENDING'
                  ? 'Pending'
                  : tab === 'RETAKE_REQUESTED'
                  ? 'Retake'
                  : tab === 'APPROVED'
                  ? 'Approved'
                  : 'Rejected';
                const count = counts[tab];
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                        isActive
                          ? 'bg-neutral-700 text-white'
                          : 'bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Candidate Queue Rows */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredAssessments.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 rounded-xl border border-dashed border-neutral-800">
                  No candidates in this queue.
                </div>
              ) : (
                filteredAssessments.map((a) => {
                  const isSelected = a.id === selectedId;
                  const candidateName = a.candidate_name || a.real_name || 'Candidate';
                  const flagCount = a.structured_flags?.length || a.proctoring_flags?.length || 0;
                  const submittedInfo = formatLagosDateTime(a.created_at);

                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-left space-y-1.5 ${
                        isSelected
                          ? 'border-neutral-500 bg-neutral-800/80 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/70 hover:bg-neutral-800/40 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-white text-xs truncate">
                          {candidateName}
                        </div>
                        {flagCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                            <Flag className="h-3 w-3 text-neutral-300 stroke-[1.5]" />
                            <span>{flagCount} for review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-neutral-900 text-neutral-400 shrink-0">
                            <Check className="h-3 w-3 stroke-[2]" />
                            <span>0 flags</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-400 truncate">
                        {a.target_role}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5">
                        <span title={submittedInfo.formatted}>Submitted {submittedInfo.relative}</span>
                        <span className="tabular-nums font-medium text-neutral-400">
                          {a.overall_match_score}% Match
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Candidate Detail Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedCandidate ? (
            <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center text-xs text-neutral-500">
              Select a candidate from the queue to inspect their video recording and rubric evidence.
            </Card>
          ) : (
            <Card className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-sm space-y-5">
              {/* Candidate Header & Decision Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    <span>{selectedCandidate.candidate_name || selectedCandidate.real_name || 'Candidate'}</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{selectedCandidate.target_role}</span>
                  </p>
                </div>

                {/* Decision Actions / Status */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {selectedCandidate.moderation_status === 'APPROVED' ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-white border border-neutral-700">
                        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2]" />
                        <span>
                          Approved by {selectedCandidate.decision_by || 'Admin'},{' '}
                          {formatLagosDateTime(selectedCandidate.decision_date || selectedCandidate.created_at).relative}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('REVOKE')}
                        className="text-xs text-neutral-400 hover:text-white h-8"
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : selectedCandidate.moderation_status === 'REJECTED' ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-900">
                        <X className="h-3.5 w-3.5 stroke-[2]" />
                        <span>Rejected · {selectedCandidate.decision_reason || 'Standards not met'}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('REVOKE')}
                        className="text-xs text-neutral-400 hover:text-white h-8"
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : selectedCandidate.moderation_status === 'RETAKE_REQUESTED' ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        <RotateCcw className="h-3.5 w-3.5 text-neutral-300 stroke-[1.5]" />
                        <span>Retake requested · Reason: {selectedCandidate.decision_reason || 'Audio/Video issue'}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('REVOKE')}
                        className="text-xs text-neutral-400 hover:text-white h-8"
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : (
                    /* Not yet decided: 3 Action Buttons */
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('APPROVED')}
                        className="h-9 px-3.5 text-xs font-semibold bg-white text-neutral-950 hover:bg-neutral-200 rounded-xl"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5 stroke-[2]" />
                        <span>Approve</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('RETAKE_REQUESTED')}
                        className="h-9 px-3 text-xs font-semibold border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white rounded-xl"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
                        <span>Request retake</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog('REJECTED')}
                        className="h-9 px-3 text-xs font-semibold border-red-950 bg-red-950/20 text-red-300 hover:bg-red-950/40 rounded-xl"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5 stroke-[2]" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Player Section (Never a black frame) */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 aspect-video relative overflow-hidden flex items-center justify-center shadow-inner">
                {selectedCandidate.secure_video_url && !videoError ? (
                  <video
                    ref={videoRef}
                    src={selectedCandidate.secure_video_url}
                    poster={selectedCandidate.poster_url || undefined}
                    controls
                    playsInline
                    onError={() => setVideoError('Video file could not be loaded or stream has expired.')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8 text-center space-y-2 max-w-sm">
                    <div className="h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Video unavailable
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {videoError ||
                        (selectedCandidate.status === 'PROCESSING'
                          ? 'Video stream is currently being transcoded and proctored by the pipeline.'
                          : 'No video stream URL attached to this assessment record.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence Timeline Under Player */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-neutral-300 stroke-[1.5]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Evidence timeline ({selectedCandidate.structured_flags?.length || 0})
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 max-w-md italic">
                    Flags can be caused by shared homes, generators, low light or how a person naturally looks and moves. Review before deciding.
                  </p>
                </div>

                {selectedCandidate.structured_flags?.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 py-1">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[2]" />
                    <span>0 proctoring flags logged. Clean ambient review.</span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {selectedCandidate.structured_flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{flag.type}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {flag.severity}
                            </span>
                            <span className="text-[11px] text-neutral-400 tabular-nums">
                              at {flag.timestamp_label}
                            </span>
                          </div>
                          {flag.description && (
                            <p className="text-[11px] text-neutral-400">{flag.description}</p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleJumpToTimestamp(flag.timestamp_seconds)}
                          className="h-8 px-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800"
                        >
                          <Play className="h-3 w-3 mr-1 stroke-[2]" />
                          <span>Jump</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scores: Interview Score & Résumé Match Separately */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Interview Score */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-xs space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                    Interview score
                  </div>
                  {showScorePending ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Score pending review</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-extrabold text-white tabular-nums">
                      {selectedCandidate.interview_score}%
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-500 pt-0.5">
                    Spoken rubric evaluation on architecture, technical depth & communication.
                  </p>
                </div>

                {/* Résumé Match Score */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-xs space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                    Résumé match
                  </div>
                  {showScorePending ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Score pending review</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-extrabold text-white tabular-nums">
                      {selectedCandidate.resume_match_score}%
                    </div>
                  )}
                  <p className="text-[11px] text-neutral-500 pt-0.5">
                    Parsed credential match against employer job specification.
                  </p>
                </div>
              </div>

              {/* Summary and Transcript Tabs */}
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="bg-neutral-950 border border-neutral-800 p-1 rounded-xl h-10">
                  <TabsTrigger value="summary" className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
                    Summary & Rubrics
                  </TabsTrigger>
                  <TabsTrigger value="transcript" className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
                    Transcript ({selectedCandidate.transcript?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="pt-3 space-y-3">
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-neutral-300 leading-relaxed">
                    <div className="font-semibold text-white mb-1">AI Rubric Breakdown</div>
                    {selectedCandidate.ai_summary}
                  </div>

                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedCandidate.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-0.5 rounded-md text-[11px] bg-neutral-800 text-neutral-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Transcript Tab */}
                <TabsContent value="transcript" className="pt-3 space-y-2">
                  {!selectedCandidate.transcript || selectedCandidate.transcript.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500 rounded-xl border border-neutral-800">
                      No timestamped transcript available for this recording.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedCandidate.transcript.map((line, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleJumpToTimestamp(line.time)}
                          className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer text-xs group"
                        >
                          <span className="font-mono text-[11px] text-neutral-400 tabular-nums px-1.5 py-0.5 rounded bg-neutral-900 group-hover:text-white shrink-0">
                            {line.timestamp_label}
                          </span>
                          <p className="text-neutral-300 leading-relaxed">{line.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Access and Privacy Notice */}
              <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-500 gap-1.5">
                <span>Candidate video is personal data. Access logged for audit.</span>
                <span>
                  Retention period: {selectedCandidate.retention_period || 'Not defined yet'} · Deletion: {selectedCandidate.deletion_status || 'Not scheduled'}
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Speed: Keyboard Shortcut Bar Hint */}
      <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-300">Keyboard shortcuts:</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[11px]">A</kbd> Approve</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[11px]">R</kbd> Request retake</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[11px]">X</kbd> Reject</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[11px]">J</kbd> Next</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-white font-mono text-[11px]">K</kbd> Previous</span>
        </div>
        <span className="text-[11px] text-neutral-500">Shortcuts open confirmation dialogs before executing</span>
      </div>

      {/* Confirmation Dialog for All Decision Actions */}
      <ConfirmationDialog
        open={decisionModal.open}
        onOpenChange={(open) => setDecisionModal((prev) => ({ ...prev, open }))}
        title={decisionModal.title}
        description={decisionModal.description}
        actionLabel={decisionModal.actionLabel}
        isDestructive={decisionModal.isDestructive}
        requireReason={decisionModal.requireReason}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDecision}
      />
    </div>
  );
}

export default function CommandVideoReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400 text-xs text-center">Loading Video Review Queue...</div>}>
      <CommandVideoReviewContent />
    </Suspense>
  );
}
