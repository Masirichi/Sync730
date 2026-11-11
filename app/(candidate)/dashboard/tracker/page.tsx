'use client';

import { useState, useEffect } from 'react';
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
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Trash2,
  Edit3,
  Search,
  Compass,
  Video,
} from 'lucide-react';
import { CandidateTrackerItem, TrackerStatus } from '@/lib/supabase/types';
import {
  getLocalTrackerItems,
  saveLocalTrackerItems,
  updateTrackerStatus,
  addExternalTrackerJob,
} from '@/lib/tracker';
import { toast } from 'sonner';

const COLUMNS: { id: TrackerStatus; label: string; color: string; badgeColor: string }[] = [
  { id: 'SAVED', label: 'Saved', color: 'border-t-neutral-400', badgeColor: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
  { id: 'APPLIED', label: 'Applied', color: 'border-t-neutral-600', badgeColor: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200' },
  { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-t-neutral-800 dark:border-t-neutral-400', badgeColor: 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100' },
  { id: 'OFFERED', label: 'Offered', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { id: 'REJECTED', label: 'Rejected', color: 'border-t-neutral-300 dark:border-t-neutral-700', badgeColor: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400' },
];

export default function KanbanTrackerPage() {
  const [items, setItems] = useState<CandidateTrackerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotesItem, setEditingNotesItem] = useState<CandidateTrackerItem | null>(null);
  const [notesText, setNotesText] = useState('');

  // Form state for external job modal
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newSalary, setNewSalary] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newStatus, setNewStatus] = useState<TrackerStatus>('SAVED');

  // Load tracker items on mount & listen to updates
  useEffect(() => {
    setItems(getLocalTrackerItems());

    const handleUpdate = () => {
      setItems(getLocalTrackerItems());
    };

    window.addEventListener('sync730_tracker_updated', handleUpdate);
    return () => window.removeEventListener('sync730_tracker_updated', handleUpdate);
  }, []);

  // Move item between columns
  const handleMove = async (item: CandidateTrackerItem, direction: 'prev' | 'next') => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === item.status);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;

    const targetStatus = COLUMNS[targetIndex].id;
    const updated = await updateTrackerStatus(item.id, targetStatus);
    setItems(updated);
    toast.success(`Moved to ${COLUMNS[targetIndex].label}`);
  };

  // Delete item
  const handleDelete = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    saveLocalTrackerItems(updated);
    setItems(updated);
    toast.info('Job removed from tracker.');
  };

  // Save edited notes
  const handleSaveNotes = () => {
    if (!editingNotesItem) return;
    const updated = items.map((i) =>
      i.id === editingNotesItem.id ? { ...i, notes: notesText } : i
    );
    saveLocalTrackerItems(updated);
    setItems(updated);
    setEditingNotesItem(null);
    toast.success('Notes updated.');
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
      location: newLocation.trim(),
      salary: newSalary.trim(),
      url: newUrl.trim(),
      notes: newNotes.trim(),
      status: newStatus,
    });

    setItems((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewCompany('');
    setNewSalary('');
    setNewUrl('');
    setNewNotes('');
    setNewStatus('SAVED');

    toast.success(`Job "${newItem.title}" added to ${newItem.status}`);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.company.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Track and advance jobs from the Verified Remote Feed and external opportunities across your pipeline.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/crawler">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 font-medium border-neutral-200 dark:border-neutral-800">
              <Compass className="h-3.5 w-3.5 stroke-[1.5]" /> Browse Remote Feed
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs h-9 font-semibold bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
          >
            <Plus className="h-4 w-4 stroke-[1.5]" /> Add External Job
          </Button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5] text-neutral-400" />
          <Input
            placeholder="Search tracked jobs or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm border-neutral-200 dark:border-neutral-800"
          />
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
          <span>
            Total Tracked: <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{items.length}</strong>
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

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {COLUMNS.map((col, colIdx) => {
          const colItems = filteredItems.filter((i) => i.status === col.id);

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
                  <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center text-xs text-neutral-400">
                    No jobs in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colItems.map((item) => (
                    <Card
                      key={item.id}
                      className="group border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-none rounded-lg"
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Company & Delete Button */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate max-w-[170px]">
                            {item.company}
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-0.5 rounded"
                            title="Remove from tracker"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                          {item.title}
                        </h4>

                        {/* Metadata */}
                        {(item.location || item.salary) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            {item.location && <span>{item.location}</span>}
                            {item.location && item.salary && <span>·</span>}
                            {item.salary && <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.salary}</span>}
                          </div>
                        )}

                        {/* Notes Snippet */}
                        {item.notes && (
                          <div
                            onClick={() => {
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }}
                            className="rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors line-clamp-2"
                            title="Click to edit notes"
                          >
                            {item.notes}
                          </div>
                        )}

                        {/* Interviewing Sandbox Upsell Button */}
                        {col.id === 'INTERVIEWING' && (
                          <div className="pt-1">
                            <Link
                              href={`/dashboard/sandbox?role=${encodeURIComponent(item.title)}&company=${encodeURIComponent(item.company)}`}
                              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-[11px] font-medium transition-all shadow-sm"
                            >
                              <Video className="h-3.5 w-3.5 stroke-[1.5]" />
                              <span>Practice Interview (₦2,500)</span>
                              <ArrowUpRight className="h-3 w-3 stroke-[1.5] opacity-75" />
                            </Link>
                          </div>
                        )}

                        {/* Card Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                          {/* Notes Button */}
                          <button
                            onClick={() => {
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }}
                            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                          >
                            <Edit3 className="h-3 w-3 stroke-[1.5]" /> Notes
                          </button>

                          {/* Link to Job */}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[11px] text-neutral-700 dark:text-neutral-300 hover:underline font-medium"
                            >
                              Direct Link <ArrowUpRight className="h-3 w-3 stroke-[1.5]" />
                            </a>
                          )}

                          {/* Move Left / Right Chevron Controls */}
                          <div className="flex items-center gap-1">
                            {colIdx > 0 && (
                              <button
                                onClick={() => handleMove(item, 'prev')}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                title={`Move back to ${COLUMNS[colIdx - 1].label}`}
                              >
                                <ArrowLeft className="h-3 w-3 stroke-[1.5]" />
                              </button>
                            )}
                            {colIdx < COLUMNS.length - 1 && (
                              <button
                                onClick={() => handleMove(item, 'next')}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                title={`Advance to ${COLUMNS[colIdx + 1].label}`}
                              >
                                <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                              </button>
                            )}
                          </div>
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

      {/* Modal: Add External Job */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md border-neutral-200 dark:border-neutral-800">
          <form onSubmit={handleAddExternalJob}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Add External Job Application
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Log opportunities found on company career portals or personal outreach into your tracker.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">Job Title *</label>
                <Input
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">Company Name *</label>
                <Input
                  required
                  placeholder="e.g. Stripe, Paystack, Google"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200">Location</label>
                  <Input
                    placeholder="e.g. Worldwide / EMEA / Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="border-neutral-200 dark:border-neutral-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200">Salary / Compensation</label>
                  <Input
                    placeholder="e.g. $120k / Competitive"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="border-neutral-200 dark:border-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">Job Post URL</label>
                <Input
                  placeholder="https://..."
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">Initial Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TrackerStatus)}
                  className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-background px-3 py-2 text-xs"
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 dark:text-neutral-200">Custom Notes</label>
                <Textarea
                  placeholder="e.g. Applied via referral, follow up next Tuesday..."
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="border-neutral-200 dark:border-neutral-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-xs font-semibold"
              >
                Save to Tracker
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Notes */}
      <Dialog
        open={Boolean(editingNotesItem)}
        onOpenChange={(open) => !open && setEditingNotesItem(null)}
      >
        <DialogContent className="sm:max-w-md border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Notes: {editingNotesItem?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {editingNotesItem?.company} · {editingNotesItem?.status}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              rows={4}
              placeholder="Add interview notes, recruiter contacts, or reminder dates..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="text-xs border-neutral-200 dark:border-neutral-800"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingNotesItem(null)}
              className="border-neutral-200 dark:border-neutral-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNotes}
              className="bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 text-xs font-semibold"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
