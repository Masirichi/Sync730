'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Trash2,
  Edit3,
  Search,
  Compass,
  Video,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { ResumeGeneratorModal, TargetJobContext } from '@/components/resume/resume-generator-modal';
import { VetOnceTriggerModal } from '@/components/candidate/vet-once-trigger-modal';
import { CandidateTrackerItem, TrackerStatus, TrackerJobType, TrackerRatePeriod } from '@/lib/supabase/types';
import {
  getLocalTrackerItems,
  saveLocalTrackerItems,
  updateTrackerStatus,
  updateTrackerItem,
  addExternalTrackerJob,
} from '@/lib/tracker';
import { toast } from 'sonner';

const COLUMNS: { id: TrackerStatus; label: string; color: string; badgeColor: string }[] = [
  { id: 'SAVED', label: 'Saved', color: 'border-t-neutral-400', badgeColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
  { id: 'APPLIED', label: 'Applied', color: 'border-t-neutral-600', badgeColor: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200' },
  { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-t-neutral-800 dark:border-t-neutral-400', badgeColor: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100' },
  { id: 'OFFER', label: 'Offer', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
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

export default function SyncFlowPage() {
  const [items, setItems] = useState<CandidateTrackerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CandidateTrackerItem | null>(null);
  const [isVideoProfileOpen, setIsVideoProfileOpen] = useState(false);

  // Form state for Add External Job modal
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStatus, setNewStatus] = useState<TrackerStatus>('SAVED');
  const [newJobType, setNewJobType] = useState<string>('Full-time');
  const [newAppliedDate, setNewAppliedDate] = useState('');
  const [newInterviewDate, setNewInterviewDate] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newRatePeriod, setNewRatePeriod] = useState<TrackerRatePeriod>('monthly');
  const [newContact, setNewContact] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Form state for Edit Job modal
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

  // Load tracker items on mount & listen to updates
  useEffect(() => {
    setItems(getLocalTrackerItems());

    const handleUpdate = () => {
      setItems(getLocalTrackerItems());
    };

    window.addEventListener('sync730_tracker_updated', handleUpdate);
    return () => window.removeEventListener('sync730_tracker_updated', handleUpdate);
  }, []);

  // Update card status via dropdown
  const handleStatusChange = async (itemId: string, selectedValue: string) => {
    if (selectedValue === 'REMOVE') {
      handleDelete(itemId);
      return;
    }
    const newStatus = selectedValue as TrackerStatus;
    const colMatch = COLUMNS.find((c) => c.id === newStatus);
    const updated = await updateTrackerStatus(itemId, newStatus);
    setItems(updated);
    toast.success(`Moved to ${colMatch?.label || newStatus}`);
  };

  // Delete item
  const handleDelete = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    saveLocalTrackerItems(updated);
    setItems(updated);
    toast.info('Job removed from SyncFlow.');
  };

  // Open Edit Modal
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

  // Save edited role details
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

  // Add External Job
  const handleAddExternalJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) {
      toast.error('Job title and company name are required.');
      return;
    }

    const newItem = await addExternalTrackerJob({
      title: newTitle.trim(),
      company: newCompany.trim(),
      status: newStatus,
      job_type: newJobType,
      applied_date: newAppliedDate ? new Date(newAppliedDate).toISOString() : null,
      interview_date: newInterviewDate ? new Date(newInterviewDate).toISOString() : null,
      rate: newRate.trim() || null,
      rate_period: newRatePeriod,
      contact: newContact.trim() || null,
      location: newLocation.trim() || 'Remote',
      salary: newRate.trim() || null,
      url: newUrl.trim() || null,
      notes: newNotes.trim() || 'Added from external application',
    });

    setItems((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewCompany('');
    setNewStatus('SAVED');
    setNewJobType('Full-time');
    setNewAppliedDate('');
    setNewInterviewDate('');
    setNewRate('');
    setNewRatePeriod('monthly');
    setNewContact('');
    setNewLocation('Remote');
    setNewUrl('');
    setNewNotes('');

    const col = COLUMNS.find((c) => c.id === newItem.status);
    toast.success(`Job "${newItem.title}" added to ${col?.label || newItem.status}`);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      (item.job_type && item.job_type.toLowerCase().includes(q)) ||
      (item.contact && item.contact.toLowerCase().includes(q)) ||
      (item.rate && item.rate.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header showing live count SyncFlow (X) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>SyncFlow ({items.length})</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Your private job pipeline. Move roles from Saved to Offer as you progress.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVideoProfileOpen(true)}
            className="gap-1.5 text-xs h-9 min-h-[44px] font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15"
          >
            <Video className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>One profile, every application</span>
          </Button>
          <Link href="/find-work">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 min-h-[44px] font-medium border-neutral-200 dark:border-neutral-800">
              <Compass className="h-3.5 w-3.5 stroke-[1.5]" /> Browse Roles
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs h-9 min-h-[44px] font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
          >
            <Plus className="h-4 w-4 stroke-[1.5]" /> Add External Role
          </Button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5] text-neutral-400" />
          <Input
            placeholder="Search role, company, job type, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            aria-label="Search saved roles or notes"
            className="pl-9 text-base sm:text-sm min-h-[44px] h-11 border-neutral-200 dark:border-neutral-800"
          />
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
          <span>
            Total Roles: <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{items.length}</strong>
          </span>
          <span>·</span>
          <span>
            Active Pipeline:{' '}
            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {items.filter((i) => i.status === 'APPLIED' || i.status === 'INTERVIEWING').length}
            </strong>
          </span>
        </div>
      </div>

      {/* Empty Board State */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-12 text-center">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Nothing here yet. Tap the bookmark on any role to save it.
          </p>
          <div className="mt-4">
            <Link
              href="/find-work"
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-full bg-neutral-950 dark:bg-white px-5 text-xs font-semibold text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Browse roles
            </Link>
          </div>
        </div>
      ) : (
        /* 4-Column SyncFlow Board */
        <div
          tabIndex={0}
          role="region"
          aria-label="SyncFlow pipeline columns"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start overflow-x-auto pb-4 focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded-xl"
        >
          {COLUMNS.map((col) => {
            const colItems = filteredItems.filter(
              (i) => i.status === col.id || (col.id === 'OFFER' && (i.status as string) === 'OFFERED')
            );

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-3 min-w-[260px] border-t-2 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      {col.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.badgeColor}`}>
                      {colItems.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[350px]">
                  {colItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                      No roles
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <Card
                        key={item.id}
                        className="group border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-none rounded-lg"
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          {/* Company & Action Icons */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider truncate max-w-[170px]">
                              {item.company}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1 rounded"
                                title="Edit role details"
                                aria-label={`Edit ${item.title}`}
                              >
                                <Edit3 className="h-3.5 w-3.5 stroke-[1.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded"
                                title="Remove from SyncFlow"
                                aria-label={`Remove ${item.title} from SyncFlow`}
                              >
                                <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                              </button>
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
                          <div className="space-y-1.5 text-xs pt-0.5">
                            {/* Date Applied */}
                            {item.applied_date && (
                              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 text-[11px]">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">Applied:</span>
                                <span>{formatDate(item.applied_date)}</span>
                              </div>
                            )}

                            {/* Interview Date (Prominently Highlighted) */}
                            {item.interview_date && (
                              <div className="flex items-center gap-1.5 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 px-2.5 py-1 text-[11px] text-sky-800 dark:text-sky-200 font-medium">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
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

                          {/* Notes Field (Clickable to open Edit Dialog) */}
                          <div
                            onClick={() => handleOpenEdit(item)}
                            className="rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors line-clamp-2"
                            title="Click to edit role details"
                          >
                            {item.notes ? (
                              <span>{item.notes}</span>
                            ) : (
                              <span className="italic text-neutral-400 flex items-center gap-1">
                                <Edit3 className="h-3 w-3" /> Add notes or edit details...
                              </span>
                            )}
                          </div>

                          {/* Interviewing Sandbox Practice Button */}
                          {col.id === 'INTERVIEWING' && (
                            <div className="pt-1">
                              <Link
                                href={`/dashboard/coach?role=${encodeURIComponent(item.title)}&company=${encodeURIComponent(item.company)}`}
                                className="flex items-center justify-center gap-1.5 w-full min-h-[44px] py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-semibold transition-all shadow-sm"
                              >
                                <Video className="h-3.5 w-3.5 stroke-[1.5]" />
                                <span>Practice Interview (₦2,500)</span>
                                <ArrowUpRight className="h-3 w-3 stroke-[1.5] opacity-75" />
                              </Link>
                            </div>
                          )}

                          {/* Status Dropdown & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs gap-2">
                            {/* Status Dropdown */}
                            <div className="flex-1 max-w-[130px]">
                              <Select
                                value={item.status === 'OFFERED' ? 'OFFER' : item.status}
                                onValueChange={(val) => handleStatusChange(item.id, val)}
                              >
                                <SelectTrigger aria-label={`Status for ${item.title}`} className="h-9 min-h-[36px] text-xs px-2.5 py-1 border-neutral-200 dark:border-neutral-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COLUMNS.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-base sm:text-sm">
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="REMOVE" className="text-base sm:text-sm text-red-600 focus:text-red-600">
                                    Remove
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Link to Job */}
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Visit posting for ${item.title} in new tab`}
                                className="flex items-center gap-1 min-h-[44px] px-2 text-xs text-neutral-700 dark:text-neutral-300 hover:underline font-medium shrink-0"
                              >
                                Link <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Role Details Modal */}
      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
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
                      placeholder="e.g. Paystack / Stripe"
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
                      Location Tier
                    </label>
                    <Input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Remote / Africa / Worldwide"
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

      {/* Add External Role Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-background">
          <DialogHeader className="px-5 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-background/95 backdrop-blur shrink-0 pr-12 text-left">
            <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Add External Role to SyncFlow
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Save roles you found across other portals to keep all your applications in one place.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddExternalJob} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                      placeholder="e.g. Senior Frontend Engineer"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="text-xs min-h-[44px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Company Name *
                    </label>
                    <Input
                      placeholder="e.g. Paystack / Stripe"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="text-xs min-h-[44px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Stage
                    </label>
                    <select
                      value={newStatus === 'OFFERED' ? 'OFFER' : newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TrackerStatus)}
                      className="w-full text-xs font-medium min-h-[44px] px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Job Type
                    </label>
                    <select
                      value={newJobType}
                      onChange={(e) => setNewJobType(e.target.value)}
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
                      value={newAppliedDate}
                      onChange={(e) => setNewAppliedDate(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Interview Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={newInterviewDate}
                      onChange={(e) => setNewInterviewDate(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Hourly / Monthly Rate
                    </label>
                    <Input
                      placeholder="e.g. $45/hr or $5,000/mo or ₦850k/mo"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Frequency
                    </label>
                    <select
                      value={newRatePeriod}
                      onChange={(e) => setNewRatePeriod(e.target.value as TrackerRatePeriod)}
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
                      placeholder="e.g. Sarah Jenkins (Recruiter) · sarah@company.com"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Location Tier
                    </label>
                    <Input
                      placeholder="Remote / Africa / Worldwide"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Application URL
                    </label>
                    <Input
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="text-xs min-h-[44px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      Notes
                    </label>
                    <Textarea
                      placeholder="Initial thoughts, referral contact, questions to ask..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      rows={2}
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
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs min-h-[44px] px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs min-h-[44px] px-6 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Add to SyncFlow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Profile Modal */}
      <VetOnceTriggerModal
        isOpen={isVideoProfileOpen}
        onClose={() => setIsVideoProfileOpen(false)}
      />
    </div>
  );
}
