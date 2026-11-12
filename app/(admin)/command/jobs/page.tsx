'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Star,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Globe,
  DollarSign,
  Filter,
  ArrowUpRight,
  Loader2,
  RefreshCw,
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
import { AdminRemoteJob } from '@/lib/admin/types';
import {
  getAdminRemoteJobs,
  saveAdminRemoteJob,
  toggleAdminJobActive,
  toggleAdminJobFeatured,
  SEED_ADMIN_REMOTE_JOBS,
} from '@/lib/admin/store';

export default function AdminJobsManagerPage() {
  const [activeTab, setActiveTab] = useState<'remote' | 'employer'>('remote');
  const [remoteJobs, setRemoteJobs] = useState<AdminRemoteJob[]>(() => {
    return getAdminRemoteJobs();
  });
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

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

  // Handle Post New Verified Job
  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resolvedCompany = (companyName || (formData.get('company_name') as string) || '').trim();
    const resolvedTitle = (jobTitle || (formData.get('job_title') as string) || '').trim();
    const resolvedUrl = (careerUrl || (formData.get('career_url') as string) || '').trim();
    const resolvedSalary = (salaryRange || (formData.get('salary_range') as string) || '').trim();
    const resolvedDesc = (jobDescription || (formData.get('job_description') as string) || '').trim();

    if (!resolvedCompany || !resolvedTitle || !resolvedUrl) {
      toast.error('Please fill in Company Name, Job Title, and Career URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: resolvedCompany,
          job_title: resolvedTitle,
          career_url: resolvedUrl,
          region_allowance: regionAllowance,
          salary_range: resolvedSalary,
          job_description: resolvedDesc,
          is_featured: isFeatured,
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
        setSalaryRange('');
        setJobDescription('');
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
        candidate_required_location: regionAllowance === 'Africa Only' ? 'Africa' : regionAllowance,
        salary: resolvedSalary || null,
        description: resolvedDesc || 'Verified remote role posted directly by Platform Admin.',
        category: 'Software & Engineering',
        job_type: 'Full-time',
        tags: ['Verified Partner', 'Platform Curated', regionAllowance],
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
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? job.is_active
          : !job.is_active;

      // Source filter
      const matchesSource =
        sourceFilter === 'ALL'
          ? true
          : sourceFilter === 'ADMIN'
          ? job.source_type === 'ADMIN_CURATED'
          : job.source_type !== 'ADMIN_CURATED';

      return matchesQuery && matchesTier && matchesStatus && matchesSource;
    });
  }, [remoteJobs, searchQuery, tierFilter, statusFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Briefcase className="h-4 w-4 stroke-[1.5]" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Platform Job Board Manager
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Curate verified partner listings, feature high-impact roles, and moderate live postings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-neutral-400 font-medium hidden md:inline">
            Last synced: {timeAgoText}
          </span>

          <Button
            size="sm"
            onClick={handleSyncLiveJobs}
            disabled={syncingLive}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 hover:text-white gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 stroke-[1.75] ${syncingLive ? 'animate-spin text-emerald-400' : 'text-neutral-400'}`} />
            <span>{syncingLive ? 'Syncing...' : 'Sync Live Jobs'}</span>
          </Button>
          <Link href="/dashboard/crawler" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs rounded-xl border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white gap-1.5"
            >
              <Eye className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Preview Candidate Board</span>
              <ArrowUpRight className="h-3 w-3 stroke-[1.5] text-neutral-500" />
            </Button>
          </Link>

          {/* Post New Verified Job Trigger */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[2]" />
                <span>Post New Verified Job</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl bg-[#0e0e12] border-neutral-800 text-neutral-100 p-6 sm:p-7 rounded-2xl shadow-2xl">
              <DialogHeader>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider w-fit mb-1.5">
                  <ShieldCheck className="h-3 w-3 stroke-[2]" />
                  <span>Admin Curated Posting</span>
                </div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Publish Verified Remote Role
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
                  Directly post a vetted technical role to the candidate job board. This will be marked as a verified partner listing.
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
                  <Label className="text-xs font-semibold text-neutral-300">
                    Direct Career / Application URL *
                  </Label>
                  <Input
                    name="career_url"
                    type="url"
                    required
                    placeholder="https://company.com/careers/role"
                    value={careerUrl}
                    onChange={(e) => setCareerUrl(e.target.value)}
                    className="h-9 text-xs bg-neutral-900/90 border-neutral-800 text-white placeholder:text-neutral-500"
                  />
                </div>

                {/* Row 3: Region Allowance & Salary Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-300">
                      Region Allowance *
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
                      <Star className="h-3.5 w-3.5 text-amber-400 stroke-[2] fill-amber-400/20" />
                      <span className="text-xs font-bold text-white">
                        Pin as Featured Partner Role
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
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <span>Publish to Candidate Board</span>
                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 stroke-[2]" />
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
              <CheckCircle2 className="h-4 w-4 stroke-[1.5] text-emerald-400" />
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
              <span>Admin-Curated Roles</span>
              <ShieldCheck className="h-4 w-4 stroke-[1.5] text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400">
              {stats.adminCurated}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Direct verified partner posts</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e12] border-neutral-800/80 rounded-2xl shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Featured Roles (Pinned)</span>
              <Star className="h-4 w-4 stroke-[1.5] text-amber-400 fill-amber-400/20" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-400">
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
            <span>Remote Job Board (Public Feed)</span>
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

        <button
          onClick={loadJobs}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`h-3.5 w-3.5 stroke-[1.5] ${loading ? 'animate-spin' : ''}`} />
        </button>
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
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
                  <SelectItem value="ALL">All Sources</SelectItem>
                  <SelectItem value="ADMIN">Admin Curated</SelectItem>
                  <SelectItem value="CRAWLER">Crawler Ingested</SelectItem>
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
                    <th className="py-3.5 px-4">Region Allowance</th>
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
                              title={job.is_featured ? 'Unfeature role' : 'Pin as Featured Partner'}
                              className={`p-1.5 rounded-lg transition-all ${
                                job.is_featured
                                  ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                                  : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800'
                              }`}
                            >
                              <Star
                                className={`h-4 w-4 stroke-[1.5] ${
                                  job.is_featured ? 'fill-amber-400' : ''
                                }`}
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
                            <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-neutral-500 stroke-[1.5]" />
                              <span>{job.company}</span>
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
                          {/* Source Type */}
                          <td className="py-4 px-4">
                            {isCurated ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Admin Curated
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                                {job.source || 'Crawler'}
                              </span>
                            )}
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
                              {/* External URL */}
                              {job.url && (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                  title="Open career link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 stroke-[1.5]" />
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
                                    <EyeOff className="h-3 w-3 mr-1 stroke-[1.5]" />
                                    <span>Take Down</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1 stroke-[1.5]" />
                                    <span>Republish</span>
                                  </>
                                )}
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
                  <th className="py-3.5 px-4">Flowmingo Project</th>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
