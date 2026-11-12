'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { MissingItem } from '@/lib/candidate/apply-ready-config';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface FinishProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobSlug: string;
  missingItems: MissingItem[];
  completedSteps: number;
  totalSteps: number;
}

export function FinishProfileModal({
  isOpen,
  onClose,
  jobTitle,
  jobSlug,
  missingItems,
  completedSteps,
  totalSteps,
}: FinishProfileModalProps) {
  const remainingSteps = missingItems.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const returnToUrl = `/jobs/${jobSlug}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-md w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Profile Incomplete</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Finish your profile to apply
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-600 dark:text-neutral-400">
            Sync730 roles require an apply-ready profile. Complete {remainingSteps} remaining {remainingSteps === 1 ? 'step' : 'steps'} to submit your application for <strong className="text-neutral-900 dark:text-white">{jobTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-1.5 py-2">
          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <span>{completedSteps} of {totalSteps} steps completed</span>
            <span>{remainingSteps} {remainingSteps === 1 ? 'step' : 'steps'} left</span>
          </div>
          <Progress value={progressPct} className="h-2 bg-neutral-100 dark:bg-neutral-800" />
        </div>

        {/* Missing Requirements List */}
        <div className="space-y-2.5 my-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Items to complete
          </p>
          <ul className="space-y-2">
            {missingItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                    {item.hint}
                  </p>
                </div>
                <Link
                  href={`${item.link}${item.link.includes('?') ? '&' : '?'}return_to=${encodeURIComponent(returnToUrl)}`}
                  className="flex-shrink-0 text-xs font-semibold text-neutral-900 dark:text-white underline hover:no-underline pt-0.5 inline-flex items-center gap-1"
                >
                  <span>Fix</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 px-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <Link
            href={`/dashboard/profile?return_to=${encodeURIComponent(returnToUrl)}`}
            className="flex-1 h-10 px-4 text-xs font-semibold text-white bg-neutral-950 dark:bg-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 active:bg-black transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
