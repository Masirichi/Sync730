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
  MoreVertical,
  Pause,
  Play,
  Copy as DuplicateIcon,
  XCircle,
  Edit,
  Eye,
  Kanban,
  CheckCircle2,
  HelpCircle,
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EmployerJob,
  JobStatus,
  RecruiterRole,
} from '@/lib/recruiter/types';
import {
  getLocalJobs,
  saveLocalJobs,
  updateJobStatus,
  duplicateJob,
  updateJob,
  getLocalWorkspace,
} from '@/lib/recruiter/store';
import { formatSalaryDisplay } from '@/lib/salary/formatSalary';
import { toast } from 'sonner';

const FLOWMINGO_TEMPLATES = [
  {
    id: 'Engineering',
    name: 'Engineering (Full-Stack & Systems)',
    description: 'System design tradeoffs, state collocation, debugging production concurrency, asynchronous API contracts.',
    rubrics: ['Technical Depth', 'System Architecture', 'Debugging & Optimization'],
  },
  {
    id: 'Product/Design',
    name: 'Product & Design (UX Architecture)',
    description: 'Design systems, tokenization, mobile accessibility, feature prioritization vs UX velocity.',
    rubrics: ['Visual Systems', 'Design Tokens', 'User Empathy'],
  },
  {
    id: 'Sales',
    name: 'Sales (Enterprise SaaS)',
    description: 'Value discovery, stakeholder objection handling, enterprise deal qualification, and pitching.',
    rubrics: ['Value Articulation', 'Objection Handling', 'Deal Velocity'],
  },
  {
    id: 'Customer Support',
    name: 'Customer Support (Technical Empathy)',
    description: 'High-empathy de-escalation, rapid root cause investigation, cross-team bug triaging.',
    rubrics: ['Empathy', 'De-escalation', 'Bug Triaging'],
  },
  {
    id: 'Finance/Operations',
    name: 'Finance & Operations',
    description: 'Multi-currency modeling, FX hedging, internal audit controls, runway optimization.',
    rubrics: ['Financial Modeling', 'Audit Controls', 'Cash Runway'],
  },
  {
    id: 'Custom',
    name: 'Custom Questions',
    description: 'Define 1 to 5 tailored video interview prompts with specific time limits.',
    rubrics: ['Custom Domain Knowledge', 'Articulation'],
  },
];

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft' | 'closed'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<EmployerJob | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIntegrationIds, setExpandedIntegrationIds] = useState<Record<string, boolean>>({});

  // Loading & Error States
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Flowmingo Sync States
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Error'>('Synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date(Date.now() - 4 * 60 * 1000));
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Active Role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Form States (New / Edit Role)
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('Engineering');
  const [formSeniority, setFormSeniority] = useState<'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff' | 'Principal' | 'Executive'>('Senior');
  const [formEmploymentType, setFormEmploymentType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>('Full-time');
  const [formWorkArrangement, setFormWorkArrangement] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');
  const [formCountry, setFormCountry] = useState('Nigeria');
  const [formState, setFormState] = useState('Lagos');
  const [formCity, setFormCity] = useState('Victoria Island');
  const [formEligibleRegions, setFormEligibleRegions] = useState<string[]>(['Nigeria', 'Worldwide']);
  const [formSalaryMin, setFormSalaryMin] = useState<string>('95000');
  const [formSalaryMax, setFormSalaryMax] = useState<string>('130000');
  const [formSalaryCurrency, setFormSalaryCurrency] = useState<'NGN' | 'USD' | 'EUR' | 'GBP'>('USD');
  const [formSalaryPeriod, setFormSalaryPeriod] = useState<'year' | 'month' | 'hour'>('year');
  const [formSkillsInput, setFormSkillsInput] = useState('Next.js, React, TypeScript, Supabase');
  const [formDescription, setFormDescription] = useState('Lead autonomous architecture and Core Web Vitals optimization across web platforms.');
  const [formRequirements, setFormRequirements] = useState('Minimum 5 years building scalable web architectures. Deep experience with App Router and PostgreSQL.');
  const [formDeadline, setFormDeadline] = useState('2026-12-31');
  const [formTemplate, setFormTemplate] = useState('Engineering');
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customQuestions, setCustomQuestions] = useState<Array<{ id: string; question: string; time_limit_seconds: number }>>([]);

  const loadJobs = () => {
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

  // Copy candidate link with toast
  const handleCopyLink = (projId: string) => {
    const link = `https://sync730.com/vet/${projId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(projId);
    toast.success('Assessment candidate invite link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Job Actions: Pause, Close, Duplicate, Edit
  const handleToggleStatus = (job: EmployerJob, newStatus: JobStatus) => {
    if (!canPostJob) {
      toast.error('Restricted: Interviewers have read-only access to job management.');
      return;
    }
    const updated = updateJobStatus(job.id, newStatus);
    if (updated) {
      loadJobs();
      toast.success(`Role "${job.job_title}" marked as ${newStatus}.`);
    }
  };

  const handleDuplicateJob = (jobId: string) => {
    if (!canPostJob) {
      toast.error('Restricted: Only Owners and Admins can duplicate roles.');
      return;
    }
    const dup = duplicateJob(jobId);
    if (dup) {
      loadJobs();
      toast.success(`Duplicated role as draft: "${dup.job_title}".`);
    }
  };

  const handleOpenEdit = (job: EmployerJob) => {
    if (!canPostJob) {
      toast.error('Restricted: Only Owners and Admins can edit roles.');
      return;
    }
    setEditingJob(job);
    setFormTitle(job.job_title);
    setFormDepartment(job.department || 'Engineering');
    setFormSeniority(job.seniority || 'Senior');
    setFormEmploymentType(job.employment_type || 'Full-time');
    setFormWorkArrangement(job.work_arrangement || 'Remote');
    setFormCountry(job.location_country || 'Nigeria');
    setFormState(job.location_state || 'Lagos');
    setFormCity(job.location_city || 'Victoria Island');
    setFormEligibleRegions(job.eligible_regions || ['Nigeria', 'Worldwide']);
    setFormSalaryMin(job.salary_min ? String(job.salary_min) : '95000');
    setFormSalaryMax(job.salary_max ? String(job.salary_max) : '130000');
    setFormSalaryCurrency(job.salary_currency || 'USD');
    setFormSalaryPeriod(job.salary_period || 'year');
    setFormSkillsInput(job.skills ? job.skills.join(', ') : 'Next.js, TypeScript');
    setFormDescription(job.description || '');
    setFormRequirements(job.requirements || '');
    setFormDeadline(job.application_deadline || '2026-12-31');
    setFormTemplate(job.assessment_template || 'Engineering');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    const minNum = parseFloat(formSalaryMin) || undefined;
    const maxNum = parseFloat(formSalaryMax) || undefined;
    const skillsArr = formSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    const updates: Partial<EmployerJob> = {
      job_title: formTitle.trim(),
      department: formDepartment,
      seniority: formSeniority,
      employment_type: formEmploymentType,
      work_arrangement: formWorkArrangement,
      location:
        formWorkArrangement === 'Remote'
          ? '100% Remote (Worldwide)'
          : `${formCity}, ${formState}, ${formCountry} (${formWorkArrangement})`,
      location_country: formCountry,
      location_state: formState,
      location_city: formCity,
      eligible_regions: formEligibleRegions,
      salary_min: minNum,
      salary_max: maxNum,
      salary_currency: formSalaryCurrency,
      salary_period: formSalaryPeriod,
      skills: skillsArr,
      description: formDescription.trim(),
      requirements: formRequirements.trim(),
      application_deadline: formDeadline,
      assessment_template: formTemplate as any,
    };

    const updated = updateJob(editingJob.id, updates);
    if (updated) {
      loadJobs();
      setIsEditOpen(false);
      toast.success(`Role "${updated.job_title}" updated successfully.`);
    }
  };

  // Submit New Job
  const handleSubmitJob = async (publishStatus: 'active' | 'draft') => {
    if (!canPostJob) {
      toast.error('Posting restricted: Interviewers have read-only access.');
      return;
    }

    if (!formTitle.trim()) {
      toast.error('Job Title is required.');
      return;
    }

    const minNum = parseFloat(formSalaryMin);
    const maxNum = parseFloat(formSalaryMax);
    if (isNaN(minNum) || isNaN(maxNum) || minNum > maxNum) {
      toast.error('Please enter a valid salary range (Min must be ≤ Max).');
      return;
    }

    if (!formDescription.trim()) {
      toast.error('Job Description is required.');
      return;
    }

    const skillsArr = formSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillsArr.length === 0) {
      toast.error('Please specify at least 1 required technical skill.');
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
          job_title: formTitle.trim(),
          department: formDepartment,
          seniority: formSeniority,
          employment_type: formEmploymentType,
          work_arrangement: formWorkArrangement,
          location_country: formCountry,
          location_state: formState,
          location_city: formCity,
          eligible_regions: formEligibleRegions,
          salary_min: minNum,
          salary_max: maxNum,
          salary_currency: formSalaryCurrency,
          salary_period: formSalaryPeriod,
          skills: skillsArr,
          description: formDescription.trim(),
          requirements: formRequirements.trim(),
          application_deadline: formDeadline,
          assessment_template: formTemplate,
          custom_questions: customQuestions,
          status: publishStatus,
        }),
      });

      const data = await res.json();
      if (data.success && data.job) {
        loadJobs();
        setIsCreateOpen(false);
        setIsPreviewMode(false);
        toast.success(
          publishStatus === 'active'
            ? 'Job published! Flowmingo screening assessment initialized.'
            : 'Role saved as Draft.'
        );
      } else {
        throw new Error(data.error || 'Failed to create role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating job posting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync with Flowmingo
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

  const toggleRegion = (region: string) => {
    setFormEligibleRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.job_title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department && j.department.toLowerCase().includes(search.toLowerCase())) ||
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return j.status === statusFilter;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Flowmingo Sync Error Banner */}
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
              className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 shrink-0"
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
              Job Postings & Hiring Pipelines
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Create and manage open roles, evaluate candidate pipelines, and monitor Flowmingo AI technical video screenings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canPostJob ? (
              <Button
                onClick={() => {
                  setIsPreviewMode(false);
                  setIsCreateOpen(true);
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-4 rounded-xl shadow-xs gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[1.5]" />
                <span>Post New Role</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 text-xs font-medium">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Job editing restricted to Owner & Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Total Roles</span>
              <Briefcase className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {jobs.length}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {jobs.filter((j) => j.status === 'active').length} Active · {jobs.filter((j) => j.status === 'draft').length} Draft
              </span>
              <button
                onClick={handleTriggerSync}
                disabled={syncStatus === 'Syncing'}
                className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline ml-2"
              >
                Sync Flowmingo
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Total Assessed Candidates</span>
              <Users className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              {jobs.reduce((acc, j) => acc + (j.assessed_count || 0), 0) || 19}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              <Link href="/console/talent" className="text-neutral-900 dark:text-white underline font-medium">
                Explore pre-vetted talent pool →
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Automated Rubrics Mode</span>
              <Bot className="h-4 w-4 stroke-[1.5]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
              Flowmingo AI
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              Technical screening with 15-minute expiring URLs
            </div>
          </div>
        </div>

        {/* Filter & Status Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 stroke-[1.5]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles by title, department, or skills..."
              className="pl-9 h-9 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'paused', label: 'Paused' },
                { id: 'draft', label: 'Draft' },
                { id: 'closed', label: 'Closed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List / Cards */}
        <div className="space-y-3.5">
          {isLoadingJobs ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : jobsError ? (
            <div className="p-8 text-center rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700">
              <p>{jobsError}</p>
              <Button size="sm" variant="outline" onClick={loadJobs} className="text-xs mt-2">
                Retry
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
              <Briefcase className="h-8 w-8 text-neutral-400 mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                No job postings found
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No roles match the selected filter. Create a new job or adjust your search.
              </p>
              {canPostJob && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="sm"
                  className="text-xs h-8 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
                >
                  Post New Role
                </Button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isExpanded = Boolean(expandedIntegrationIds[job.id]);
              const formattedSalary = formatSalaryDisplay(job);

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs space-y-3.5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          {job.job_title}
                        </h3>

                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            job.status === 'active'
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                              : job.status === 'paused'
                              ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                              : job.status === 'closed'
                              ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                              : 'border-neutral-400/30 text-neutral-600 dark:text-neutral-400 bg-neutral-400/10'
                          }`}
                        >
                          {job.status}
                        </Badge>

                        {job.assessment_template && (
                          <Badge variant="secondary" className="text-[10px] bg-neutral-100 dark:bg-neutral-800 font-medium">
                            {job.assessment_template} Vetting
                          </Badge>
                        )}
                      </div>

                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Briefcase className="h-3.5 w-3.5 stroke-[1.5]" />
                          {job.department || 'General'} {job.seniority ? `· ${job.seniority}` : ''}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="h-3.5 w-3.5 stroke-[1.5]" />
                          {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-neutral-900 dark:text-neutral-200">
                          <DollarSign className="h-3.5 w-3.5 stroke-[1.5] text-emerald-600" />
                          {formattedSalary}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
                          {job.job_type || 'Full-time'}
                        </span>
                      </div>

                      {/* Candidates Count Strip */}
                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold bg-neutral-50 dark:bg-neutral-800/60 px-2.5 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>{job.invited_count || 0} Invited</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold bg-neutral-50 dark:bg-neutral-800/60 px-2.5 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                          <span className="h-2 w-2 rounded-full bg-purple-500" />
                          <span>{job.assessed_count || 0} Assessed</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold bg-neutral-50 dark:bg-neutral-800/60 px-2.5 py-1 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>{job.shortlisted_count || 0} Shortlisted</span>
                        </div>
                      </div>

                      {job.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 max-w-2xl pt-1">
                          {job.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons & Management Menu */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                      {/* Candidate Link with Tooltip and Copy */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(job.flowmingo_project_id)}
                            className="text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 gap-1.5 font-medium"
                          >
                            {copiedId === job.flowmingo_project_id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Link Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Candidate Link</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-xs">
                          Share this link with candidates to take the assessment
                        </TooltipContent>
                      </Tooltip>

                      {/* Pipeline Button */}
                      <Link href={`/console/jobs/${job.id}/pipeline`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3 rounded-lg border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 font-semibold gap-1.5"
                        >
                          <Kanban className="h-3.5 w-3.5" />
                          <span>Pipeline</span>
                        </Button>
                      </Link>

                      {/* View Vetted Talent Link */}
                      <Link href={`/console/talent?job=${job.id}`}>
                        <Button
                          size="sm"
                          className="text-xs h-8 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 font-semibold gap-1.5"
                        >
                          <Users className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>View Talent</span>
                        </Button>
                      </Link>

                      {/* Role Management Menu: Edit, Pause, Close, Duplicate */}
                      {canPostJob && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Role options menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(job)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 text-neutral-500" />
                              <span>Edit Role</span>
                            </DropdownMenuItem>

                            {job.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(job, 'paused')}
                                className="gap-2 cursor-pointer text-amber-600"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                <span>Pause Role</span>
                              </DropdownMenuItem>
                            ) : job.status === 'paused' ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(job, 'active')}
                                className="gap-2 cursor-pointer text-emerald-600"
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span>Activate Role</span>
                              </DropdownMenuItem>
                            ) : null}

                            <DropdownMenuItem
                              onClick={() => handleDuplicateJob(job.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <DuplicateIcon className="h-3.5 w-3.5 text-neutral-500" />
                              <span>Duplicate Role</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {job.status !== 'closed' ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(job, 'closed')}
                                className="gap-2 cursor-pointer text-rose-600"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Close Role</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(job, 'active')}
                                className="gap-2 cursor-pointer text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Re-open Role</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Collapsed Integration Details */}
                  {canPostJob && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIntegrationIds((prev) => ({
                            ...prev,
                            [job.id]: !prev[job.id],
                          }))
                        }
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                      >
                        <SlidersHorizontal className="h-3 w-3 stroke-[1.5]" />
                        <span>Flowmingo AI Screening integration details</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 stroke-[1.5]" />
                        ) : (
                          <ChevronDown className="h-3 w-3 stroke-[1.5]" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-neutral-500">Screening Project:</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {job.assessment_template || 'Engineering'} AI Rubrics
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-neutral-500">Flowmingo Project ID:</span>
                            <code className="text-[11px] font-mono bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200">
                              {job.flowmingo_project_id}
                            </code>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-neutral-500">Direct Candidate Link:</span>
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

        {/* POST NEW ROLE DIALOG (WITH PREVIEW BEFORE PUBLISH & VALIDATION) */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3 stroke-[1.5]" />
                  <span>Flowmingo AI Screening Enabled</span>
                </div>

                {/* Preview Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{isPreviewMode ? 'Back to Form' : 'Preview Before Publish'}</span>
                </button>
              </div>

              <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                {isPreviewMode ? 'Candidate Role Preview' : 'Post New Role'}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                {isPreviewMode
                  ? 'Verify how this role will be displayed to candidates on the board.'
                  : 'Configure open position requirements, eligible regions, compensation, and Flowmingo vetting rubrics.'}
              </DialogDescription>
            </DialogHeader>

            {isPreviewMode ? (
              /* LIVE PREVIEW BEFORE PUBLISH */
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 text-xs">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-emerald-500 text-emerald-600 bg-emerald-500/10">
                    Active Preview
                  </Badge>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {formTitle || 'Untitled Position'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-neutral-500 pt-1">
                    <span>{formDepartment} · {formSeniority}</span>
                    <span>·</span>
                    <span>
                      {formWorkArrangement === 'Remote'
                        ? '100% Remote (Worldwide)'
                        : `${formCity}, ${formState}, ${formCountry} (${formWorkArrangement})`}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {formatSalaryDisplay({
                        salary_min: parseFloat(formSalaryMin),
                        salary_max: parseFloat(formSalaryMax),
                        salary_currency: formSalaryCurrency,
                        salary_period: formSalaryPeriod,
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Required Skills:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {formSkillsInput.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Eligible Regions:</h4>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    {formEligibleRegions.join(', ') || 'Global'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Role Description:</h4>
                  <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                    {formDescription || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-neutral-900 dark:text-white">Requirements:</h4>
                  <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                    {formRequirements || 'No specific requirements listed.'}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/30 text-purple-900 dark:text-purple-300 space-y-1">
                  <p className="font-bold">Flowmingo Assessment Template: {formTemplate}</p>
                  <p className="text-[11px]">
                    Candidates will take an automated asynchronous video screening graded on technical depth, problem-solving, and communication clarity.
                  </p>
                </div>
              </div>
            ) : (
              /* EDIT FORM */
              <div className="space-y-4 pt-2 text-xs">
                {/* Title & Department */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Role Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="e.g. Senior Backend Engineer (Distributed Systems)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Department
                    </Label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product & Design">Product & Design</option>
                      <option value="DevOps & Infrastructure">DevOps & Infrastructure</option>
                      <option value="Data & Analytics">Data & Analytics</option>
                      <option value="Sales & Growth">Sales & Growth</option>
                      <option value="Finance & Operations">Finance & Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Seniority
                    </Label>
                    <select
                      value={formSeniority}
                      onChange={(e) => setFormSeniority(e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                    >
                      <option value="Junior">Junior (0-2 yrs)</option>
                      <option value="Mid-Level">Mid-Level (2-4 yrs)</option>
                      <option value="Senior">Senior (5-7 yrs)</option>
                      <option value="Lead">Lead (7-9 yrs)</option>
                      <option value="Staff">Staff (8+ yrs)</option>
                      <option value="Principal">Principal (10+ yrs)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Employment Type
                    </Label>
                    <select
                      value={formEmploymentType}
                      onChange={(e) => setFormEmploymentType(e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Work Arrangement & Non-Remote Location Fields */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Work Arrangement
                      </Label>
                      <select
                        value={formWorkArrangement}
                        onChange={(e) => setFormWorkArrangement(e.target.value as any)}
                        className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                      >
                        <option value="Remote">100% Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Application Deadline
                      </Label>
                      <Input
                        type="date"
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* If Hybrid or Onsite, show Country, State, City */}
                  {formWorkArrangement !== 'Remote' && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-neutral-600 dark:text-neutral-400">Country *</Label>
                        <Input
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          placeholder="Nigeria"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-neutral-600 dark:text-neutral-400">State / Region *</Label>
                        <Input
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                          placeholder="Lagos"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-neutral-600 dark:text-neutral-400">City *</Label>
                        <Input
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="Victoria Island"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Eligible Regions Checkboxes */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Eligible Candidate Regions
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {['Nigeria', 'Africa', 'Worldwide', 'EMEA'].map((reg) => {
                      const isChecked = formEligibleRegions.includes(reg);
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => toggleRegion(reg)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isChecked
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {reg} {isChecked ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Salary Min, Max, Currency, Period */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Compensation Range & Currency
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      type="number"
                      placeholder="Min (e.g. 95000)"
                      value={formSalaryMin}
                      onChange={(e) => setFormSalaryMin(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max (e.g. 130000)"
                      value={formSalaryMax}
                      onChange={(e) => setFormSalaryMax(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <select
                      value={formSalaryCurrency}
                      onChange={(e) => setFormSalaryCurrency(e.target.value as any)}
                      className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 text-xs"
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <select
                      value={formSalaryPeriod}
                      onChange={(e) => setFormSalaryPeriod(e.target.value as any)}
                      className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 text-xs"
                    >
                      <option value="year">Per Year</option>
                      <option value="month">Per Month</option>
                      <option value="hour">Per Hour</option>
                    </select>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Required Skills (Comma-separated)
                  </Label>
                  <Input
                    placeholder="Next.js, TypeScript, PostgreSQL, Docker"
                    value={formSkillsInput}
                    onChange={(e) => setFormSkillsInput(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Flowmingo Assessment Template Selector */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-emerald-600" />
                    <span>Flowmingo AI Assessment Template</span>
                  </Label>
                  <select
                    value={formTemplate}
                    onChange={(e) => setFormTemplate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                  >
                    {FLOWMINGO_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    {FLOWMINGO_TEMPLATES.find((t) => t.id === formTemplate)?.description}
                  </p>
                </div>

                {/* Description & Requirements */}
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Role Description
                  </Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe company mission, team ownership, and architectural expectations..."
                    className="text-xs min-h-[70px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Role Requirements
                  </Label>
                  <Textarea
                    value={formRequirements}
                    onChange={(e) => setFormRequirements(e.target.value)}
                    placeholder="Key technical qualifications, years of experience, and distributed systems background..."
                    className="text-xs min-h-[70px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitJob('draft')}
                    className="text-xs"
                  >
                    Save as Draft
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitJob('active')}
                    className="text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Publish Role</span>
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT ROLE DIALOG */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                Edit Role: {editingJob?.job_title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Update compensation, requirements, or department settings.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Job Title
                </Label>
                <Input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Department</Label>
                  <Input
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Seniority</Label>
                  <select
                    value={formSeniority}
                    onChange={(e) => setFormSeniority(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-xs"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Staff">Staff</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Compensation Range</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    value={formSalaryMin}
                    onChange={(e) => setFormSalaryMin(e.target.value)}
                    placeholder="Min"
                    className="h-9 text-xs"
                  />
                  <Input
                    type="number"
                    value={formSalaryMax}
                    onChange={(e) => setFormSalaryMax(e.target.value)}
                    placeholder="Max"
                    className="h-9 text-xs"
                  />
                  <select
                    value={formSalaryCurrency}
                    onChange={(e) => setFormSalaryCurrency(e.target.value as any)}
                    className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 text-xs"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <select
                    value={formSalaryPeriod}
                    onChange={(e) => setFormSalaryPeriod(e.target.value as any)}
                    className="h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 text-xs"
                  >
                    <option value="year">Per Year</option>
                    <option value="month">Per Month</option>
                    <option value="hour">Per Hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
