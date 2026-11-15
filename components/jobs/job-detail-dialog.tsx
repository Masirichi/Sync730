'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Check,
  Globe,
  Bookmark,
  Flag,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { PublicJob } from '@/lib/jobs/service';
import { formatSalary, formatEligibility } from '@/lib/jobs/helpers';
import { getCleanFacts } from './job-card';
import { reportJob } from '@/app/actions/report-job';
import { cn } from '@/lib/utils';

export interface JobDetailDialogProps {
  job: PublicJob | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  isSaved?: boolean;
  isApplied?: boolean;
  onBookmarkToggle?: (job: PublicJob) => void;
  onApplyClick?: (job: PublicJob) => void;
}

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatPostedAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `Posted ${diffMins}m ago`;
    }
    if (diffHours < 24) return `Posted ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 30) return `Posted ${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Posted ${diffMonths}mo ago`;
  } catch {
    return 'Posted recently';
  }
}

const REPORT_REASONS = [
  { value: 'Role is closed', label: 'Role is closed or expired' },
  { value: 'Not open to Africa as stated', label: 'Not open to Africa as stated' },
  { value: 'Looks like a scam', label: 'Looks like a scam or fee requested' },
  { value: 'Other', label: 'Other listing issue' },
];

export function JobDetailDialog({
  job,
  isOpen,
  onClose,
  triggerRef,
  isSaved = false,
  isApplied = false,
  onBookmarkToggle,
  onApplyClick,
}: JobDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Report form state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Role is closed');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen || !job) return;

    // Reset report state
    setReportOpen(false);
    setReportSuccess(false);
    setReportError(null);
    setReportNote('');
    setReportReason('Role is closed');

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, job, onClose, triggerRef]);

  if (!isOpen || !job) return null;

  const salaryResult = formatSalary(job);
  const eligibilityResult = formatEligibility(job, 100);
  const facts = getCleanFacts(job);

  const modalityDotColor =
    facts.mode.toLowerCase() === 'remote'
      ? 'bg-emerald-500'
      : facts.mode.toLowerCase() === 'hybrid'
      ? 'bg-sky-500'
      : 'bg-amber-500';

  // Extract "What you'll do" responsibilities
  const responsibilities = Array.isArray(job.responsibilities) && job.responsibilities.length > 0
    ? job.responsibilities
    : [];

  // Full eligibility text for "What we checked"
  let eligibilitySummary = eligibilityResult.label.replace(/^Open to\s+/i, '');
  if (job.eligibility?.timezoneNote) {
    eligibilitySummary += ` (${job.eligibility.timezoneNote})`;
  }

  // Handle report submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportError(null);

    try {
      const res = await reportJob({
        jobId: job.id,
        reason: reportReason,
        note: reportNote,
      });

      if (res.success) {
        setReportSuccess(true);
      } else {
        setReportError(res.error || 'Failed to submit report.');
      }
    } catch {
      setReportError('Network error. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto sm:p-4 md:p-6 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-detail-title"
    >
      {/* Scrim / Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window: Full-screen on mobile, modal centered on desktop */}
      <div
        ref={dialogRef}
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white dark:bg-neutral-900 sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col z-50 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/70 bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-border/70 flex items-center justify-center font-bold text-sm text-neutral-800 dark:text-neutral-200 flex-shrink-0 overflow-hidden">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                getInitials(job.company)
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {job.company}
              </p>
              <Link
                href="/how-we-verify"
                target="_blank"
                title="Role verified: Learn how we verify"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 mt-0.5 hover:underline"
              >
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Role verified</span>
              </Link>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close job details"
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialog Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title & Facts Row */}
          <div className="space-y-3">
            <h2
              id="job-detail-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white leading-tight"
            >
              {job.title}
            </h2>

            {/* Facts Row: Dot-separated facts */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <span
                className={
                  salaryResult.isDisclosed
                    ? 'font-bold text-neutral-950 dark:text-white'
                    : 'font-normal text-neutral-500'
                }
              >
                {salaryResult.formatted}
              </span>
              <span className="text-neutral-400" aria-hidden="true">·</span>

              <span className="inline-flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', modalityDotColor)} aria-hidden="true" />
                <span>{facts.mode}</span>
              </span>
              <span className="text-neutral-400" aria-hidden="true">·</span>

              <span>{facts.location}</span>
              <span className="text-neutral-400" aria-hidden="true">·</span>

              <span>{facts.jobType}</span>
            </div>

            {/* Eligibility Line */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <Globe className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
              <span>{eligibilityResult.label}</span>
            </div>
          </div>

          {/* Role Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              About the role
            </h3>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {job.description || job.summary}
            </p>
          </div>

          {/* "What you'll do" (if available) */}
          {responsibilities.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                What you&apos;ll do
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                {responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All Tags (Skills only) */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Required skills & tools
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-border/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* "What we checked" Checklist */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>What we checked</span>
              </h3>
              <Link
                href="/how-we-verify"
                target="_blank"
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Learn how we verify →
              </Link>
            </div>

            <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Role is live on the employer&apos;s own channel</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Hiring contact confirmed</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Open to applicants in: {eligibilitySummary}</span>
              </div>
            </div>
          </div>

          {/* Posted Date & Standard Disclaimer */}
          <div className="space-y-1.5 pt-2 text-xs text-neutral-500 border-t border-border/60">
            <p>{formatPostedAgo(job.posted_date)}</p>
            <p className="leading-relaxed">
              Sync730 verifies that roles are real and open to Africa. Hiring decisions are made by the employer.
            </p>
          </div>

          {/* "Report this job" link and form */}
          <div className="pt-2">
            {!reportOpen && !reportSuccess && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report this job</span>
              </button>
            )}

            {/* Report Form */}
            {reportOpen && !reportSuccess && (
              <form
                onSubmit={handleReportSubmit}
                className="p-4 rounded-2xl border border-border bg-neutral-50 dark:bg-neutral-800/60 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                    <span>Report this listing</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                  >
                    Cancel
                  </button>
                </div>

                {reportError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{reportError}</span>
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Reason
                  </label>
                  <div className="space-y-1.5">
                    {REPORT_REASONS.map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-2 text-xs text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.value}
                          checked={reportReason === r.value}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-3.5 h-3.5 text-neutral-900"
                        />
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="report-notes" className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Optional note
                  </label>
                  <textarea
                    id="report-notes"
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder="Provide additional details (e.g. broken link or location mismatch)..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-border bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="h-9 px-4 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit report'}
                </button>
              </form>
            )}

            {/* Report Confirmed Feedback */}
            {reportSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Thank you. Your report has been submitted to our talent team.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-border p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onBookmarkToggle && onBookmarkToggle(job)}
            aria-label={`Save to SyncFlow: ${job.title}`}
            aria-pressed={isSaved}
            className="min-h-[44px] min-w-[44px] p-3 rounded-xl border border-border/80 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <Bookmark
              className={cn(
                'w-4 h-4',
                isSaved ? 'fill-neutral-950 dark:fill-white text-neutral-950 dark:text-white' : ''
              )}
            />
          </button>

          {isApplied ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex-1 h-12 px-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2 shadow-none select-none"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" aria-hidden="true" />
              <span>Applied</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApplyClick && onApplyClick(job)}
              className="flex-1 h-12 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs sm:text-sm font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>Apply for this role</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
