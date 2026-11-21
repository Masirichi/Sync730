'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Search,
  ShieldCheck,
  Building2,
  Globe,
  Coins,
  ArrowRight,
  Clock,
  Check,
  X,
  Flag,
  ChevronDown,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import SalaryDisplay from '@/components/ui/SalaryDisplay';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { AdminRemoteJob } from '@/lib/admin/types';
import {
  getAdminRemoteJobs,
  saveAdminRemoteJob,
  deleteAdminRemoteJob,
  toggleAdminJobActive,
  toggleAdminJobFeatured,
  SEED_ADMIN_REMOTE_JOBS,
  SAMPLE_NIGERIA_ROLES,
} from '@/lib/admin/store';
import {
  JobPlatform,
  detectJobPlatform,
  getJobPlatformInfo,
  ALL_SUPPORTED_PLATFORMS,
  optimizeUrlForPlatform,
} from '@/lib/jobs/platform-detector';

function RolesManagerContent() {
  const [activeTab, setActiveTab] = useState<'remote' | 'employer'>('remote');

  useEffect(() => {
    document.title = 'Roles | Command Center';
  }, []);
  const searchParams = useSearchParams();
  const [remoteJobs, setRemoteJobs] = useState<AdminRemoteJob[]>(() => {
    return getAdminRemoteJobs();
  });
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // React to URL search params (e.g. /command/roles?status=needs_review or ?filter=going_stale)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');
    if (statusParam === 'needs_review' || statusParam === 'needs-review') {
      setStatusFilter('NEEDS_REVIEW');
    } else if (filterParam === 'going_stale') {
      setStatusFilter('GOING_STALE');
    }
  }, [searchParams]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [careerUrl, setCareerUrl] = useState('');
  const [regionAllowance, setRegionAllowance] = useState<'Worldwide' | 'EMEA' | 'Africa Only'>('Worldwide');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [workMode, setWorkMode] = useState<'REMOTE' | 'HYBRID' | 'ONSITE'>('REMOTE');
  const [cityLocation, setCityLocation] = useState<string>('Remote (Worldwide / Africa)');
  const [customCityLocation, setCustomCityLocation] = useState<string>('');
  const [sourcePlatform, setSourcePlatform] = useState<JobPlatform>('direct');
  const [isSeedingNigeria, setIsSeedingNigeria] = useState<boolean>(false);

  const handleCareerUrlChange = (url: string) => {
    setCareerUrl(url);
    const detected = detectJobPlatform(url);
    setSourcePlatform(detected);
  };

  // Live Sync State (Platform Admin Exclusive)
  const [syncingLive, setSyncingLive] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sync730_admin_last_synced_at');
      if (stored) return parseInt(stored, 10);
    }
    return Date.now() - 300000;
  });
  const [timeAgoText, setTimeAgoText] = useState<string>('5 minutes ago');

  useEffect(() => {
    const calcTimeAgo = (ts: number) => {
      const diffSec = Math.floor((Date.now() - ts) / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin === 1) return '1 minute ago';
      if (diffMin < 60) return `${diffMin} minutes ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr === 1) return '1 hour ago';
      return `${diffHr} hours ago`;
    };

    setTimeAgoText(calcTimeAgo(lastSyncedAt));
    const interval = setInterval(() => {
      setTimeAgoText(calcTimeAgo(lastSyncedAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const [isCrawlerDialogOpen, setIsCrawlerDialogOpen] = useState(false);
  const [lastCrawlCount, setLastCrawlCount] = useState<number | null>(null);

  const handleTriggerCrawler = async (reason: string) => {
    setSyncingLive(true);
    toast.info('Triggering multi-source crawl across 4 verified sources...');
    try {
      const res = await fetch('/api/admin/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason,
          source: 'all',
          category: 'all',
        }),
      });
      const data = await res.json();
      const now = Date.now();
      setLastSyncedAt(now);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sync730_admin_last_synced_at', now.toString());
      }
      if (data.success) {
        const count = data.total_processed || 0;
        setLastCrawlCount(count);
        toast.success(
          `Crawl completed: ${count} roles ingested into Needs Review queue (hidden from public board).`
        );
        setIsCrawlerDialogOpen(false);
        await loadJobs();
      } else {
        toast.error(data.error || 'Live crawler run failed.');
      }
    } catch {
      toast.error('Crawler network timeout. Please verify and retry.');
    } finally {
      setSyncingLive(false);
    }
  };

  const handleSyncLiveJobs = async () => {
    setSyncingLive(true);
    toast.info('Crawling verified sources: RemoteOK, DevGlobalJobs, Himalayas, Jobicy, Remotive, Arbeitnow...');
    try {
      const res = await fetch('/api/cron/crawl-jobs', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      const now = Date.now();
      setLastSyncedAt(now);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sync730_admin_last_synced_at', now.toString());
      }
      if (data.success) {
        toast.success(
          data.total_processed && data.total_processed > 0
            ? `Sync complete: ${data.total_processed} live jobs processed across 11 sources.`
            : 'Job crawl complete; all feeds synchronized.'
        );
        await loadJobs();
      } else {
        toast.error(data.error || 'Live crawl failed.');
      }
    } catch {
      toast.error('Crawl network error or timeout. Serving latest catalog.');
    } finally {
      setSyncingLive(false);
    }
  };

  // Load jobs from API and Store
  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/jobs');
      const data = await res.json();
      const localJobs = getAdminRemoteJobs();
      if (data.success && data.remote_jobs && data.remote_jobs.length > 0) {
        const merged = [...data.remote_jobs];
        localJobs.forEach((lj) => {
          if (!merged.some((m) => m.id === lj.id || (m.title === lj.title && m.company === lj.company))) {
            merged.unshift(lj);
          }
        });
        setRemoteJobs(merged);
        setEmployerJobs(data.employer_jobs || []);
      } else {
        // Fallback to local store
        setRemoteJobs(getAdminRemoteJobs());
      }
    } catch {
      setRemoteJobs(getAdminRemoteJobs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

    const handleUpdate = () => {
      loadJobs();
    };

    window.addEventListener('sync730_admin_jobs_updated', handleUpdate);
    window.addEventListener('sync730_remote_jobs_updated', handleUpdate);
    return () => {
      window.removeEventListener('sync730_admin_jobs_updated', handleUpdate);
      window.removeEventListener('sync730_remote_jobs_updated', handleUpdate);
    };
  }, []);

  // Compute KPI Metrics
  const stats = useMemo(() => {
    const total = remoteJobs.length;
    const active = remoteJobs.filter((j) => j.is_active).length;
    const adminCurated = remoteJobs.filter((j) => j.source_type === 'ADMIN_CURATED').length;
    const featured = remoteJobs.filter((j) => j.is_featured && j.is_active).length;
    return { total, active, adminCurated, featured };
  }, [remoteJobs]);

  // Seed Nigerian Hybrid & Onsite Roles Dev Button
  const handleSeedNigeriaRoles = async () => {
    setIsSeedingNigeria(true);
    toast.info('Seeding Nigerian tech roles (Lagos Hybrid and Remote)...');
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_nigeria' }),
      });
      const data = await res.json();
      if (data.success) {
        SAMPLE_NIGERIA_ROLES.forEach((r) => saveAdminRemoteJob(r));
        toast.success('Successfully seeded Nigerian roles to the board!');
        await loadJobs();
      } else {
        SAMPLE_NIGERIA_ROLES.forEach((r) => saveAdminRemoteJob(r));
        toast.success('Seeded Nigerian roles to local store.');
        await loadJobs();
      }
    } catch {
      SAMPLE_NIGERIA_ROLES.forEach((r) => saveAdminRemoteJob(r));
      toast.success('Seeded Nigerian roles to local store.');
      await loadJobs();
    } finally {
      setIsSeedingNigeria(false);
    }
  };

  // Handle Post New Verified Job
  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resolvedCompany = (companyName || (formData.get('company_name') as string) || '').trim();
    const resolvedTitle = (jobTitle || (formData.get('job_title') as string) || '').trim();
    const resolvedUrl = (careerUrl || (formData.get('career_url') as string) || '').trim();
    const resolvedSalary = (salaryRange || (formData.get('salary_range') as string) || '').trim();
    const resolvedDesc = (jobDescription || (formData.get('job_description') as string) || '').trim();
    const resolvedCity = cityLocation === 'CUSTOM' ? customCityLocation.trim() : cityLocation.trim();

    if (!resolvedCompany || !resolvedTitle || !resolvedUrl) {
      toast.error('Please fill in Company Name, Job Title, and Career URL.');
      return;
    }

    const cleanPlatform = sourcePlatform || detectJobPlatform(resolvedUrl);
    const optimizedUrl = optimizeUrlForPlatform(resolvedUrl);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: resolvedCompany,
          job_title: resolvedTitle,
          career_url: optimizedUrl,
          region_allowance: regionAllowance,
          salary_range: resolvedSalary,
          job_description: resolvedDesc,
          is_featured: isFeatured,
          work_mode: workMode,
          city_location: resolvedCity,
          source_platform: cleanPlatform,
          platform: cleanPlatform,
        }),
      });

      const data = await res.json();
      if (data.success && data.job) {
        toast.success(`Published verified role: "${resolvedTitle}" at ${resolvedCompany}`);
        saveAdminRemoteJob(data.job);
        // Add to local state immediately
        setRemoteJobs((prev) => [data.job, ...prev.filter((j) => j.id !== data.job.id)]);
        // Reset form & close modal
        setCompanyName('');
        setJobTitle('');
        setCareerUrl('');
        setSourcePlatform('direct');
        setSalaryRange('');
        setJobDescription('');
        setWorkMode('REMOTE');
        setCityLocation('Remote (Worldwide / Africa)');
        setCustomCityLocation('');
        setIsFeatured(false);
        setIsModalOpen(false);
        loadJobs();
      } else {
        toast.error(data.error || 'Failed to post job.');
      }
    } catch (err: any) {
      // Local fallback
      const fallbackJob: AdminRemoteJob = {
        id: `admin-job-${Date.now()}`,
        external_id: `ext-${Date.now().toString(36)}`,
        title: resolvedTitle,
        company: resolvedCompany,
        career_url: resolvedUrl,
        url: resolvedUrl,
        location_tier: regionAllowance,
        candidate_required_location: resolvedCity || (regionAllowance === 'Africa Only' ? 'Africa' : regionAllowance),
        work_mode: workMode,
        city_location: resolvedCity,
        salary: resolvedSalary || null,
        description: resolvedDesc || 'Verified role posted directly by Platform Admin.',
        category: 'Software & Engineering',
        job_type: 'Full-time',
        tags: ['Role verified', 'Platform Curated', regionAllowance, workMode],
        source: 'company_direct',
        source_type: 'ADMIN_CURATED',
        is_active: true,
        is_featured: isFeatured,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      saveAdminRemoteJob(fallbackJob);
      setRemoteJobs((prev) => [fallbackJob, ...prev]);
      toast.success(`Published verified role: "${resolvedTitle}" at ${resolvedCompany}`);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Instant 1-Click Role Deletion (No special security measures or prompt)
  const handleDeleteRole = async (job: AdminRemoteJob) => {
    deleteAdminRemoteJob(job.id);
    setRemoteJobs((prev) => prev.filter((j) => j.id !== job.id && j.external_id !== job.id));
    toast.success(`Role "${job.title}" at ${job.company} permanently deleted.`);

    try {
      await fetch(`/api/admin/jobs?id=${encodeURIComponent(job.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend delete note:', err);
    }
  };

  // Toggle Active / Taken Down
  const handleToggleActive = async (job: AdminRemoteJob) => {
    const optimisticStatus = !job.is_active;
    // Optimistic UI update
    setRemoteJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, is_active: optimisticStatus } : j))
    );

    try {
      const res = await fetch('/api/admin/jobs/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          is_active: job.is_active,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toggleAdminJobActive(job.id, job.is_active);
        toast.success(
          optimisticStatus
            ? `Republished "${job.title}" to candidate feed.`
            : `Taken down "${job.title}" from candidate feed.`
        );
      } else {
        // Revert on error
        setRemoteJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, is_active: job.is_active } : j))
        );
        toast.error(data.error || 'Failed to update job status.');
      }
    } catch {
      // Offline fallback: store updated locally
      toggleAdminJobActive(job.id, job.is_active);
      toast.success(
        optimisticStatus
          ? `Republished "${job.title}" to candidate feed (local).`
          : `Taken down "${job.title}" from candidate feed (local).`
      );
    }
  };

  // Toggle Featured (Pin to top)
  const handleToggleFeatured = async (job: AdminRemoteJob) => {
    const optimisticFeatured = !job.is_featured;
    setRemoteJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, is_featured: optimisticFeatured } : j))
    );

    try {
      const res = await fetch('/api/admin/jobs/toggle-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          is_featured: job.is_featured,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toggleAdminJobFeatured(job.id, job.is_featured);
        toast.success(
          optimisticFeatured
            ? `Pinned "${job.title}" as Featured Partner at top of feed.`
            : `Unpinned "${job.title}" from featured positions.`
        );
      } else {
        setRemoteJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, is_featured: job.is_featured } : j))
        );
        toast.error(data.error || 'Failed to update featured status.');
      }
    } catch {
      toggleAdminJobFeatured(job.id, job.is_featured);
      toast.success(
        optimisticFeatured
          ? `Pinned "${job.title}" as Featured Partner (local).`
          : `Unpinned "${job.title}" from featured positions (local).`
      );
    }
  };

  // Filtered Remote Jobs
  const filteredRemoteJobs = useMemo(() => {
    return remoteJobs.filter((job) => {
      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q);

      // Tier filter
      const matchesTier = tierFilter === 'ALL' || job.location_tier === tierFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = Boolean(job.is_active && (job as any).status !== 'needs_review');
      } else if (statusFilter === 'TAKEN_DOWN' || statusFilter === 'INACTIVE') {
        matchesStatus = !job.is_active || (job as any).status === 'removed';
      } else if (statusFilter === 'NEEDS_REVIEW') {
        const s = (job as any).status || (job as any).review_status;
        matchesStatus = s === 'needs_review' || s === 'needs-review' || s === 'ingested';
      } else if (statusFilter === 'GOING_STALE') {
        if (!job.is_active) {
          matchesStatus = false;
        } else {
          const verifiedStr = job.last_verified_at || (job as any).verified_at || job.published_at || job.created_at;
          const vTime = verifiedStr ? new Date(verifiedStr).getTime() : NaN;
          if (!isNaN(vTime)) {
            const ageDays = (Date.now() - vTime) / (24 * 60 * 60 * 1000);
            matchesStatus = ageDays >= 11 && ageDays <= 14;
          } else {
            matchesStatus = false;
          }
        }
      }

      // Source & Platform filter
      let matchesSource = true;
      if (sourceFilter === 'ALL') {
        matchesSource = true;
      } else if (sourceFilter === 'ADMIN') {
        matchesSource = job.source_type === 'ADMIN_CURATED';
      } else if (sourceFilter === 'CRAWLER') {
        matchesSource = job.source_type !== 'ADMIN_CURATED';
      } else {
        const p = job.source_platform || (job as any).platform || detectJobPlatform(job.career_url || job.url || job.apply_url);
        matchesSource = p === sourceFilter;
      }

      return matchesQuery && matchesTier && matchesStatus && matchesSource;
    });
  }, [remoteJobs, searchQuery, tierFilter, statusFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      {/* 3. PAGE HEADER: Exactly one h1 and one line of description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Roles
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review crawled listings, manage employer postings, and verify partner roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-neutral-400 font-medium hidden md:inline">
            Last synced: {timeAgoText}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCrawlerDialogOpen(true)}
            disabled={syncingLive}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 hover:text-white gap-2 shadow-xs transition-colors"
          >
            <Clock className={`h-3.5 w-3.5 ${syncingLive ? 'animate-spin text-emerald-400' : 'text-neutral-400'}`} />
            <span>{syncingLive ? 'Crawling...' : 'Trigger Remote Job Crawler'}</span>
          </Button>

          {/* Add job Trigger */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 gap-1.5 shadow-sm"
              >
                <span>Add job</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto bg-[#0e0e12] border-neutral-800 text-neutral-100 p-4 sm:p-6 md:p-7 rounded-2xl shadow-2xl">
              <DialogHeader>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider w-fit mb-1.5">
                  <ShieldCheck className="h-3 w-3 stroke-[2]" />
                  <span>Added by Sync730</span>
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Add job
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
                  Directly post a vetted technical role optimized for cross-platform candidate applications across all devices and ATS providers.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
                {/* Row 1: Company & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Company Name *
                    </Label>
                    <Input
                      name="company_name"
                      required
                      placeholder="e.g. Sync730 Partner Labs"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Job Title *
                    </Label>
                    <Input
                      name="job_title"
                      required
                      placeholder="e.g. Senior Cloud Architect"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* Row 2: Career URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Direct Career / Application URL *
                    </Label>
                    {careerUrl && (
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-semibold ${getJobPlatformInfo(sourcePlatform).badgeClass}`}>
                        {getJobPlatformInfo(sourcePlatform).shortName}
                      </span>
                    )}
                  </div>
                  <Input
                    name="career_url"
                    type="url"
                    required
                    placeholder="https://company.com/careers/role (Manatal, Mercor, Greenhouse, Lever, Ashby, etc.)"
                    value={careerUrl}
                    onChange={(e) => handleCareerUrlChange(e.target.value)}
                    className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                  />
                </div>

                {/* Row 2b: ATS & Sourcing Platform */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-neutral-300">
                      ATS & Sourcing Platform *
                    </Label>
                    <span className="text-[10px] text-neutral-400">
                      Auto-detected from URL
                    </span>
                  </div>
                  <Select
                    value={sourcePlatform}
                    onValueChange={(val: JobPlatform) => setSourcePlatform(val)}
                  >
                    <SelectTrigger className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-60">
                      {ALL_SUPPORTED_PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{p.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${p.badgeClass}`}>
                              {p.shortName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-neutral-400">
                    Optimizes application links for cross-platform candidate applications across iOS, Android, and Desktop.
                  </p>
                </div>

                {/* Row 3: Region Allowance & Salary Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Open to *
                    </Label>
                    <Select
                      value={regionAllowance}
                      onValueChange={(val: any) => setRegionAllowance(val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white">
                        <SelectValue placeholder="Select Region" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                        <SelectItem value="Worldwide">Worldwide (Anywhere)</SelectItem>
                        <SelectItem value="EMEA">EMEA (Europe, Middle East, Africa)</SelectItem>
                        <SelectItem value="Africa Only">Africa Only (African Talent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Salary Range (Optional)
                    </Label>
                    <Input
                      name="salary_range"
                      placeholder="e.g. $120,000 - $150,000 / yr"
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* Row 3b: Work Mode & City Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Work Mode *
                    </Label>
                    <Select
                      value={workMode}
                      onValueChange={(val: any) => setWorkMode(val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white">
                        <SelectValue placeholder="Select Work Mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                        <SelectItem value="REMOTE">Remote (100% Distributed)</SelectItem>
                        <SelectItem value="HYBRID">Hybrid (Flexible Office / Remote)</SelectItem>
                        <SelectItem value="ONSITE">Onsite (Full Office Presence)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      City / Location *
                    </Label>
                    <Select
                      value={cityLocation}
                      onValueChange={(val: any) => setCityLocation(val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white">
                        <SelectValue placeholder="Select Location Preset" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                        <SelectItem value="Lagos, Nigeria">Lagos, Nigeria</SelectItem>
                        <SelectItem value="Port Harcourt, Nigeria">Port Harcourt, Nigeria</SelectItem>
                        <SelectItem value="Remote (Worldwide / Africa)">Remote (Worldwide / Africa)</SelectItem>
                        <SelectItem value="CUSTOM">Custom Specific Locality...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {cityLocation === 'CUSTOM' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Specific Locality (e.g. Lekki, Lagos or Victoria Island) *
                    </Label>
                    <Input
                      placeholder="e.g. Lekki Phase 1, Lagos, Nigeria"
                      value={customCityLocation}
                      onChange={(e) => setCustomCityLocation(e.target.value)}
                      className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                    />
                  </div>
                )}

                {/* Row 4: Job Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-300">
                    Job Description & Qualifications *
                  </Label>
                  <Textarea
                    name="job_description"
                    required
                    rows={4}
                    placeholder="Describe role responsibilities, required tech stack, and experience level..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500 leading-relaxed"
                  />
                </div>

                {/* Row 5: Featured Toggle Switch */}
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400 stroke-[2]" />
                      <span className="text-xs font-bold text-white">
                        Pin as Featured Role
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Pins this listing to the very top of the candidate board with a golden badge.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <DialogFooter className="pt-2 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-9 px-4"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <span>Publish to Candidate Board</span>
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 stroke-[2]" />
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-[#0e0e12] border-neutral-800/80 rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Total Listings</span>
              <Briefcase className="h-4 w-4 stroke-[1.5] text-neutral-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-white">
              {stats.total}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Across all ingested & curated jobs</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e12] border-neutral-800/80 rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Active on Board</span>
              <Check className="h-4 w-4 stroke-[1.5] text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
              {stats.active}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Visible to African talent right now</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e12] border-neutral-800/80 rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Added by Sync730</span>
              <ShieldCheck className="h-4 w-4 stroke-[2] text-neutral-300" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
              {stats.adminCurated}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Direct role verified posts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e12] border-neutral-800/80 rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Featured Roles (Pinned)</span>
              <ShieldCheck className="h-4 w-4 stroke-[2] text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-400 tabular-nums">
              {stats.featured}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Pinned to the top of candidate feed</p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-800 pt-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('remote')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'remote'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Remote roles (Public feed)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {remoteJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('employer')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'employer'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Corporate Employer Postings</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {employerJobs.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'remote' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500 stroke-[1.5]" />
              <Input
                placeholder="Search by role title, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-[#0e0e12] border-neutral-800 text-white placeholder:text-neutral-500 rounded-xl"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs bg-[#0e0e12] border-neutral-800 text-neutral-200 rounded-xl w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="NEEDS_REVIEW">Needs review</SelectItem>
                  <SelectItem value="ACTIVE">Active / Live</SelectItem>
                  <SelectItem value="GOING_STALE">Going stale (≤ 3d)</SelectItem>
                  <SelectItem value="TAKEN_DOWN">Taken Down</SelectItem>
                </SelectContent>
              </Select>

              {/* Tier Filter */}
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="h-9 text-xs bg-[#0e0e12] border-neutral-800 text-neutral-200 rounded-xl w-[130px]">
                  <SelectValue placeholder="Region Tier" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="ALL">All Regions</SelectItem>
                  <SelectItem value="Worldwide">Worldwide</SelectItem>
                  <SelectItem value="EMEA">EMEA</SelectItem>
                  <SelectItem value="Africa Only">Africa Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Source Filter */}
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-9 text-xs bg-[#0e0e12] border-neutral-800 text-neutral-200 rounded-xl w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="ALL">All Sources & Platforms</SelectItem>
                  <SelectItem value="ADMIN">Admin Curated</SelectItem>
                  <SelectItem value="CRAWLER">Crawler Ingested</SelectItem>
                  <SelectItem value="manatal">Manatal ATS</SelectItem>
                  <SelectItem value="mercor">Mercor AI</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse ATS</SelectItem>
                  <SelectItem value="lever">Lever ATS</SelectItem>
                  <SelectItem value="ashby">Ashby ATS</SelectItem>
                  <SelectItem value="workable">Workable ATS</SelectItem>
                  <SelectItem value="direct">Direct Careers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Listings Table */}
          <div className="rounded-2xl border border-neutral-800/80 bg-[#0e0e12] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-12 text-center">Pin</th>
                    <th className="py-3.5 px-4">Role Title & Company</th>
                    <th className="py-3.5 px-4">Open to</th>
                    <th className="py-3.5 px-4">Salary Range</th>
                    <th className="py-3.5 px-4">Source Type</th>
                    <th className="py-3.5 px-4">Board Status</th>
                    <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredRemoteJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        No job listings match your active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRemoteJobs.map((job) => {
                      const isCurated = job.source_type === 'ADMIN_CURATED';

                      return (
                        <tr
                          key={job.id}
                          className={`hover:bg-neutral-900/40 transition-colors ${
                            !job.is_active ? 'opacity-60 bg-neutral-950/40' : ''
                          }`}
                        >
                          {/* Pin / Featured Toggle */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleFeatured(job)}
                              title={job.is_featured ? 'Unfeature role' : 'Pin as Featured'}
                              className={`p-1.5 rounded-lg transition-all ${
                                job.is_featured
                                  ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                                  : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800'
                              }`}
                            >
                              <ShieldCheck
                                className="h-4 w-4 stroke-[1.5]"
                              />
                            </button>
                          </td>

                          {/* Role & Company */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{job.title}</span>
                              {job.is_featured && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-neutral-500 stroke-[1.5]" />
                                <span>{job.company}</span>
                              </span>
                              {job.city_location && (
                                <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                                  <Globe className="h-2.5 w-2.5 text-neutral-500" />
                                  <span>{job.city_location}</span>
                                </span>
                              )}
                              {/* Work Mode Badge */}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  job.work_mode === 'HYBRID' || (job.candidate_required_location && job.candidate_required_location.toLowerCase().includes('hybrid'))
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : job.work_mode === 'ONSITE' || (job.candidate_required_location && (job.candidate_required_location.toLowerCase().includes('onsite') || job.candidate_required_location.toLowerCase().includes('on-site')))
                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                }`}
                              >
                                {job.work_mode === 'HYBRID' || (job.candidate_required_location && job.candidate_required_location.toLowerCase().includes('hybrid'))
                                  ? 'Hybrid'
                                  : job.work_mode === 'ONSITE' || (job.candidate_required_location && (job.candidate_required_location.toLowerCase().includes('onsite') || job.candidate_required_location.toLowerCase().includes('on-site')))
                                  ? 'Onsite'
                                  : 'Remote'}
                              </span>
                              {job.employer_type === 'agency' && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 cursor-help"
                                  title="This role is posted by a staffing/outsourcing company on behalf of a client."
                                >
                                  Agency listing
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Region Allowance */}
                          <td className="py-4 px-4">
                            <span
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                job.location_tier === 'Africa Only'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : job.location_tier === 'EMEA'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              }`}
                            >
                              {job.location_tier}
                            </span>
                          </td>

                          {/* Salary Column */}
                          <td className="py-4 px-4 text-neutral-300 font-medium">
                            <SalaryDisplay job={job as any} className="text-neutral-300 font-medium text-xs" />
                          </td>
                          {false && (
                          <td className="py-4 px-4 text-neutral-300 font-medium">
                            {job.salary || (
                              <span className="text-neutral-600 text-xs">—</span>
                            )}
                          </td>

                          )}
                          {/* Source Type & Platform */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {isCurated ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-block">
                                  Admin Curated
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 inline-block">
                                  {job.source || 'Crawler'}
                                </span>
                              )}
                              <div>
                                {(() => {
                                  const platform = job.source_platform || (job as any).platform || detectJobPlatform(job.career_url || job.url || job.apply_url);
                                  const pInfo = getJobPlatformInfo(platform);
                                  return (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${pInfo.badgeClass}`}>
                                      {pInfo.shortName}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>

                          {/* Board Status */}
                          <td className="py-4 px-4">
                            {job.is_active ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                <span>Active on Board</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                                <span>Taken Down</span>
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* External URL with cross-platform optimization */}
                              {job.url && (
                                <a
                                  href={optimizeUrlForPlatform(job.career_url || job.url || job.apply_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                  title="Open career link (optimized for mobile & desktop)"
                                >
                                  <Globe className="h-3.5 w-3.5 stroke-[1.5]" />
                                </a>
                              )}

                              {/* Take Down / Republish Toggle */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(job)}
                                className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${
                                  job.is_active
                                    ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {job.is_active ? (
                                  <>
                                    <X className="h-3 w-3 mr-1 stroke-[1.5]" />
                                    <span>Take Down</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1 stroke-[1.5]" />
                                    <span>Republish</span>
                                  </>
                                )}
                              </Button>

                              {/* 1-Click Instant Delete Role (No Special Security Measures or Prompt) */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRole(job)}
                                className="h-7 px-2.5 text-[11px] rounded-lg border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:border-rose-500/60 transition-all font-medium"
                                title="Permanently delete role immediately without prompt"
                              >
                                <Trash2 className="h-3 w-3 mr-1 stroke-[1.5]" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Secondary Tab: Corporate Employer Postings */
        <div className="rounded-2xl border border-neutral-800/80 bg-[#0e0e12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Company & Job Title</th>
                  <th className="py-3.5 px-4">Workspace ID</th>
                  <th className="py-3.5 px-4">Vetting Project</th>
                  <th className="py-3.5 px-4">Job Type / Location</th>
                  <th className="py-3.5 px-4">Posting Status</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {employerJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      No corporate employer job postings found.
                    </td>
                  </tr>
                ) : (
                  employerJobs.map((ej) => (
                    <tr key={ej.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        <div>{ej.job_title}</div>
                        <div className="text-xs text-neutral-400 font-normal mt-0.5">
                          {ej.department || 'Engineering'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-400 font-mono text-[11px]">
                        {ej.workspace_id}
                      </td>
                      <td className="py-4 px-4 text-neutral-400 font-mono text-[11px]">
                        {ej.flowmingo_project_id || 'mock_flowmingo_proj'}
                      </td>
                      <td className="py-4 px-4 text-neutral-300">
                        {ej.location || 'Remote'} · {ej.job_type || 'Full-time'}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            ej.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {ej.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await fetch('/api/admin/jobs/toggle-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  job_id: ej.id,
                                  is_employer_job: true,
                                  is_active: ej.status === 'active',
                                }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                toast.success('Corporate posting status updated.');
                                loadJobs();
                              }
                            }}
                            className="h-7 px-2.5 text-[11px] rounded-lg border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:text-white"
                          >
                            {ej.status === 'active' ? 'Take Down' : 'Republish'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setEmployerJobs((prev) => prev.filter((item) => item.id !== ej.id));
                              toast.success(`Corporate posting "${ej.job_title}" deleted.`);
                              try {
                                await fetch(`/api/admin/jobs?id=${encodeURIComponent(ej.id)}`, {
                                  method: 'DELETE',
                                });
                              } catch {}
                            }}
                            className="h-7 px-2.5 text-[11px] rounded-lg border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-all"
                            title="Delete corporate posting immediately without prompt"
                          >
                            <Trash2 className="h-3 w-3 mr-1 stroke-[1.5]" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Confirmation Dialog: Trigger Remote Job Crawler */}
      <ConfirmationDialog
        open={isCrawlerDialogOpen}
        onOpenChange={setIsCrawlerDialogOpen}
        title="Trigger Remote Job Crawler?"
        description={`This will trigger a live multi-source crawl across 4 sources: DevGlobalJobs, WeWorkRemotely, Remotive, and RemoteOK. Last run: ${timeAgoText}${
          lastCrawlCount !== null ? ` (${lastCrawlCount} roles created)` : ''
        }. All newly crawled roles enter the "Needs review" queue (status = needs_review, is_active = false) and are NOT publicly visible until manually verified.`}
        actionLabel="Trigger crawler"
        requireReason={true}
        isDestructive={false}
        isLoading={syncingLive}
        onConfirm={handleTriggerCrawler}
      />
    </div>
  );
}

export default function AdminRolesManagerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-neutral-400">Loading roles workspace...</div>}>
      <RolesManagerContent />
    </Suspense>
  );
}
