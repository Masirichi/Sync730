'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  Copy,
  Check,
  Users,
  Search,
  ShieldAlert,
  Bot,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EmployerJob, RecruiterRole } from '@/lib/recruiter/types';
import { getLocalJobs, getLocalWorkspace } from '@/lib/recruiter/store';
import { toast } from 'sonner';

function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

export default function ConsoleJobsPage() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIntegrationIds, setExpandedIntegrationIds] = useState<Record<string, boolean>>({});

  // Loading & Error States
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Flowmingo Sync States
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Error'>('Synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date(Date.now() - 4 * 60 * 1000)); // 4 minutes ago
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('100% Remote (Global)');
  const [jobType, setJobType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('$90,000 - $130,000 USD');
  const [description, setDescription] = useState('');

  // Active role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    setJobsError(null);
    try {
      const local = getLocalJobs();
      setJobs(local);
    } catch (err: any) {
      setJobsError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleJobsUpdated = () => {
      loadJobs();
    };
    window.addEventListener('sync730_jobs_updated', handleJobsUpdated);

    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_jobs_updated', handleJobsUpdated);
      clearInterval(interval);
    };
  }, []);

  const canPostJob = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const toggleIntegrationDetails = (jobId: string) => {
    setExpandedIntegrationIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Flowmingo Manual Sync Action with Real Endpoint
  const handleTriggerSync = async () => {
    setSyncStatus('Syncing');
    setSyncErrorMessage(null);
    const ws = getLocalWorkspace();

    try {
      const res = await fetch('/api/flowmingo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: ws.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus('Synced');
        setLastSyncTime(new Date());
        toast.success(`Flowmingo synced: ${data.message || 'All assessment webhooks verified.'}`);
      } else {
        throw new Error(data.error || 'Flowmingo sync error');
      }
    } catch (err: any) {
      setSyncStatus('Error');
      setSyncErrorMessage(err.message || 'Failed to synchronize with Flowmingo AI screening service.');
      toast.error('Sync failed. Please verify credentials or retry.');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPostJob) {
      toast.error('Posting restricted: Interviewers have read-only access to job management.');
      return;
    }
    if (!jobTitle.trim()) {
      toast.error('Job Title is required.');
      return;
    }

    setIsSubmitting(true);
    const ws = getLocalWorkspace();

    try {
      const res = await fetch('/api/flowmingo/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: ws.id,
          job_title: jobTitle,
          department,
          location,
          job_type: jobType,
          salary_range: salaryRange,
          description,
        }),
      });

      const data = await res.json();
      if (data.success && data.job) {
        setJobs(getLocalJobs());
        setIsCreateOpen(false);
        setLastSyncTime(new Date());
        toast.success(`Job posted! Flowmingo screening assessment initialized.`);
        // Reset form
        setJobTitle('');
        setDescription('');
      } else {
        throw new Error(data.error || 'Failed to create job');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating job posting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (projId: string) => {
    const link = `https://sync730.com/vet/${projId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(projId);
    toast.success('Assessment candidate invite link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.job_title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Integration Error Banner */}
      {syncStatus === 'Error' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">Flowmingo AI Sync Error</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                {syncErrorMessage || 'Assessment project webhooks could not be verified with Flowmingo gateway.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleTriggerSync}
            className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 shrink-0 self-start sm:self-center"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Sync</span>
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Job Postings & AI Assessments
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your open roles and monitor automated Flowmingo technical video screenings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canPostJob ? (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[1.5]" />
              <span>Post New Role</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>Job editing restricted to Owner & Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Strip with Real Flowmingo Sync Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>Active Roles</span>
            <Briefcase className="h-4 w-4 stroke-[1.5]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {jobs.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              {syncStatus === 'Syncing' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Syncing with Flowmingo...</span>
                </>
              ) : syncStatus === 'Error' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Sync error</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Synced · Last synced {formatRelativeTime(lastSyncTime)}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={syncStatus === 'Syncing'}
              title="Sync now"
              className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 ml-2 underline"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${syncStatus === 'Syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'Error' ? 'Retry' : 'Sync'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>Vetted Candidates in Pool</span>
            <Users className="h-4 w-4 stroke-[1.5]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            4 Ready
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            <Link
              href="/console/talent"
              className="text-neutral-900 dark:text-white underline hover:no-underline font-medium"
            >
              Review candidate video rubrics →
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
            <span>AI Assessment Mode</span>
            <Bot className="h-4 w-4 stroke-[1.5]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            Flowmingo AI
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Automated technical rubric grading
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles by title or department..."
            className="pl-9 h-9 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none"
          />
        </div>
      </div>

      {/* Jobs Grid / Loading Skeletons / Empty State */}
      <div className="space-y-3">
        {isLoadingJobs ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : jobsError ? (
          <div className="p-8 text-center rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 space-y-2">
            <p>{jobsError}</p>
            <Button size="sm" variant="outline" onClick={loadJobs} className="text-xs">
              Retry
            </Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <Briefcase className="h-8 w-8 text-neutral-400 mx-auto stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              No job postings yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Create your first role to initialize an automated Flowmingo AI screening project.
            </p>
            {canPostJob && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="text-xs h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
              >
                Post Your First Job
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpanded = Boolean(expandedIntegrationIds[job.id]);

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {job.job_title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      >
                        Active
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 stroke-[1.5]" />
                        {job.department || 'General'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 stroke-[1.5]" />
                        {job.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 stroke-[1.5]" />
                        {job.salary_range || 'Competitive'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
                        {job.job_type || 'Full-time'}
                      </span>
                    </div>

                    {job.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 max-w-2xl pt-1">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(job.flowmingo_project_id)}
                      className="text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium"
                    >
                      {copiedId === job.flowmingo_project_id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[1.5]" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Candidate Link</span>
                        </>
                      )}
                    </Button>

                    <Link href={`/console/talent?job=${job.id}`}>
                      <Button
                        size="sm"
                        className="text-xs h-8 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold gap-1.5"
                      >
                        <Users className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>View Vetted Talent</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Collapsed Integration Details - Strictly Visible to OWNER and ADMIN */}
                {canPostJob && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => toggleIntegrationDetails(job.id)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    >
                      <SlidersHorizontal className="h-3 w-3 stroke-[1.5]" />
                      <span>Integration details</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3 stroke-[1.5]" />
                      ) : (
                        <ChevronDown className="h-3 w-3 stroke-[1.5]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-500">Provider:</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            Flowmingo AI (Automated Video Screening)
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-500">Internal Project ID:</span>
                          <code className="text-[11px] font-mono bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200">
                            {job.flowmingo_project_id}
                          </code>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-500">Candidate Screening Link:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                              https://sync730.com/vet/{job.flowmingo_project_id}
                            </code>
                            <button
                              onClick={() => handleCopyLink(job.flowmingo_project_id)}
                              className="text-[11px] text-neutral-800 dark:text-neutral-200 underline font-semibold"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Post Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold mb-1 w-fit">
              <Sparkles className="h-3 w-3 stroke-[1.5]" />
              <span>Flowmingo AI Screening Enabled</span>
            </div>
            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
              Create New Job Opening
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Sync730 will automatically scaffold a Flowmingo AI assessment project to evaluate technical candidates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Job Title *
              </Label>
              <Input
                required
                placeholder="e.g. Senior Frontend Engineer (React/Next.js)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Department
                </Label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="DevOps & Infrastructure">DevOps & Infrastructure</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Location / Remote Overlap
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 100% Remote (Global)"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Employment Type
                </Label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="Full-time">Full-time Contractor</option>
                  <option value="Direct Hire">Full-time Direct Hire</option>
                  <option value="Contract">Part-time / Contract</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Salary / Compensation Range
                </Label>
                <Input
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="e.g. $80,000 - $110,000 USD"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Job Overview & Core Technical Competencies
              </Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe role responsibilities, key tech stack, and evaluation priorities..."
                className="text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
              A unique Flowmingo AI video screening link will be created for this role. Candidates complete 3 timed questions on camera with zero manual recruiter scheduling.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs h-9 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Initializing Project...' : 'Post Job & Generate Flowmingo Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
