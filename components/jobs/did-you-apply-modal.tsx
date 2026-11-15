'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface DidYouApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName?: string;
  onConfirmYes?: () => void;
  onConfirmNo?: () => void;
}

export function DidYouApplyModal({
  isOpen,
  onClose,
  jobTitle,
  companyName = 'the employer',
  onConfirmYes,
  onConfirmNo,
}: DidYouApplyModalProps) {
  const handleYes = () => {
    if (onConfirmYes) onConfirmYes();
    onClose();
  };

  const handleNo = () => {
    if (onConfirmNo) onConfirmNo();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        <DialogHeader className="space-y-2 text-center">
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Did you apply to {jobTitle}?
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-600 dark:text-neutral-400">
            Let us know if you submitted your application on {companyName}’s website so we can update your Job Tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleNo}
            className="flex-1 h-11 text-xs font-semibold border-neutral-200 dark:border-neutral-800"
          >
            Not yet
          </Button>
          <Button
            type="button"
            onClick={handleYes}
            className="flex-1 h-11 text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 active:bg-black"
          >
            Yes, I applied
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
