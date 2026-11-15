'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Columns3, X } from 'lucide-react';
import { SyncFlowBoard } from './syncflow-board';
import { getLocalTrackerItems } from '@/lib/tracker';
import { cn } from '@/lib/utils';

export function SyncFlowDrawer() {
  const [open, setOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCount = () => {
      try {
        const items = getLocalTrackerItems();
        setTotalCount(items.length);
      } catch {}
    };

    updateCount();
    window.addEventListener('sync730_tracker_updated', updateCount);
    return () => window.removeEventListener('sync730_tracker_updated', updateCount);
  }, []);

  // Listen to open event from any button or toast
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('sync730_open_syncflow', handleOpen);
    return () => window.removeEventListener('sync730_open_syncflow', handleOpen);
  }, []);

  // Handle Esc key to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="syncflow-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container (Right side on desktop, full-screen/bottom on mobile) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-2xl bg-background border-l border-border shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                <Columns3 className="h-4 w-4 stroke-[2]" />
              </span>
              <h2
                id="syncflow-drawer-title"
                className="text-base font-bold text-neutral-950 dark:text-white flex items-center gap-2"
              >
                <span>SyncFlow</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold tabular-nums">
                  {totalCount}
                </span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close SyncFlow drawer"
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <X className="h-5 w-5 stroke-[2]" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SyncFlowBoard layout="drawer" onClose={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
