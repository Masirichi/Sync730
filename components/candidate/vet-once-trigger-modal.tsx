'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface VetOnceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export function VetOnceTriggerModal({ isOpen, onClose, defaultRole = 'Senior Full Stack Engineer (Next.js & Supabase)' }: VetOnceModalProps) {
  const [candidateName, setCandidateName] = useState('Jane Doe');
  const [candidateEmail, setCandidateEmail] = useState('jane.doe@sync730.com');
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompleteVetOnce = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/webhooks/video-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'assessment.completed',
          data: {
            candidate_id: `cand-${Date.now().toString(36)}`,
            candidate_name: candidateName,
            candidate_email: candidateEmail,
            target_role: targetRole,
            overall_match_score: 95,
            technical_depth_score: 96,
            communication_score: 92,
            ai_summary:
              'Demonstrated senior full stack ownership across Next.js 14 App Router, Server Actions, and distributed Supabase architectures. Articulated nuanced tradeoffs with high clarity. Verified 0 proctoring infractions.',
            secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            proctoring_flags: [],
            status: 'COMPLETED',
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCompleted(true);
        toast.success('Vet-Once Video Profile verified and published to Employer Talent Pool!');
      } else {
        throw new Error(data.error || 'Failed to submit assessment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error publishing video assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold mb-2 w-fit">
            <Video className="h-3 w-3 stroke-[1.5]" />
            <span>Flowmingo AI Vet-Once Assessment</span>
          </div>
          <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
            Complete Vet-Once Video Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Submit your standardized 3-question video screening. Once indexed, verified employers can review your rubric scores and unlock your dossier.
          </DialogDescription>
        </DialogHeader>

        {isCompleted ? (
          <div className="py-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Vet-Once Profile Verified & Live!
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Your profile has been indexed in the Sync730 Employer Talent Pool with a 95% Overall Technical Match score.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Candidate:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Target Role:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{targetRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Match Score:</span>
                <span className="font-bold text-emerald-600">95% Overall (Authentic)</span>
              </div>
            </div>
            <Button
              onClick={() => {
                setIsCompleted(false);
                onClose();
              }}
              className="w-full text-xs h-9 bg-neutral-900 text-white rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Candidate Name
              </label>
              <Input
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Candidate Email
              </label>
              <Input
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Target Role
              </label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                <span>Standardized Flowmingo Assessment Rubrics</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Includes 3 timed spoken answers evaluating Next.js architecture, system design concurrency, and STAR communication clarity.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} className="text-xs h-9">
                Cancel
              </Button>
              <Button
                onClick={handleCompleteVetOnce}
                disabled={isSubmitting}
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    <span>Grading & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Publish Vet-Once Video Profile</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
