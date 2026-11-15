'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  Columns3,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { CandidateTrackerItem, TrackerStatus } from '@/lib/supabase/types';
import {
  getLocalTrackerItems,
  saveLocalTrackerItems,
  updateTrackerStatus,
  removeJobFromTracker,
} from '@/lib/tracker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface SyncFlowBoardProps {
  layout?: 'drawer' | 'page';
  onClose?: () => void;
  className?: string;
}

const COLUMNS: { id: TrackerStatus; label: string; badge: string; accent: string }[] = [
  { id: 'SAVED', label: 'Saved', badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300', accent: 'border-t-neutral-400' },
  { id: 'APPLIED', label: 'Applied', badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200', accent: 'border-t-neutral-600' },
  { id: 'INTERVIEWING', label: 'Interviewing', badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300', accent: 'border-t-sky-500' },
  { id: 'OFFER', label: 'Offer', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', accent: 'border-t-emerald-500' },
];

export function SyncFlowBoard({ layout = 'page', onClose, className }: SyncFlowBoardProps) {
  const [items, setItems] = useState<CandidateTrackerItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getLocalTrackerItems());

    const handleUpdate = () => {
      setItems(getLocalTrackerItems());
    };

    window.addEventListener('sync730_tracker_updated', handleUpdate);
    return () => window.removeEventListener('sync730_tracker_updated', handleUpdate);
  }, []);

  const handleStatusChange = async (itemId: string, selectedValue: string) => {
    if (selectedValue === 'REMOVE') {
      const target = items.find((i) => i.id === itemId);
      removeJobFromTracker(itemId);
      const updated = items.filter((i) => i.id !== itemId);
      setItems(updated);
      toast('Role removed from SyncFlow', {
        duration: 4500,
      });
      return;
    }

    const newStatus = selectedValue as TrackerStatus;
    const colMatch = COLUMNS.find((c) => c.id === newStatus);
    const updated = await updateTrackerStatus(itemId, newStatus);
    setItems(updated);
    toast(`Moved to ${colMatch?.label || newStatus}`, {
      duration: 4500,
    });
  };

  if (!mounted) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        Loading SyncFlow...
      </div>
    );
  }

  const isEmptyBoard = items.length === 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Intro Text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Your private job pipeline. Move roles from Saved to Offer as you progress.
        </p>

        {layout === 'drawer' && (
          <Link
            href="/dashboard/syncflow"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open full board</span>
            <ExternalLink className="w-3 h-3 stroke-[2]" />
          </Link>
        )}
      </div>

      {/* Empty Board State */}
      {isEmptyBoard ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-neutral-50/50 dark:bg-neutral-900/30 p-10 sm:p-14 text-center">
          <Columns3 className="mx-auto h-8 w-8 text-neutral-400 mb-3 stroke-[1.5]" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nothing here yet. Tap the bookmark on any role to save it.
          </p>
          <div className="mt-5">
            <Link
              href="/find-work"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-full bg-neutral-950 dark:bg-white px-5 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Explore roles
            </Link>
          </div>
        </div>
      ) : (
        /* 4 Columns Board */
        <div
          tabIndex={0}
          role="region"
          aria-label="SyncFlow pipeline columns"
          className={cn(
            'grid gap-4 items-start focus:outline-none',
            layout === 'drawer'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4 overflow-x-auto pb-4'
          )}
        >
          {COLUMNS.map((col) => {
            const colItems = items.filter(
              (i) => i.status === col.id || (col.id === 'OFFER' && (i.status as string) === 'OFFERED')
            );

            return (
              <div
                key={col.id}
                className={cn(
                  'flex flex-col rounded-2xl border border-border/80 bg-neutral-50/60 dark:bg-neutral-900/30 p-3.5 border-t-2',
                  col.accent,
                  layout === 'page' && 'min-w-[260px]'
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {col.label}
                  </span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums', col.badge)}>
                    {colItems.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 min-h-[140px]">
                  {colItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-neutral-500 font-medium">
                      No roles
                    </div>
                  ) : (
                    colItems.map((item) => {
                      const currentSelectValue = item.status === 'OFFERED' ? 'OFFER' : item.status;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-border/70 bg-white dark:bg-neutral-950 shadow-xs space-y-2.5 transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
                        >
                          {/* Company */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 truncate">
                              {item.company}
                            </span>

                            {item.url && item.url !== '#' && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open apply link"
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3 stroke-[2]" />
                              </a>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {item.title}
                          </h4>

                          {/* Status Select with Saved, Applied, Interviewing, Offer, Remove */}
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                            <label htmlFor={`status-select-${item.id}`} className="text-[11px] font-medium text-neutral-500 shrink-0">
                              Stage:
                            </label>

                            <select
                              id={`status-select-${item.id}`}
                              aria-label={`Status for ${item.title}`}
                              value={currentSelectValue}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="text-xs font-medium py-1 px-2 rounded-lg border border-border/80 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors cursor-pointer"
                            >
                              <option value="SAVED">Saved</option>
                              <option value="APPLIED">Applied</option>
                              <option value="INTERVIEWING">Interviewing</option>
                              <option value="OFFER">Offer</option>
                              <option value="REMOVE">Remove</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
