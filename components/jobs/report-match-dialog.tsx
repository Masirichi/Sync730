// components/jobs/report-match-dialog.tsx
// Dialog allowing candidates to report inaccurate AI match scores.
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ReportMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  currentScore?: number | null;
}

const REPORT_REASONS = [
  'Missing key technical skills required',
  'Seniority level is too high or too low',
  'Salary expectation is not matched',
  'Role is not actually open to my country or timezone',
  'Job description or qualifications seem inaccurate',
  'Other match discrepancy',
];

export function ReportMatchDialog({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  currentScore,
}: ReportMatchDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        const storedReports = JSON.parse(localStorage.getItem('sync730_match_reports') || '[]');
        const report = {
          id: `rep-${Date.now()}`,
          job_id: jobId,
          job_title: jobTitle,
          company: companyName,
          score: currentScore,
          reason: selectedReason,
          comments: comments.trim(),
          reported_at: new Date().toISOString(),
        };
        localStorage.setItem('sync730_match_reports', JSON.stringify([report, ...storedReports]));
      }

      setSubmitted(true);
      toast.success('Thank you. Your feedback helps improve matching accuracy.');
      setTimeout(() => {
        setSubmitted(false);
        setComments('');
        onClose();
      }, 1200);
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-[#0f1015] border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Flag className="h-3.5 w-3.5" />
            <span>AI Match Feedback</span>
          </div>
          <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Report a Bad Match
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            Help us keep AI match scores honest and accurate for {jobTitle} at {companyName}.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Report Recorded
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              We adjust model weights based on candidate reports to improve recommendation quality.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Why is this match score inaccurate?
              </Label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                      selectedReason === reason
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900/80 font-medium text-neutral-900 dark:text-white'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="match_reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="mt-0.5"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Additional Notes (Optional)
              </Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g. Requires 5 years of Rust which is not in my profile or target roles..."
                className="text-xs min-h-[70px] resize-none bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-8 rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
              >
                {isSubmitting ? 'Recording...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
