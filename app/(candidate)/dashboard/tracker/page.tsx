'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  KanbanSquare,
  Plus,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Search,
  Sparkles,
  Calendar,
  Building,
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
  { id: 'SAVED', label: 'Saved', color: 'border-t-slate-500', badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  { id: 'APPLIED', label: 'Applied', color: 'border-t-blue-500', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-t-purple-500', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { id: 'OFFERED', label: 'Offered', color: 'border-t-emerald-500', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'REJECTED', label: 'Rejected', color: 'border-t-rose-500', badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
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

  // Direct status select
  const handleSelectStatus = async (item: CandidateTrackerItem, targetStatus: TrackerStatus) => {
    if (item.status === targetStatus) return;
    const updated = await updateTrackerStatus(item.id, targetStatus);
    setItems(updated);
    toast.success(`Updated status to ${targetStatus}`);
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

    toast.success(`External job "${newItem.title}" added to ${newItem.status}!`);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Application Tracker</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <KanbanSquare className="h-3 w-3" /> Kanban Board
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and advance jobs from the Verified Remote Feed and external opportunities across your interview pipeline.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/crawler">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Browse Remote Feed
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add External Job
          </Button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracked jobs or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span>
            Total Tracked: <strong className="text-foreground">{items.length}</strong>
          </span>
          <span>•</span>
          <span>
            Active Pipeline:{' '}
            <strong className="text-foreground">
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
              className={`flex flex-col rounded-xl border border-border/80 bg-muted/20 p-3 min-w-[260px] border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${col.badgeColor}`}>
                    {colItems.length}
                  </Badge>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-[350px]">
                {colItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground/70">
                    No jobs in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colItems.map((item) => (
                    <Card
                      key={item.id}
                      className="group border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Company & Delete Button */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate max-w-[170px]">
                            {item.company}
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5 rounded"
                            title="Remove from tracker"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {item.title}
                        </h4>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground/60" />
                              {item.location}
                            </span>
                          )}
                          {item.salary && (
                            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="h-3 w-3" />
                              {item.salary}
                            </span>
                          )}
                        </div>

                        {/* Notes Snippet */}
                        {item.notes && (
                          <div
                            onClick={() => {
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }}
                            className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground/90 italic cursor-pointer hover:bg-muted/70 transition-colors line-clamp-2"
                            title="Click to edit notes"
                          >
                            &ldquo;{item.notes}&rdquo;
                          </div>
                        )}

                        {/* Card Controls */}
                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          {/* Notes Button */}
                          <button
                            onClick={() => {
                              setEditingNotesItem(item);
                              setNotesText(item.notes || '');
                            }}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="h-3 w-3" /> Notes
                          </button>

                          {/* Link to Job */}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                            >
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          )}

                          {/* Move Left / Right Chevron Controls */}
                          <div className="flex items-center gap-1">
                            {colIdx > 0 && (
                              <button
                                onClick={() => handleMove(item, 'prev')}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title={`Move back to ${COLUMNS[colIdx - 1].label}`}
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}
                            {colIdx < COLUMNS.length - 1 && (
                              <button
                                onClick={() => handleMove(item, 'next')}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title={`Advance to ${COLUMNS[colIdx + 1].label}`}
                              >
                                <ArrowRight className="h-3 w-3" />
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
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddExternalJob}>
            <DialogHeader>
              <DialogTitle className="text-lg">Add External Job Application</DialogTitle>
              <DialogDescription className="text-xs">
                Log opportunities found on LinkedIn, company portals, or networks directly into your pipeline.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Job Title *</label>
                <Input
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Company Name *</label>
                <Input
                  required
                  placeholder="e.g. Stripe, Paystack, Google"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Location</label>
                  <Input
                    placeholder="e.g. Worldwide / EMEA / Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Salary / Compensation</label>
                  <Input
                    placeholder="e.g. $120k / Competitive"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Job Post URL</label>
                <Input
                  placeholder="https://..."
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Initial Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TrackerStatus)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  {COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Custom Notes</label>
                <Textarea
                  placeholder="e.g. Applied via referral, follow up next Tuesday..."
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Notes: {editingNotesItem?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingNotesItem?.company} · {editingNotesItem?.status}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              rows={4}
              placeholder="Add interview notes, recruiter contacts, or reminder dates..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingNotesItem(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
