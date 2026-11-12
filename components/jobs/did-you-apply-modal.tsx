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
import { CheckCircle2, HelpCircle } from 'lucide-react';

interface DidYouApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
}

export function DidYouApplyModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  onConfirmYes,
  onConfirmNo,
}: DidYouApplyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        <DialogHeader className="space-y-2 text-center">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Did you apply to {jobTitle}?
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-600 dark:text-neutral-400">
            Let us know if you completed your application on {companyName}’s website so we can update your Job Tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onConfirmNo}
            className="flex-1 h-11 text-xs font-semibold border-neutral-200 dark:border-neutral-800"
          >
            Not yet
          </Button>
          <Button
            type="button"
            onClick={onConfirmYes}
            className="flex-1 h-11 text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 active:bg-black"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
            Yes, I applied
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
