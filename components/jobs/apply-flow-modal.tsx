'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ExtendedCandidateProfile } from '@/lib/candidate/profile-store';
import { CheckCircle2, ShieldCheck, User, Briefcase, FileText, Loader2, Sparkles } from 'lucide-react';
import { saveJobToTracker } from '@/lib/tracker';
import { fireJobAnalytics } from '@/lib/analytics/client';

interface ApplyFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string;
    location_rule: string;
    source_type: string;
    [key: string]: any;
  };
  candidateProfile: ExtendedCandidateProfile;
  onSuccess: () => void;
}

export function ApplyFlowModal({
  isOpen,
  onClose,
  job,
  candidateProfile,
  onSuccess,
}: ApplyFlowModalProps) {
  const [coverNote, setCoverNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const charCount = coverNote.length;
  const maxChars = 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please agree to share your verified candidate profile with this employer.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_note: coverNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit application. Please try again.');
        setSubmitting(false);
        return;
      }

      // Add to tracker as APPLIED
      await saveJobToTracker({
        id: job.id,
        title: job.title,
        company: job.company,
        candidate_required_location: job.location_rule,
      });

      // Fire analytics event
      fireJobAnalytics('application_submitted', {
        type: 'employer',
        job_id: job.id,
      });

      setSubmitted(true);
      onSuccess();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        {submitted ? (
          <div className="space-y-5 py-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Application Submitted!
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                Your profile has been delivered directly to <strong className="text-neutral-900 dark:text-white">{job.company}</strong> for <strong className="text-neutral-900 dark:text-white">{job.title}</strong>.
              </p>
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs text-neutral-600 dark:text-neutral-400">
              This job has been added to your <strong className="text-neutral-900 dark:text-white">Job Tracker</strong> as <span className="font-semibold text-emerald-600 dark:text-emerald-400">Applied</span>.
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="w-full h-11 text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800"
            >
              Back to Job
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-md w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply with Sync730</span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Apply to {job.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-600 dark:text-neutral-400">
                Review your profile summary and submit your application to {job.company}.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* Profile Summary Card */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <span>Your Verified Candidate Profile</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Apply-Ready
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {candidateProfile.full_name}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {candidateProfile.role_track} · {candidateProfile.experience_level} · {candidateProfile.country}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {candidateProfile.skills.slice(0, 4).map((s) => (
                  <span
                    key={s.name}
                    className="text-[11px] font-medium px-2 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-800 dark:text-neutral-200"
                  >
                    {s.name}
                  </span>
                ))}
                {candidateProfile.skills.length > 4 && (
                  <span className="text-[11px] text-neutral-500 px-1 py-0.5">
                    +{candidateProfile.skills.length - 4} more
                  </span>
                )}
              </div>
              {candidateProfile.cv_file_name && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 pt-1">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">{candidateProfile.cv_file_name}</span>
                </div>
              )}
            </div>

            {/* Optional Cover Note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="cover-note" className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Cover note (optional)
                </label>
                <span className="text-xs text-neutral-500">
                  {charCount}/{maxChars}
                </span>
              </div>
              <Textarea
                id="cover-note"
                maxLength={maxChars}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Highlight your relevant experience, project accomplishments, or interest in this role..."
                className="text-xs min-h-[90px] resize-none border-neutral-200 dark:border-neutral-800"
              />
            </div>

            {/* Consent Line */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950"
                />
                <span>
                  I understand that <strong className="text-neutral-900 dark:text-white">{job.company}</strong> will receive my full verified profile, work history, and contact details.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 h-11 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 active:bg-black transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
