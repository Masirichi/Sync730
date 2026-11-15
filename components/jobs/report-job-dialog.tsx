// components/jobs/report-job-dialog.tsx
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { fireJobAnalytics } from '@/lib/analytics/client';
import { ReportReason } from '@/lib/jobs/reports-and-alerts';

interface ReportJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  company: string;
  onReportSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'Role is closed',
    label: 'Role is closed or expired',
    description: 'External application page is 404, or the employer has closed hiring.',
  },
  {
    value: 'Not open to Africa as stated',
    label: 'Not open to Africa as stated',
    description: 'Application rejects African applicants or requires work authorization in US/EU.',
  },
  {
    value: 'Looks like a scam',
    label: 'Looks like a scam',
    description: 'Asks for payment, fees, equipment purchase, or impersonates another company.',
  },
  {
    value: 'Other',
    label: 'Other policy issue',
    description: 'Spam, misleading compensation, or breach of listing standards.',
  },
];

export function ReportJobDialog({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  company,
  onReportSuccess,
}: ReportJobDialogProps) {
  const [reason, setReason] = useState<ReportReason>('Role is closed');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          reason,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit report.');
        setIsSubmitting(false);
        return;
      }

      fireJobAnalytics('report_job', { jobId, reason });
      setSubmitted(true);
      if (onReportSuccess) onReportSuccess();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitted(false);
      setDetails('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] p-6 bg-background text-foreground border border-border rounded-2xl shadow-xl">
        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Report received
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Thank you for keeping Sync730 safe. Our moderation team reviews flagged listings promptly. Roles with 3 or more flags are automatically hidden pending review.
            </p>
            <Button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full h-11 text-sm font-semibold bg-foreground text-background rounded-full hover:opacity-90"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Report this job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Flagging <span className="font-medium text-foreground">{jobTitle}</span> at <span className="font-medium text-foreground">{company}</span> for listing review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reason for report
              </Label>
              <RadioGroup
                value={reason}
                onValueChange={(val) => setReason(val as ReportReason)}
                className="space-y-2"
              >
                {REPORT_REASONS.map((r) => (
                  <div
                    key={r.value}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setReason(r.value)}
                  >
                    <RadioGroupItem value={r.value} id={`r-${r.value}`} className="mt-0.5" />
                    <div className="flex-1 text-xs">
                      <Label htmlFor={`r-${r.value}`} className="font-semibold text-foreground cursor-pointer">
                        {r.label}
                      </Label>
                      <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-details" className="text-xs font-medium text-foreground">
                Additional details (optional)
              </Label>
              <Textarea
                id="report-details"
                placeholder="Include link evidence or details for our review team..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                className="text-xs border-border bg-background text-foreground rounded-xl resize-none"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full border-border text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 px-5"
              >
                {isSubmitting ? 'Submitting...' : 'Submit report'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
