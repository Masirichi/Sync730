'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  AlertCircle,
  Globe2,
  DollarSign,
  Briefcase,
  GraduationCap,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { RemoteJob } from '@/lib/supabase/types';
import { getAdminRemoteJobs } from '@/lib/admin/store';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import {
  saveJobToTracker,
  removeJobFromTracker,
  getLocalTrackerItems,
  markJobAsApplied,
} from '@/lib/tracker';
import {
  JOB_CATEGORIES,
  JOB_CATEGORIES_META,
  normalizeJobCategory,
} from '@/lib/crawler/categories';
import {
  SeniorityLevel,
  JobTypeOption,
  SortOption,
  detectSeniority,
  isOpenToAfrica,
  matchesSearchQuery,
  parseSalary,
  sortJobs,
  formatTimeAgo,
} from '@/lib/crawler/job-filters';
import {
  normalizeJobRecord,
  deduplicateJobs,
  isOlderThan30Days,
  isJobExpired,
  formatPostedAgo,
  formatStandardDate,
  extractCleanSkills,
} from '@/lib/crawler/job-utils';
import SalaryDisplay from '@/components/ui/SalaryDisplay';
import { DisplayPeriod } from '@/lib/salary/formatSalary';
import { toast } from 'sonner';
import { ResumeGeneratorModal, TargetJobContext } from '@/components/resume/resume-generator-modal';
import { TailorResumePanel } from '@/components/resume/tailor-resume-panel';
import { ReportMatchDialog } from '@/components/jobs/report-match-dialog';
import { getCandidateProfile, CandidateProfile } from '@/lib/candidate/profile';
import { computeJobMatchScore } from '@/lib/candidate/matching';

// Pre-normalize seed jobs for instant zero-latency first render
const HYDRATED_INITIAL_JOBS: RemoteJob[] = deduplicateJobs(
  SEED_REMOTE_JOBS.map((j, idx) =>
    normalizeJobRecord({
      ...j,
      id: `seed-job-${idx + 1}`,
      category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
    })
  )
);

const SENIORITY_OPTIONS: SeniorityLevel[] = ['Entry', 'Mid', 'Senior', 'Lead/Staff'];
const JOB_TYPE_OPTIONS: JobTypeOption[] = ['Full-time', 'Contract', 'Part-time'];
const SALARY_PRESETS = [
  { label: 'Any', value: null },
  { label: '$40k+', value: 40000 },
  { label: '$70k+', value: 70000 },
  { label: '$100k+', value: 100000 },
  { label: '$130k+', value: 130000 },
  { label: '$160k+', value: 160000 },
];
const PAGE_SIZE = 12;

function CrawlerJobFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core Data & API states
  const [jobs, setJobs] = useState<RemoteJob[]>(HYDRATED_INITIAL_JOBS);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sync730_last_synced_at');
      if (stored) return parseInt(stored, 10);
    }
    return Date.now() - 300000; // default 5 minutes ago
  });
  const [timeAgoText, setTimeAgoText] = useState<string>('5 minutes ago');

  // Period Toggle (Persisted in localStorage)
  const [displayPeriod, setDisplayPeriod] = useState<DisplayPeriod>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sync730_salary_period') as DisplayPeriod;
      if (stored === 'monthly' || stored === 'yearly') return stored;
    }
    return 'original';
  });

  const handlePeriodChange = (val: DisplayPeriod) => {
    setDisplayPeriod(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sync730_salary_period', val);
    }
  };

  // Search & Debounce state (300ms)
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams?.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(() => searchParams?.get('q') || '');

  // Sort State
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const s = searchParams?.get('sort') as SortOption;
    return s === 'newest' || s === 'salary_desc' ? s : 'best_match';
  });

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams?.get('cat') || 'All');
  const [selectedSeniority, setSelectedSeniority] = useState<SeniorityLevel[]>(() => {
    const sen = searchParams?.get('sen');
    return sen ? (sen.split(',') as SeniorityLevel[]) : [];
  });
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobTypeOption[]>(() => {
    const types = searchParams?.get('type');
    return types ? (types.split(',') as JobTypeOption[]) : [];
  });
  const [openToAfricaOnly, setOpenToAfricaOnly] = useState<boolean>(() => searchParams?.get('africa') === 'true');
  const [showExpired, setShowExpired] = useState<boolean>(() => searchParams?.get('expired') === 'true');
  const [minSalary, setMinSalary] = useState<number | null>(() => {
    const sal = searchParams?.get('sal');
    return sal ? parseInt(sal, 10) : null;
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    const sk = searchParams?.get('skills');
    return sk ? sk.split(',').filter(Boolean) : [];
  });
  const [savedOnly, setSavedOnly] = useState<boolean>(() => searchParams?.get('saved') === 'true');

  // Filter Drawer & Skills Search
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => {
    const hasInitialFilters =
      Boolean(searchParams?.get('sen')) ||
      Boolean(searchParams?.get('type')) ||
      searchParams?.get('africa') === 'true' ||
      searchParams?.get('expired') === 'true' ||
      Boolean(searchParams?.get('sal')) ||
      Boolean(searchParams?.get('skills')) ||
      searchParams?.get('saved') === 'true';
    return hasInitialFilters;
  });
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');

  // Pagination state (12 jobs at a time)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Tracker & Resume ATS Modal states
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [selectedResumeJob, setSelectedResumeJob] = useState<TargetJobContext | null>(null);
  const [isTailorPanelOpen, setIsTailorPanelOpen] = useState<boolean>(false);
  const [tailorTargetJob, setTailorTargetJob] = useState<TargetJobContext | null>(null);
  const [reportDialogJob, setReportDialogJob] = useState<{
    id: string;
    title: string;
    company: string;
    score?: number | null;
  } | null>(null);

  // Candidate Profile State & Sync Listener
  const [profile, setProfile] = useState<CandidateProfile | null>(() => getCandidateProfile());

  useEffect(() => {
    setProfile(getCandidateProfile());
    const handleProfileUpdate = () => {
      setProfile(getCandidateProfile());
    };
    window.addEventListener('sync730_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('sync730_profile_updated', handleProfileUpdate);
  }, []);

  // Apply Prompt Flow State
  const [pendingApplyJob, setPendingApplyJob] = useState<RemoteJob | null>(null);
  const [showApplyConfirmDialog, setShowApplyConfirmDialog] = useState<boolean>(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Window Focus listener for Apply Prompt Flow
  useEffect(() => {
    const handleWindowFocus = () => {
      if (pendingApplyJob) {
        setShowApplyConfirmDialog(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [pendingApplyJob]);

  // Update URL Query String (preserves state on refresh / share without reload)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
    if (sortBy !== 'best_match') params.set('sort', sortBy);
    if (selectedCategory !== 'All') params.set('cat', selectedCategory);
    if (selectedSeniority.length > 0) params.set('sen', selectedSeniority.join(','));
    if (selectedJobTypes.length > 0) params.set('type', selectedJobTypes.join(','));
    if (openToAfricaOnly) params.set('africa', 'true');
    if (showExpired) params.set('expired', 'true');
    if (minSalary !== null) params.set('sal', minSalary.toString());
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
    if (savedOnly) params.set('saved', 'true');

    const queryString = params.toString();
    const newPath = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newPath);
  }, [
    debouncedSearchQuery,
    sortBy,
    selectedCategory,
    selectedSeniority,
    selectedJobTypes,
    openToAfricaOnly,
    showExpired,
    minSalary,
    selectedSkills,
    savedOnly,
  ]);

  // Live timer for "Last synced: X minutes ago"
  useEffect(() => {
    setTimeAgoText(formatTimeAgo(lastSyncedAt));
    const interval = setInterval(() => {
      setTimeAgoText(formatTimeAgo(lastSyncedAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Load jobs and saved tracker items
  const loadData = useCallback(async (isInitial: boolean = false) => {
    if (isInitial && jobs.length === 0) {
      setLoading(true);
    }
    setHasError(false);

    try {
      // 1. Sync saved items from tracker
      const trackerItems = getLocalTrackerItems();
      const savedIds = new Set(
        trackerItems.map((i) => i.job_id).filter((id): id is string => Boolean(id))
      );
      setSavedJobIds(savedIds);

      // 2. Fetch live verified jobs from /api/jobs
      let fetchedJobs: RemoteJob[] = [];
      try {
        const apiRes = await fetch('/api/jobs');
        const apiJson = await apiRes.json();
        if (apiJson && apiJson.success && apiJson.jobs && apiJson.jobs.length > 0) {
          fetchedJobs = apiJson.jobs;
        }
      } catch (err) {
        console.warn('API fetch warning:', err);
      }

      // Merge with Admin Curated jobs from store
      const adminJobs = getAdminRemoteJobs();
      const jobMap = new Map<string, RemoteJob>();

      // Base seed jobs
      HYDRATED_INITIAL_JOBS.forEach((sj) => {
        jobMap.set(sj.id, sj);
      });

      // API jobs
      fetchedJobs.forEach((j: any) => {
        const id = j.id || j.external_id;
        jobMap.set(id, normalizeJobRecord(j));
      });

      // Admin jobs (curated directly in Command Center)
      adminJobs.forEach((aj) => {
        jobMap.set(aj.id, normalizeJobRecord(aj as any));
      });

      // Filter out taken down jobs
      const visibleJobs = Array.from(jobMap.values()).filter((j) => j.is_active !== false);

      // Deduplicate by title + company + apply_url, keeping most recent
      const deduplicated = deduplicateJobs(visibleJobs);

      if (deduplicated.length === 0) {
        setJobs(HYDRATED_INITIAL_JOBS);
      } else {
        setJobs(deduplicated);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);

    const handleTrackerUpdate = () => {
      const trackerItems = getLocalTrackerItems();
      const savedIds = new Set(
        trackerItems.map((i) => i.job_id).filter((id): id is string => Boolean(id))
      );
      setSavedJobIds(savedIds);
    };

    const handleAdminUpdate = () => {
      loadData();
    };

    window.addEventListener('sync730_tracker_updated', handleTrackerUpdate);
    window.addEventListener('sync730_admin_jobs_updated', handleAdminUpdate);
    window.addEventListener('sync730_remote_jobs_updated', handleAdminUpdate);
    return () => {
      window.removeEventListener('sync730_tracker_updated', handleTrackerUpdate);
      window.removeEventListener('sync730_admin_jobs_updated', handleAdminUpdate);
      window.removeEventListener('sync730_remote_jobs_updated', handleAdminUpdate);
    };
  }, [loadData]);

  // Extract all distinct clean skills across jobs for searchable multi-select
  const allAvailableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    jobs.forEach((j) => {
      const clean = extractCleanSkills(j.tags || j.skills, j.company_name || j.company, j.source_name || j.source);
      clean.forEach((s) => skillSet.add(s));
    });

    // Ensure common core tech stacks are available
    ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Go', 'Figma', 'GraphQL', 'Tailwind CSS'].forEach(
      (s) => skillSet.add(s)
    );

    return Array.from(skillSet).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  // Filter skills by search query in the dropdown
  const filteredAvailableSkills = useMemo(() => {
    if (!skillSearchQuery.trim()) return allAvailableSkills.slice(0, 16);
    const q = skillSearchQuery.toLowerCase().trim();
    return allAvailableSkills.filter((s) => s.toLowerCase().includes(q)).slice(0, 20);
  }, [allAvailableSkills, skillSearchQuery]);

  // Active filters count for the badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSeniority.length > 0) count += 1;
    if (selectedJobTypes.length > 0) count += 1;
    if (openToAfricaOnly) count += 1;
    if (showExpired) count += 1;
    if (minSalary !== null) count += 1;
    if (selectedSkills.length > 0) count += 1;
    if (savedOnly) count += 1;
    return count;
  }, [selectedSeniority, selectedJobTypes, openToAfricaOnly, showExpired, minSalary, selectedSkills, savedOnly]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('All');
    setSelectedSeniority([]);
    setSelectedJobTypes([]);
    setOpenToAfricaOnly(false);
    setShowExpired(false);
    setMinSalary(null);
    setSelectedSkills([]);
    setSavedOnly(false);
    setSortBy('best_match');
    setVisibleCount(PAGE_SIZE);
  };

  // Helper checking if a job matches all filters EXCEPT the category filter
  const matchesNonCategoryFilters = useCallback(
    (job: RemoteJob): boolean => {
      // 0. Expiration rule (hidden by default unless showExpired is enabled)
      if (!showExpired && isJobExpired(job.expires_at)) {
        return false;
      }

      // 1. Search Query (across title, company, skills, description)
      if (debouncedSearchQuery && !matchesSearchQuery(job, debouncedSearchQuery)) {
        return false;
      }

      // 2. Seniority Filter
      if (selectedSeniority.length > 0) {
        const jobSen = detectSeniority(job);
        if (!selectedSeniority.includes(jobSen)) return false;
      }

      // 3. Job Type Filter
      if (selectedJobTypes.length > 0) {
        const rawType = (job.job_type || 'Full-time').toLowerCase();
        const matchesType = selectedJobTypes.some((t) => rawType.includes(t.toLowerCase()));
        if (!matchesType) return false;
      }

      // 4. Open to Nigeria / Africa
      if (openToAfricaOnly && !isOpenToAfrica(job)) {
        return false;
      }

      // 5. Min Salary
      if (minSalary !== null) {
        const sal = parseSalary(job.salary);
        if (!sal || sal.annualizedMax < minSalary) return false;
      }

      // 6. Skills Multi-select
      if (selectedSkills.length > 0) {
        const jobSkills = extractCleanSkills(job.tags || job.skills, job.company_name || job.company, job.source_name || job.source).map((s) => s.toLowerCase());
        const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
        const hasSkill = selectedSkills.some(
          (skill) => jobSkills.includes(skill.toLowerCase()) || jobText.includes(skill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // 7. Saved Only
      if (savedOnly) {
        const isSaved =
          savedJobIds.has(job.id) ||
          savedJobIds.has(job.external_id) ||
          savedJobIds.has(`remotive-${job.id}`);
        if (!isSaved) return false;
      }

      return true;
    },
    [
      debouncedSearchQuery,
      selectedSeniority,
      selectedJobTypes,
      openToAfricaOnly,
      showExpired,
      minSalary,
      selectedSkills,
      savedOnly,
      savedJobIds,
    ]
  );

  // Compute live department counts
  const { visibleCategories, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    JOB_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });

    jobs.forEach((j) => {
      if (matchesNonCategoryFilters(j)) {
        counts['All'] = (counts['All'] || 0) + 1;
        const cat = normalizeJobCategory(j.category || '', j.title, j.description || '');
        if (counts[cat] !== undefined) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
    });

    const activeCats = JOB_CATEGORIES.filter((cat) => (counts[cat] || 0) > 0);
    return { visibleCategories: activeCats, categoryCounts: counts };
  }, [jobs, matchesNonCategoryFilters]);

  // If selected category has 0 jobs, revert to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All' && (categoryCounts[selectedCategory] || 0) === 0) {
      setSelectedCategory('All');
    }
  }, [categoryCounts, selectedCategory]);

  // Filter jobs by all active criteria
  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      if (!matchesNonCategoryFilters(job)) return false;

      if (selectedCategory !== 'All') {
        const canonicalJobCat = normalizeJobCategory(job.category || '', job.title, job.description || '');
        if (canonicalJobCat !== selectedCategory) return false;
      }

      return true;
    });

    return sortJobs(filtered, sortBy, debouncedSearchQuery, profile);
  }, [jobs, matchesNonCategoryFilters, selectedCategory, sortBy, debouncedSearchQuery, profile]);

  // Top 3 Recommended Jobs by AI Match Score (Requirement 3)
  const recommendedJobs = useMemo(() => {
    if (!profile) return [];
    const hasProfileData =
      (profile.skills && profile.skills.length > 0) ||
      (profile.targetRoles && profile.targetRoles.length > 0);
    if (!hasProfileData) return [];

    return [...jobs]
      .filter((j) => j.is_active !== false && !isJobExpired(j.expires_at))
      .map((job) => ({
        job,
        match: computeJobMatchScore(job, profile),
      }))
      .filter((item) => item.match.score !== null && item.match.score >= 50)
      .sort((a, b) => (b.match.score || 0) - (a.match.score || 0))
      .slice(0, 3);
  }, [jobs, profile]);

  // Paginated visible slice
  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedSeniority,
    selectedJobTypes,
    openToAfricaOnly,
    showExpired,
    minSalary,
    selectedSkills,
    savedOnly,
    sortBy,
  ]);

  // One-click Save / Unsave to Tracker (Fixed width button, toggles state)
  const handleToggleSaveJob = async (e: React.MouseEvent, job: RemoteJob) => {
    e.stopPropagation();
    const identifier = job.id || job.external_id;
    const isCurrentlySaved = savedJobIds.has(identifier);

    if (isCurrentlySaved) {
      removeJobFromTracker(identifier);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(identifier);
        next.delete(job.external_id);
        return next;
      });
      toast.info(`Removed "${job.title}" from saved jobs.`);
    } else {
      await saveJobToTracker(job);
      setSavedJobIds((prev) => new Set([...Array.from(prev), identifier, job.external_id]));
      toast.success(
        <div className="flex items-center justify-between w-full gap-2">
          <span>Saved to your application tracker.</span>
          <Link
            href="/dashboard/tracker"
            className="text-xs font-semibold underline text-neutral-900 dark:text-neutral-100 shrink-0"
          >
            View Tracker →
          </Link>
        </div>
      );
    }
  };

  // Direct Apply Click: open in new tab & set pending apply job for prompt when returning
  const handleApplyClick = (e: React.MouseEvent, job: RemoteJob) => {
    e.stopPropagation();
    const targetUrl = job.apply_url || job.url;
    if (targetUrl && targetUrl !== '#') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setPendingApplyJob(job);
    } else {
      toast.error('No direct application link available for this role.');
    }
  };

  // Confirm Apply from follow-up modal
  const handleConfirmApplyDialog = (applied: boolean) => {
    setShowApplyConfirmDialog(false);
    if (!pendingApplyJob) return;

    if (applied) {
      markJobAsApplied(pendingApplyJob);
      const identifier = pendingApplyJob.id || pendingApplyJob.external_id;
      setSavedJobIds((prev) => new Set([...Array.from(prev), identifier, pendingApplyJob.external_id]));
      toast.success(`Marked "${pendingApplyJob.title}" as Applied in Tracker!`);
    } else {
      toast.info('Application status kept unchanged.');
    }
    setPendingApplyJob(null);
  };

  // Navigate to Job Detail View
  const handleOpenJobDetail = (jobId: string) => {
    const qStr = searchParams?.toString();
    const target = qStr ? `/dashboard/jobs/${jobId}?${qStr}` : `/dashboard/jobs/${jobId}`;
    router.push(target);
  };

  // Skill toggle handler
  const handleToggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Seniority toggle handler
  const handleToggleSeniority = (sen: SeniorityLevel) => {
    setSelectedSeniority((prev) =>
      prev.includes(sen) ? prev.filter((s) => s !== sen) : [...prev, sen]
    );
  };

  // Job type toggle handler
  const handleToggleJobType = (type: JobTypeOption) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getCategoryMeta = (catStr: string) => {
    const canonical = normalizeJobCategory(catStr);
    return JOB_CATEGORIES_META[canonical] || JOB_CATEGORIES_META['Software & Engineering'];
  };

  const sortByLabels: Record<SortOption, string> = {
    best_match: 'Best match',
    newest: 'Newest',
    salary_desc: 'Salary high to low',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Verify Profile Banner (Requirement 6 - Honest state-aware copy) */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {profile?.verificationStatus === 'verified' ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-xs font-bold px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" /> FastTrack Verified
                </Badge>
              ) : profile?.verificationStatus === 'in_progress' ? (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-xs font-bold px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 mr-1 inline" /> Assessment In Progress
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-2.5 py-1">
                  Technical Verification · 15 minutes
                </Badge>
              )}
            </div>

            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {profile?.verificationStatus === 'verified'
                ? 'Your Engineering Profile is Verified'
                : profile?.verificationStatus === 'in_progress'
                ? 'Resume Your Technical Verification'
                : 'Get FastTrack Verified in 15 Minutes'}
            </h2>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              {profile?.verificationStatus === 'verified'
                ? 'You have completed the technical assessment cycle. Your profile is prioritized in search and routed directly to hiring teams with your verified scorecard.'
                : 'Assessment covers role-specific architecture, technical problem solving, and scenario evaluation (15 min). Unlocks the FastTrack badge and direct routing to verified remote employers.'}
            </p>
          </div>

          <Link href="/dashboard/sandbox">
            <Button
              size="sm"
              className="gap-1.5 shrink-0 text-xs font-semibold min-h-[44px] px-4 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 inline-flex items-center"
            >
              {profile?.verificationStatus === 'verified' ? (
                <>
                  <span>View Scorecard</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </>
              ) : profile?.verificationStatus === 'in_progress' ? (
                <>
                  <span>Resume Assessment</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </>
              ) : (
                <>
                  <span>Start Assessment (15m)</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Header & Global Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Remote Opportunities
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Open positions with direct application endpoints for Worldwide, EMEA, and African talent.
          </p>
        </div>

        {/* Global Controls: Period Toggle & Catalog Info */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Period:
            </span>
            <Select value={displayPeriod} onValueChange={(val: DisplayPeriod) => handlePeriodChange(val)}>
              <SelectTrigger className="h-8 text-xs w-[105px] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original" className="text-xs">Original</SelectItem>
                <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                <SelectItem value="yearly" className="text-xs">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          {/* Catalog updated timestamp & Tracker link */}
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Catalog updated: {timeAgoText}
          </span>

          <Link href="/dashboard/tracker">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3.5 rounded-lg border-neutral-200 dark:border-neutral-800 font-medium text-neutral-700 dark:text-neutral-300"
            >
              Tracker ({savedJobIds.size})
            </Button>
          </Link>
        </div>
      </div>

      {/* Department Chips (Hides any category with 0 jobs & updates live) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold uppercase tracking-wider text-xs">
            Filter by Department
          </span>
          <span className="font-medium">
            Showing {Math.min(visibleCount, filteredJobs.length)} of {filteredJobs.length}{' '}
            {filteredJobs.length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {/* All Roles Chip */}
          <button
            type="button"
            aria-pressed={selectedCategory === 'All'}
            onClick={() => setSelectedCategory('All')}
            className={`text-xs min-h-[44px] px-4 py-2 rounded-full transition-colors whitespace-nowrap font-medium inline-flex items-center justify-center ${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            All Roles ({categoryCounts['All'] || 0})
          </button>

          {/* Only render categories with count > 0 */}
          {visibleCategories.map((cat) => {
            const meta = JOB_CATEGORIES_META[cat];
            const active = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs min-h-[44px] px-4 py-2 rounded-full transition-colors whitespace-nowrap font-medium inline-flex items-center justify-center ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Search Input, Filters Toggle with Count Badge, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input (Debounced 300ms across title, company, skills, description) */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[1.5] text-neutral-400" />
          <Input
            type="search"
            aria-label="Search remote jobs by title, company, or skills"
            placeholder="Search title, company, skills, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12 text-base sm:text-sm min-h-[44px] h-11 border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          )}
        </div>

        {/* Right Action Controls: Filters Toggle Button & Sort Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Collapsible Filters Toggle Button with Active Count Badge */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={isFiltersOpen}
                aria-controls="filter-options-panel"
                className={`min-h-[44px] h-11 px-4 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center gap-1.5 ${
                  isFiltersOpen || activeFiltersCount > 0
                    ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform stroke-[1.5] ${isFiltersOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Sort Dropdown: Best match (Default), Newest, Salary high to low */}
          <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
            <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400 shrink-0 stroke-[1.5]" />
                <span className="truncate">Sort: {sortByLabels[sortBy]}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_match">Best match (Default)</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="salary_desc">Salary high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Filters Panel */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent id="filter-options-panel" className="transition-all animate-in fade-in-50 duration-200">
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 space-y-5">
            {/* Filter Section Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 stroke-[1.5] text-neutral-700 dark:text-neutral-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  Filter Opportunities
                </h4>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full font-semibold">
                    {activeFiltersCount} Active
                  </Badge>
                )}
              </div>

              {/* Clear All Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3 stroke-[1.5]" /> Clear all
                </button>
              )}
            </div>

            {/* Grid of Standard Job-Board Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* 1. Seniority: Entry, Mid, Senior, Lead/Staff */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                  <span>Seniority</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SENIORITY_OPTIONS.map((sen) => {
                    const active = selectedSeniority.includes(sen);
                    return (
                      <button
                        key={sen}
                        onClick={() => handleToggleSeniority(sen)}
                        type="button" aria-pressed={active} className={`text-xs min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center ${
                          active
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                            : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                        }`}
                      >
                        {sen}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Job Type: Full-time, Contract, Part-time */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                  <span>Job Type</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_TYPE_OPTIONS.map((type) => {
                    const active = selectedJobTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleToggleJobType(type)}
                        type="button" aria-pressed={active} className={`text-xs min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center ${
                          active
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                            : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Open to Nigeria / Africa, Saved Only, Show Expired Toggles */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                    <span>Location & Status</span>
                  </span>
                </div>

                {/* Open to Africa toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Open to Nigeria / Africa
                    </span>
                    <span className="text-xs text-neutral-500 block">Worldwide & African eligible</span>
                  </div>
                  <Switch
                    checked={openToAfricaOnly}
                    onCheckedChange={setOpenToAfricaOnly}
                    aria-label="Toggle open to Nigeria or Africa"
                  />
                </div>

                {/* Saved only toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Saved Only
                    </span>
                    <span className="text-xs text-neutral-500 block">Bookmarked in your tracker</span>
                  </div>
                  <Switch
                    checked={savedOnly}
                    onCheckedChange={setSavedOnly}
                    aria-label="Toggle saved jobs only"
                  />
                </div>

                {/* Show expired toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Show expired
                    </span>
                    <span className="text-xs text-neutral-500 block">Include past expires_at</span>
                  </div>
                  <Switch
                    checked={showExpired}
                    onCheckedChange={setShowExpired}
                    aria-label="Toggle show expired jobs"
                  />
                </div>
              </div>

              {/* 4. Minimum Annualized Salary Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                  <span>Salary Range</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SALARY_PRESETS.map((preset) => {
                    const active = minSalary === preset.value;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setMinSalary(preset.value)}
                        type="button" aria-pressed={active} className={`text-xs min-h-[44px] px-3.5 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center ${
                          active
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                            : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Skills Multi-Select (Searchable) */}
            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                  <span>Skills & Tech Stack ({selectedSkills.length} selected)</span>
                </label>

                {/* Skill search filter */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 stroke-[1.5] text-neutral-400" />
                  <Input
                    placeholder="Search skills (e.g. React, Python)..."
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg"
                  />
                  {skillSearchQuery && (
                    <button
                      type="button"
                      aria-label="Clear skill search query"
                      onClick={() => setSkillSearchQuery('')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filteredAvailableSkills.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors inline-flex items-center gap-1 ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                          : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                      }`}
                    >
                      <span>{skill}</span>
                      {active && <Check className="h-3 w-3 stroke-[2]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* State View 1: Loading Skeleton */}
      {loading ? (
        <JobFeedLoadingSkeleton />
      ) : hasError ? (
        /* State View 2: Error with Retry */
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Unable to load remote opportunities
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              We encountered a connection issue fetching the latest openings. Please retry or browse cached roles.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => loadData(true)}
            className="text-xs font-semibold h-9 px-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Retry Connection
          </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        /* State View 3: Empty Results with Clear Filters Button */
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-12 text-center space-y-3">
          <Search className="h-8 w-8 text-neutral-400 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            No jobs match your filters
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Try adjusting your search query, expanding seniority levels, or resetting active filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAllFilters}
            className="mt-2 text-xs font-semibold h-9 px-4 rounded-lg border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        /* State View 4: Filtered Job Listings Feed & Pagination */
        <div className="space-y-6">
          {/* Accessible live region for dynamic search results */}
          <div role="status" aria-live="polite" className="sr-only">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'position found' : 'positions found'}
          </div>
          {/* Top Section: Recommended for You (Requirement 3) */}
          {recommendedJobs.length > 0 && (
            <div className="p-5 rounded-2xl border border-blue-200/80 dark:border-blue-950/60 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/20 dark:via-neutral-950 dark:to-indigo-950/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Recommended for You
                    </h2>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      Top Matches
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Highest alignment computed against your skills, target roles, seniority fit, and location preferences.
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Edit Profile & Preferences</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {recommendedJobs.map(({ job, match }) => (
                  <Card
                    key={`rec-${job.id}`}
                    onClick={() => handleOpenJobDetail(job.id)}
                    className="group flex flex-col justify-between border border-blue-200/60 dark:border-blue-900/40 bg-white/90 dark:bg-neutral-950/80 rounded-xl p-4 hover:border-blue-400 transition-all shadow-none cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 truncate">
                          {job.company_name || job.company}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30 px-1.5 py-0.5 rounded">
                          {match.score}% match
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>

                      <p className="text-xs text-neutral-500 line-clamp-1">
                        {match.reason}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between gap-1 text-xs">
                      <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate">
                        <SalaryDisplay job={job} period={displayPeriod} />
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                        View details <span className="sr-only">for {job.title}</span> →
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Profile Setup Prompt if not filled */}
          {(!profile?.skills?.length && !profile?.targetRoles?.length) && (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Want tailored recommendations?
                </span>
                <p className="text-neutral-500">
                  Complete your candidate profile to see your top 3 matches calculated by honest multi-factor fit.
                </p>
              </div>
              <Link href="/dashboard/profile">
                <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-lg border-neutral-200 dark:border-neutral-800 font-semibold shrink-0">
                  Complete Profile →
                </Button>
              </Link>
            </div>
          )}

          {/* Result Count Info Header */}
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Showing {Math.min(visibleCount, filteredJobs.length)} of {filteredJobs.length}{' '}
              {filteredJobs.length === 1 ? 'job' : 'jobs'}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paginatedJobs.map((job) => {
              const identifier = job.id || job.external_id;
              const isSaved =
                savedJobIds.has(job.id) ||
                savedJobIds.has(job.external_id) ||
                savedJobIds.has(`remotive-${job.id}`);
              const categoryMeta = getCategoryMeta(job.category || '');
              const seniority = job.seniority || detectSeniority(job);

              const isClosedWarning = isOlderThan30Days(job.posted_at || job.published_at);
              const cleanSkills = extractCleanSkills(job.tags || job.skills, job.company_name || job.company, job.source_name || job.source);

              return (
                <Card
                  key={identifier || job.url}
                  onClick={() => handleOpenJobDetail(job.id)}
                  className="group flex flex-col justify-between border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-none cursor-pointer"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Top Bar: Company / Agency Line & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                          {job.company_name || job.company}
                        </span>

                        {/* Agency Listing Badge with Tooltip */}
                        {job.employer_type === 'agency' && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 cursor-help"
                            title="This role is posted by a staffing/outsourcing company on behalf of a client."
                            onClick={(e) => e.stopPropagation()}
                          >
                            Agency listing
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Featured Partner Pill */}
                        {job.is_featured && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ★ Featured
                          </span>
                        )}
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900">
                          {job.location_tier}
                        </span>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {categoryMeta.shortLabel}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 font-semibold">
                          {seniority}
                        </span>
                      </div>
                    </div>

                    {/* Job Title */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-snug">
                        <Link
                          href={`/dashboard/jobs/${job.id}?${searchParams.toString()}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {job.title}
                        </Link>
                      </h3>

                      {/* Metadata Line */}
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        <span>{job.candidate_required_location || 'Remote'}</span>
                        <span className="mx-1.5">·</span>
                        <span>{job.job_type || 'Full-time'}</span>
                        <span className="mx-1.5">·</span>
                        <SalaryDisplay
                          job={job}
                          period={displayPeriod}
                          className="text-neutral-900 dark:text-neutral-200 font-semibold"
                        />
                      </p>

                      {/* Freshness & Source under the meta line */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                        <span>
                          Posted {formatPostedAgo(job.posted_at || job.published_at)} · via {job.source_name || job.source || 'Direct'}
                        </span>

                        {isClosedWarning && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                            May be closed
                          </span>
                        )}

                        {/* Eligibility Badge */}
                        <span className="ml-auto">
                          {job.open_to_nigeria ? (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              Status: Open to Nigeria
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                              Status: Not open to Nigeria
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Honest AI Match Score Bar & One-line Reason (Requirement 2) */}
                    {(() => {
                      const match = computeJobMatchScore(job, profile);
                      if (match.isProfileComplete && match.score !== null) {
                        return (
                          <div className="p-2.5 rounded-lg bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200/70 dark:border-neutral-800/80 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  {match.score}% match
                                </span>
                                <div className="w-20 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      match.score >= 80 ? 'bg-emerald-500' : match.score >= 65 ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${match.score}%` }}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportDialogJob({
                                    id: job.id,
                                    title: job.title,
                                    company: job.company_name || job.company,
                                    score: match.score,
                                  });
                                }}
                                className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline font-medium cursor-pointer"
                              >
                                Report a bad match
                              </button>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                              {match.reason}
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="px-2.5 py-1.5 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-neutral-400" />
                              Complete your profile to see match scores
                            </span>
                            <Link
                              href="/dashboard/profile"
                              onClick={(e) => e.stopPropagation()}
                              className="text-neutral-700 dark:text-neutral-300 font-semibold hover:underline text-xs"
                            >
                              Set up →
                            </Link>
                          </div>
                        );
                      }
                    })()}

                    {/* Role Description Preview */}
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3">
                      {job.description}
                    </p>

                    {/* Skills / Tech Tags (Capped at 4, with +N more opening detail view) */}
                    {cleanSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {cleanSkills.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {cleanSkills.length > 4 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenJobDetail(job.id);
                            }}
                            className="text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer"
                          >
                            +{cleanSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Verification Label & Action Buttons */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        {job.last_verified_at ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 cursor-help"
                            title="The application link and role status were checked and verified active by Sync730."
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Link checked {formatStandardDate(job.last_verified_at)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            Verified remote feed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Tailor ATS Resume */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTailorTargetJob({
                              title: job.title,
                              company: job.company_name || job.company,
                              location: job.candidate_required_location || job.location_tier,
                              description: job.description || '',
                              salary: job.salary || undefined,
                              category: job.category || 'Software & Engineering',
                            });
                            setIsTailorPanelOpen(true);
                          }}
                          aria-label={`Tailor resume for ${job.title} at ${job.company_name || job.company}`}
                          className="text-xs min-h-[44px] h-11 px-3.5 rounded-lg border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 font-medium inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 stroke-[1.5] text-amber-500" />
                          Tailor Resume
                        </Button>

                        {/* Save Button (Fixed Width w-[90px] so layout does not shift on toggle) */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleToggleSaveJob(e, job)}
                          aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title} to saved jobs`}
                          className={`min-h-[44px] h-11 px-3 w-[100px] text-xs rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1 ${
                            isSaved
                              ? 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 bg-neutral-100/60 dark:bg-neutral-900'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3.5 w-3.5 stroke-[1.5]" />
                              <span>Save</span>
                            </>
                          )}
                        </Button>

                        {/* Apply Directly Button */}
                        <Button
                          size="sm"
                          onClick={(e) => handleApplyClick(e, job)}
                          aria-label={`Apply directly for ${job.title} at ${job.company_name || job.company}`}
                          className="text-xs min-h-[44px] h-11 px-4 rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Apply Directly</span>
                          <ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5]" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination: Load More Button (12 at a time) */}
          {visibleCount < filteredJobs.length && (
            <div className="flex flex-col items-center justify-center pt-6 pb-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="text-xs font-semibold h-10 px-6 rounded-xl border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950 shadow-xs"
              >
                Load more ({filteredJobs.length - visibleCount} remaining)
              </Button>
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Showing {Math.min(visibleCount, filteredJobs.length)} of {filteredJobs.length} positions
              </span>
            </div>
          )}
        </div>
      )}

      {/* Follow-up Apply Confirmation Dialog */}
      <Dialog open={showApplyConfirmDialog} onOpenChange={setShowApplyConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Did you apply to {pendingApplyJob?.title}?
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              We noticed you opened the application page in another tab. If you completed your application, we can move it to Applied in your Tracker.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmApplyDialog(false)}
              className="text-xs h-9"
            >
              Not yet
            </Button>
            <Button
              size="sm"
              onClick={() => handleConfirmApplyDialog(true)}
              className="text-xs h-9 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
            >
              Yes, I applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ethical AI Disclosure Footer (Requirement 8) */}
      <div className="pt-6 pb-2 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-700 dark:text-neutral-300 font-medium">
        Scores and suggestions are AI-generated and may be wrong. You decide where to apply.
      </div>

      {/* Resume ATS Tailoring Side Panel (Requirement 5) */}
      <TailorResumePanel
        isOpen={isTailorPanelOpen}
        onClose={() => {
          setIsTailorPanelOpen(false);
          setTailorTargetJob(null);
        }}
        job={tailorTargetJob}
      />

      {/* Report Bad Match Dialog (Requirement 8) */}
      {reportDialogJob && (
        <ReportMatchDialog
          isOpen={Boolean(reportDialogJob)}
          onClose={() => setReportDialogJob(null)}
          jobId={reportDialogJob.id}
          jobTitle={reportDialogJob.title}
          companyName={reportDialogJob.company}
          currentScore={reportDialogJob.score}
        />
      )}
    </div>
  );
}

function JobFeedLoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 max-w-7xl mx-auto">
      <span className="sr-only">Loading remote opportunities...</span>
      <div className="h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-6 space-y-4 bg-white dark:bg-neutral-950"
          >
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-28 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 rounded" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CrawlerJobFeedPage() {
  return (
    <Suspense fallback={<JobFeedLoadingSkeleton />}>
      <CrawlerJobFeedContent />
    </Suspense>
  );
}
