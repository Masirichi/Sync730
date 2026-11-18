'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  isLoading?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  isDestructive = false,
  requireReason = true,
  reasonPlaceholder = 'State the operational reason for this change (minimum 10 characters)...',
  isLoading = false,
  onConfirm,
  children,
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('');
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Reset reason when dialog opens/closes & listen for Escape key
  useEffect(() => {
    if (open) {
      setReason('');
      // Focus Cancel button by default
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onOpenChange(false);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, isLoading, onOpenChange]);

  const trimmedReason = reason.trim();
  const isReasonValid = !requireReason || trimmedReason.length >= 10;

  const handleAction = async () => {
    if (!isReasonValid || isLoading) return;
    await onConfirm(trimmedReason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 p-6 shadow-2xl space-y-4">
        <DialogHeader className="text-left space-y-2">
          <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Custom Form Fields (e.g. Token Direction/Amount or Re-auth Password) */}
        {children && <div className="space-y-3">{children}</div>}

        {/* Reason Input (Mandatory min 10 characters) */}
        {requireReason && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="confirm-reason" className="font-semibold text-neutral-300">
                Reason for change <span className="text-rose-400">*</span>
              </label>
              <span
                className={cn(
                  'text-[11px] font-mono tabular-nums',
                  trimmedReason.length >= 10 ? 'text-emerald-400' : 'text-neutral-500'
                )}
              >
                {trimmedReason.length}/10 chars min
              </span>
            </div>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="text-xs bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-0 resize-none min-h-[76px]"
              aria-required="true"
            />
            {trimmedReason.length > 0 && trimmedReason.length < 10 && (
              <p className="text-[11px] text-amber-400 leading-tight">
                Reason must be at least 10 characters long.
              </p>
            )}
          </div>
        )}

        {/* Sticky Action Footer - Cancel is default focus */}
        <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-10 px-4 text-xs font-semibold rounded-xl border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAction}
            disabled={!isReasonValid || isLoading}
            className={cn(
              'h-10 px-4 text-xs font-semibold rounded-xl transition-all shadow-sm',
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500/40'
                : 'bg-white hover:bg-neutral-200 text-neutral-950 font-bold focus:ring-2 focus:ring-white/40'
            )}
          >
            {isLoading ? 'Processing...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
