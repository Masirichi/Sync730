'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Video,
  Check,
  X,
  Flag,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VettingAssessment {
  id: string;
  candidate_id: string;
  target_role: string;
  overall_match_score: number;
  technical_depth_score: number;
  communication_score: number;
  ai_summary: string;
  secure_video_url: string;
  proctoring_flags: string[];
  status: string;
  moderation_status: 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'PENDING';
  created_at: string;
  candidate_name?: string;
  real_name?: string;
  real_email?: string;
}

export default function CommandVideoReviewPage() {
  const [assessments, setAssessments] = useState<VettingAssessment[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FLAGGED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Video review | Command Center';
  }, []);

  const fetchVettingQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/vetting');
      const data = await res.json();
      if (data.success && Array.isArray(data.assessments)) {
        setAssessments(data.assessments);
      }
    } catch {
      toast.error('Failed to load video review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVettingQueue();
  }, []);

  const handleModerate = async (
    assessmentId: string,
    decision: 'APPROVED' | 'REJECTED' | 'FLAGGED'
  ) => {
    setModeratingId(assessmentId);
    try {
      const res = await fetch('/api/admin/vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          decision,
          notes: decision === 'APPROVED' ? 'Cleared by platform admin' : 'Flagged or rejected following video review',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAssessments((prev) =>
          prev.map((a) => (a.id === assessmentId ? { ...a, moderation_status: decision } : a))
        );
        toast.success(`Assessment marked as ${decision}. Audit log updated.`);
      } else {
        throw new Error(data.error || 'Failed to update moderation state');
      }
    } catch (err: any) {
      toast.error(err.message || 'Moderation error.');
    } finally {
      setModeratingId(null);
    }
  };

  const filteredAssessments = assessments.filter((a) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'FLAGGED') {
      return a.moderation_status === 'FLAGGED' || (a.proctoring_flags && a.proctoring_flags.length > 0 && a.moderation_status !== 'APPROVED');
    }
    return a.moderation_status === activeTab;
  });

  const flaggedCount = assessments.filter(
    (a) => a.proctoring_flags && a.proctoring_flags.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header: Single h1 and single line of description */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Video review
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Standardized technical video assessments, STAR rubrics, and integrity flags.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        {(['ALL', 'FLAGGED', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            {tab}
            {tab === 'FLAGGED' && flaggedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                {flaggedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Assessment Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="h-8 w-8 border-2 border-neutral-400 border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="mt-3 text-xs text-neutral-500">Loading video recordings...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8">
          <ShieldCheck className="h-8 w-8 text-neutral-600 mx-auto stroke-[1.5]" />
          <h3 className="text-sm font-bold text-white mt-3">No assessments in this filter view</h3>
          <p className="text-xs text-neutral-500 mt-1">All video assessments have been moderated or are pending candidate submission.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((cand) => {
            const hasFlags = cand.proctoring_flags && cand.proctoring_flags.length > 0;
            const isApproved = cand.moderation_status === 'APPROVED';
            const isRejected = cand.moderation_status === 'REJECTED';

            return (
              <div
                key={cand.id || cand.candidate_id}
                className={`flex flex-col justify-between rounded-2xl bg-neutral-900 border overflow-hidden shadow-sm transition-all ${
                  hasFlags && !isApproved
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-neutral-800'
                }`}
              >
                {/* Embedded Video Player Header */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                  <video
                    src={cand.secure_video_url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                      <Video className="h-3 w-3 stroke-[1.5] text-neutral-300" />
                      <span>{cand.target_role.split('(')[0]}</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                      {cand.overall_match_score}% Score
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Candidate Identity & Moderation Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {cand.real_name || cand.candidate_name || `Candidate ${cand.id.substring(0, 6)}`}
                      </h4>
                      <p className="text-xs font-semibold text-neutral-300">
                        {cand.target_role}
                      </p>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold uppercase ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isRejected
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {cand.moderation_status}
                    </Badge>
                  </div>

                  {/* Proctoring Flags Section */}
                  {hasFlags ? (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                        <Flag className="h-3.5 w-3.5 shrink-0 stroke-[2px]" />
                        <span>Integrity flags detected ({cand.proctoring_flags.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cand.proctoring_flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                      <Check className="h-3.5 w-3.5 stroke-[2px]" />
                      <span>0 Integrity flags · Clean session verified</span>
                    </div>
                  )}

                  {/* AI Rubric Scores */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400">Technical Depth</span>
                      <p className="font-bold text-white tabular-nums">{cand.technical_depth_score} / 100</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400">Communication</span>
                      <p className="font-bold text-white tabular-nums">{cand.communication_score} / 100</p>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                    {cand.ai_summary}
                  </p>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex items-center gap-2">
                  <Button
                    onClick={() => handleModerate(cand.id, 'APPROVED')}
                    disabled={moderatingId === cand.id || isApproved}
                    size="sm"
                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2px]" />
                    <span>Approve</span>
                  </Button>

                  <Button
                    onClick={() => handleModerate(cand.id, 'REJECTED')}
                    disabled={moderatingId === cand.id || isRejected}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    <X className="h-3.5 w-3.5 stroke-[2px]" />
                    <span>Flag / Reject</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
