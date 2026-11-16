'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Check,
  Columns3,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  Edit3,
} from 'lucide-react';
import { CandidateTrackerItem, TrackerStatus, TrackerJobType, TrackerRatePeriod } from '@/lib/supabase/types';
import {
  getLocalTrackerItems,
  saveLocalTrackerItems,
  updateTrackerStatus,
  updateTrackerItem,
  removeJobFromTracker,
} from '@/lib/tracker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const JOB_TYPES: TrackerJobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const hasTime = dateStr.includes('T') || dateStr.includes(':');
  if (hasTime) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SyncFlowBoard({ layout = 'page', onClose, className }: SyncFlowBoardProps) {
  const [items, setItems] = useState<CandidateTrackerItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Edit Role Modal State
  const [editingItem, setEditingItem] = useState<CandidateTrackerItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editStatus, setEditStatus] = useState<TrackerStatus>('SAVED');
  const [editJobType, setEditJobType] = useState<string>('Full-time');
  const [editAppliedDate, setEditAppliedDate] = useState('');
  const [editInterviewDate, setEditInterviewDate] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editRatePeriod, setEditRatePeriod] = useState<TrackerRatePeriod>('monthly');
  const [editContact, setEditContact] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  const handleOpenEdit = (item: CandidateTrackerItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditCompany(item.company || '');
    setEditStatus((item.status === 'OFFERED' ? 'OFFER' : item.status) || 'SAVED');
    setEditJobType(item.job_type || 'Full-time');
    setEditAppliedDate(item.applied_date ? item.applied_date.substring(0, 10) : '');
    setEditInterviewDate(item.interview_date ? item.interview_date.substring(0, 16) : '');
    setEditRate(item.rate || item.salary || '');
    setEditRatePeriod(item.rate_period || 'monthly');
    setEditContact(item.contact || '');
    setEditLocation(item.location || '');
    setEditUrl(item.url || '');
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editTitle.trim() || !editCompany.trim()) {
      toast.error('Job title and company name are required.');
      return;
    }

    const updates: Partial<CandidateTrackerItem> = {
      title: editTitle.trim(),
      company: editCompany.trim(),
      status: editStatus,
      job_type: editJobType,
      applied_date: editAppliedDate ? new Date(editAppliedDate).toISOString() : null,
      interview_date: editInterviewDate ? new Date(editInterviewDate).toISOString() : null,
      rate: editRate.trim() || null,
      salary: editRate.trim() || editingItem.salary || null,
      rate_period: editRatePeriod,
      contact: editContact.trim() || null,
      location: editLocation.trim() || null,
      url: editUrl.trim() || null,
      notes: editNotes.trim() || null,
    };

    const updated = await updateTrackerItem(editingItem.id, updates);
    setItems(updated);
    setEditingItem(null);
    toast.success('Role details updated.');
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
                          {/* Company & Action Icons */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 truncate max-w-[170px]">
                              {item.company}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                title="Edit role details"
                                aria-label={`Edit ${item.title}`}
                              >
                                <Edit3 className="h-3 w-3 stroke-[1.5]" />
                              </button>

                              {item.url && item.url !== '#' && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open apply link"
                                  aria-label={`Open link for ${item.title}`}
                                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 stroke-[1.5]" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {item.title}
                          </h4>

                          {/* Features: Job Type & Rate Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {item.job_type && (
                              <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                                {item.job_type}
                              </span>
                            )}

                            {(item.rate || item.salary) && (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                {item.rate || item.salary}
                              </span>
                            )}

                            {item.location && !item.job_type && !item.rate && (
                              <span className="text-[11px] text-neutral-500">
                                {item.location}
                              </span>
                            )}
                          </div>

                          {/* Features: Date Applied, Interview Date, Contact */}
                          <div className="space-y-1 text-xs pt-0.5">
                            {/* Date Applied */}
                            {item.applied_date && (
                              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 text-[11px]">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">Applied:</span>
                                <span>{formatDate(item.applied_date)}</span>
                              </div>
                            )}

                            {/* Interview Date (Prominently Highlighted) */}
                            {item.interview_date && (
                              <div className="flex items-center gap-1.5 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 px-2 py-1 text-[11px] text-sky-800 dark:text-sky-200 font-medium">
                                <Calendar className="h-3 w-3 shrink-0 text-sky-600 dark:text-sky-400" />
                                <span>Interview: {formatDateTime(item.interview_date)}</span>
                              </div>
                            )}

                            {/* Contact Details */}
                            {item.contact && (
                              <div className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">Contact: </span>
                                <span>{item.contact}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes snippet */}
                          {item.notes && (
                            <p
                              onClick={() => handleOpenEdit(item)}
                              className="rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors line-clamp-2"
                              title="Click to edit details or notes"
                            >
                              {item.notes}
                            </p>
                          )}

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

      {/* Edit Role Details Modal */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-background">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-background/95 backdrop-blur shrink-0 pr-12 text-left">
            <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Edit Role Details
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Update application status, rates, interview schedule, and contact info for {editingItem?.title || 'this role'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              {/* Group 1: Role Overview */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
                  Role Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Job Title *
                    </label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="text-xs min-h-[44px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Company *
                    </label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="e.g. Stripe / Paystack"
                      className="text-xs min-h-[44px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TrackerStatus)}
                      className="w-full text-xs font-medium min-h-[44px] px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="SAVED">Saved</option>
                      <option value="APPLIED">Applied</option>
                      <option value="INTERVIEWING">Interviewing</option>
                      <option value="OFFER">Offer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Job Type
                    </label>
                    <select
                      value={editJobType}
                      onChange={(e) => setEditJobType(e.target.value)}
                      className="w-full text-xs font-medium min-h-[44px] px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {JOB_TYPES.map((jt) => (
                        <option key={jt} value={jt}>
                          {jt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Timeline & Compensation */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
                  Timeline & Compensation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Date Applied
                    </label>
                    <Input
                      type="date"
                      value={editAppliedDate}
                      onChange={(e) => setEditAppliedDate(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Interview Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={editInterviewDate}
                      onChange={(e) => setEditInterviewDate(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Hourly / Monthly Rate
                    </label>
                    <Input
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      placeholder="e.g. $45/hr or $5,000/mo or ₦850k/mo"
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Frequency
                    </label>
                    <select
                      value={editRatePeriod}
                      onChange={(e) => setEditRatePeriod(e.target.value as TrackerRatePeriod)}
                      className="w-full text-xs font-medium min-h-[44px] px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="hourly">Hourly (/hr)</option>
                      <option value="monthly">Monthly (/mo)</option>
                      <option value="yearly">Yearly (/yr)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 3: Contact & Application Details */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5">
                  Contact & Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Contact (Recruiter / Hiring Lead)
                    </label>
                    <Input
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      placeholder="e.g. Sarah Jenkins (Recruiter) · sarah@company.com"
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Location
                    </label>
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Remote / Lagos / EMEA"
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Application URL
                    </label>
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Notes
                    </label>
                    <Textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Interview questions, portfolio links, team structure..."
                      className="text-xs min-h-[70px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <DialogFooter className="px-5 sm:px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex flex-row items-center justify-between sm:justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="text-xs min-h-[44px] px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs min-h-[44px] px-6 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
