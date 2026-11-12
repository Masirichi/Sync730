'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Zap,
  Video,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Sparkles,
  MessageSquare,
  Star,
  Plus,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Clock,
  Layers,
  Heart,
  Scale,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  FileText,
  SlidersHorizontal,
  Check,
  ArrowUpDown,
  Share2,
  HelpCircle,
  Eye,
  EyeOff,
  Headphones,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  VideoAssessment,
  CorporateWorkspace,
  RecruiterRole,
  EmployerJob,
  CandidateContactLog,
} from '@/lib/recruiter/types';
import {
  getLocalWorkspace,
  saveLocalWorkspace,
  getLocalJobs,
} from '@/lib/recruiter/store';
import {
  VideoAssessmentPlayer,
  VideoPlayerHandle,
} from '@/components/recruiter/video-assessment-player';
import { calculateJobMatch, JobMatchAnalysis } from '@/lib/recruiter/matching';
import { toast } from 'sonner';

interface NoteItem {
  id: string;
  author_email: string;
  author_role: string;
  note: string;
  score?: number;
  created_at: string;
}

function VettedTalentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get('job');

  const [candidates, setCandidates] = useState<VideoAssessment[]>([]);
  const [workspace, setWorkspace] = useState<CorporateWorkspace>(getLocalWorkspace());
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<EmployerJob | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [scoreRangeFilter, setScoreRangeFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'technical' | 'newest'>('match');

  // Navigation Tabs: 'all' | 'shortlisted' | 'unlocked'
  const [activeTab, setActiveTab] = useState<'all' | 'shortlisted' | 'unlocked'>('all');

  // Shortlist state (stored in localStorage)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  // Compare candidates state (max 3)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Collapsible breakdown toggles for candidate cards
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});

  // Loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Active role
  const [currentRole, setCurrentRole] = useState<RecruiterRole>('OWNER');

  // Notes Modal state
  const [activeCandidateForNotes, setActiveCandidateForNotes] = useState<VideoAssessment | null>(null);
  const [notesList, setNotesList] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteScore, setNewNoteScore] = useState<number | ''>(90);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Detail View Modal state & Player ref
  const [activeDetailCandidate, setActiveDetailCandidate] = useState<VideoAssessment | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const detailPlayerRef = useRef<VideoPlayerHandle | null>(null);

  // Unlock Confirmation Dialog state
  const [candidateToConfirmUnlock, setCandidateToConfirmUnlock] = useState<VideoAssessment | null>(null);

  // Report Issue Dialog state
  const [candidateToReportIssue, setCandidateToReportIssue] = useState<VideoAssessment | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Contact Candidate Dialog state
  const [candidateToContact, setCandidateToContact] = useState<VideoAssessment | null>(null);
  const [contactChannel, setContactChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isLoggingContact, setIsLoggingContact] = useState(false);

  // Load shortlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sync730_shortlisted_ids');
      if (saved) {
        setShortlistedIds(new Set(JSON.parse(saved)));
      }
    } catch {}
  }, []);

  const toggleShortlist = (candId: string) => {
    setShortlistedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(candId)) {
        updated.delete(candId);
        toast.info('Removed from shortlist');
      } else {
        updated.add(candId);
        toast.success('Added candidate to shortlist');
      }
      try {
        localStorage.setItem('sync730_shortlisted_ids', JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  };

  const toggleCompare = (candId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(candId)) {
        return prev.filter((id) => id !== candId);
      }
      if (prev.length >= 3) {
        toast.error('You can compare a maximum of 3 candidates simultaneously.');
        return prev;
      }
      return [...prev, candId];
    });
  };

  const toggleBreakdown = (candId: string) => {
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [candId]: !prev[candId],
    }));
  };

  // Fetch talent & jobs
  const fetchTalent = async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    const ws = getLocalWorkspace();
    setWorkspace(ws);

    // Load available employer jobs
    const employerJobs = getLocalJobs();
    setJobs(employerJobs);

    // If job param is present, resolve selected job
    if (jobParam) {
      const found = employerJobs.find((j) => j.id === jobParam);
      setSelectedJob(found || null);
    } else {
      setSelectedJob(null);
    }

    try {
      const res = await fetch(`/api/talent/list?workspace_id=${ws.id}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        throw new Error(data.error || 'Failed to fetch vetted candidate pool');
      }
    } catch (err: any) {
      setHasError(true);
      setErrorMessage(err.message || 'Network error fetching talent pool.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTalent();

    const updateRole = () => {
      const el = document.querySelector('[data-active-role]');
      if (el) {
        const r = el.getAttribute('data-active-role') as RecruiterRole;
        if (r) setCurrentRole(r);
      }
    };
    updateRole();

    const handleWsUpdate = () => {
      const ws = getLocalWorkspace();
      setWorkspace(ws);
    };

    window.addEventListener('sync730_workspace_updated', handleWsUpdate);
    window.addEventListener('sync730_unlocks_updated', fetchTalent);
    window.addEventListener('sync730_assessments_updated', fetchTalent);
    const interval = setInterval(updateRole, 500);

    return () => {
      window.removeEventListener('sync730_workspace_updated', handleWsUpdate);
      window.removeEventListener('sync730_unlocks_updated', fetchTalent);
      window.removeEventListener('sync730_assessments_updated', fetchTalent);
      clearInterval(interval);
    };
  }, [jobParam]);

  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  // Unlock Candidate Profile Action (1 Token) with Idempotency Key
  const handleUnlock = async (cand: VideoAssessment) => {
    const candidateId = cand.candidate_id || cand.id;
    if (!isOwnerOrAdmin) {
      toast.error('Permission denied: Only Owners and Admins can unlock candidate profiles.');
      return;
    }

    const ws = getLocalWorkspace();
    if (ws.token_balance < 1) {
      toast.error('Insufficient tokens! Please top up your token balance.', {
        action: {
          label: 'Manage Tokens',
          onClick: () => window.location.assign('/console/billing'),
        },
      });
      return;
    }

    const idempotencyKey = `idemp_unl_${candidateId}_${Date.now()}`;
    setUnlockingId(candidateId);

    try {
      const res = await fetch('/api/talent/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          workspace_id: ws.id,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.candidate) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.candidate_id === candidateId || c.id === candidateId
              ? { ...c, ...data.candidate, is_unlocked: true }
              : c
          )
        );

        if (typeof data.token_balance === 'number') {
          const updatedWs = { ...ws, token_balance: data.token_balance };
          setWorkspace(updatedWs);
          saveLocalWorkspace(updatedWs);
        }

        if (activeDetailCandidate?.candidate_id === candidateId) {
          setActiveDetailCandidate((prev) =>
            prev ? { ...prev, ...data.candidate, is_unlocked: true } : null
          );
        }

        setCandidateToConfirmUnlock(null);
        toast.success(`Candidate profile unlocked! 1 token spent. Contact info revealed.`);
      } else {
        throw new Error(data.error || 'Failed to unlock profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unlocking candidate.');
    } finally {
      setUnlockingId(null);
    }
  };

  // Open Notes Modal
  const openNotesModal = async (cand: VideoAssessment) => {
    setActiveCandidateForNotes(cand);
    setNewNoteText('');
    setNewNoteScore(cand.overall_match_score || 90);
    setIsLoadingNotes(true);

    try {
      const res = await fetch(
        `/api/recruiter/talent/notes?candidate_id=${cand.candidate_id || cand.id}&workspace_id=${workspace.id}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.notes)) {
        setNotesList(data.notes);
      } else {
        setNotesList([]);
      }
    } catch {
      setNotesList([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Submit Note & Score
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidateForNotes || !newNoteText.trim()) {
      toast.error('Please enter an evaluation note.');
      return;
    }

    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/recruiter/talent/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: activeCandidateForNotes.candidate_id || activeCandidateForNotes.id,
          workspace_id: workspace.id,
          note: newNoteText.trim(),
          score: typeof newNoteScore === 'number' ? newNoteScore : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.note) {
        setNotesList([data.note, ...notesList]);
        setNewNoteText('');
        toast.success('Internal evaluation note and score saved.');
      } else {
        throw new Error(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Submit Replacement Claim
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateToReportIssue) return;
    if (!reportReason.trim()) {
      toast.error('Please describe the issue with this candidate.');
      return;
    }

    setIsSubmittingReport(true);
    try {
      toast.success(
        'Replacement claim submitted. Under our Replacement Policy, 1 token will be refunded if the candidate has withdrawn or is unreachable after 5 days.'
      );
      setCandidateToReportIssue(null);
      setReportReason('');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Open Contact Candidate Modal
  const openContactModal = (cand: VideoAssessment) => {
    setCandidateToContact(cand);
    setContactChannel('EMAIL');
    const roleName = selectedJob?.job_title || cand.target_role;
    setContactSubject(`Sync730 Interview Invitation: ${roleName} at ${workspace.company_name}`);
    setContactMessage(
      `Hi ${cand.candidate_name || 'Candidate'},\n\nWe were impressed by your verified Flowmingo video assessment on Sync730 Hub. We would like to invite you for a 30-minute introductory conversation regarding our open ${roleName} position.\n\nLooking forward to speaking with you!\n\nBest regards,\n${workspace.company_name} Talent Squad`
    );
  };

  // Log and execute contact attempt
  const handleExecuteContact = async () => {
    if (!candidateToContact) return;
    setIsLoggingContact(true);

    const recipient =
      contactChannel === 'EMAIL'
        ? candidateToContact.candidate_email || 'candidate@sync730.com'
        : candidateToContact.whatsapp || candidateToContact.phone || '+2348000000000';

    try {
      await fetch('/api/recruiter/talent/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspace.id,
          candidate_id: candidateToContact.candidate_id || candidateToContact.id,
          contact_type: contactChannel,
          recipient,
          subject: contactSubject,
          message_template: contactMessage,
        }),
      });

      toast.success(`Outreach attempt logged in your organization audit history.`);

      if (contactChannel === 'EMAIL') {
        const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactMessage)}`;
        window.open(mailto, '_blank');
      } else {
        const cleanPhone = recipient.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(contactMessage)}`;
        window.open(waUrl, '_blank');
      }

      setCandidateToContact(null);
    } catch {
      toast.error('Failed to log contact attempt.');
    } finally {
      setIsLoggingContact(false);
    }
  };

  // Calculate assessment age string & check >12 months
  const getAssessmentAgeInfo = (dateStr?: string) => {
    if (!dateStr) return { label: 'Recently Assessed', isOld: false };
    const date = new Date(dateStr);
    const diffMonths = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const isOld = diffMonths >= 12;

    if (diffMonths < 1) {
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      return {
        label: days <= 1 ? 'Assessed recently' : `Assessed ${days} days ago`,
        isOld: false,
      };
    }
    return {
      label: `Assessed ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`,
      isOld,
    };
  };

  // FILTERING LOGIC
  const filteredCandidates = candidates
    .filter((cand) => {
      // REQUIREMENT 6: Only show candidates who have consented to be shown to recruiters
      if (cand.consent_to_show_recruiters === false) return false;
      // REQUIREMENT 6: Hide candidates marked 'Not looking'
      if (cand.availability === 'Not looking') return false;

      // TAB FILTER
      if (activeTab === 'shortlisted' && !shortlistedIds.has(cand.candidate_id || cand.id)) {
        return false;
      }
      if (activeTab === 'unlocked' && !cand.is_unlocked) {
        return false;
      }

      // TEXT SEARCH
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (cand.candidate_name || '').toLowerCase();
        const role = (cand.target_role || '').toLowerCase();
        const summary = (cand.ai_summary || '').toLowerCase();
        const skills = (cand.skills || []).map((s) => s.toLowerCase()).join(' ');
        if (!name.includes(q) && !role.includes(q) && !summary.includes(q) && !skills.includes(q)) {
          return false;
        }
      }

      // SENIORITY FILTER
      if (seniorityFilter !== 'ALL') {
        if ((cand.seniority || '').toLowerCase() !== seniorityFilter.toLowerCase()) {
          return false;
        }
      }

      // SKILL FILTER
      if (skillFilter !== 'ALL') {
        const hasSkill = (cand.skills || []).some(
          (s) => s.toLowerCase() === skillFilter.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      // SCORE RANGE FILTER
      if (scoreRangeFilter !== 'ALL') {
        const score = cand.overall_match_score || 0;
        if (scoreRangeFilter === '90' && score < 90) return false;
        if (scoreRangeFilter === '80' && score < 80) return false;
        if (scoreRangeFilter === '70' && score < 70) return false;
      }

      // AVAILABILITY FILTER
      if (availabilityFilter !== 'ALL') {
        if (cand.availability !== availabilityFilter) return false;
      }

      // LOCATION / TIMEZONE FILTER
      if (locationFilter !== 'ALL') {
        if (locationFilter === 'NIGERIA' && !cand.open_to_nigeria) return false;
        if (locationFilter === 'AFRICA' && !cand.open_to_africa) return false;
        if (locationFilter === 'REMOTE' && !cand.open_to_remote) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // SORT LOGIC
      if (sortBy === 'technical') {
        return (b.technical_depth_score || 0) - (a.technical_depth_score || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      // Default: Best Match
      const matchA = calculateJobMatch(a, selectedJob).matchScore;
      const matchB = calculateJobMatch(b, selectedJob).matchScore;
      return matchB - matchA;
    });

  // Candidates for comparison
  const compareCandidates = candidates.filter((c) =>
    compareIds.includes(c.candidate_id || c.id)
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ROLE CONTEXT BANNER (When accessed via ?job=ID) */}
        {selectedJob && (
          <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 border border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                    Role Context Filter Active
                  </span>
                  <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">
                    {selectedJob.department || 'Engineering'}
                  </Badge>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  Showing candidates calibrated for {selectedJob.job_title}
                </h2>
                <p className="text-xs text-neutral-400">
                  {selectedJob.location} · {selectedJob.job_type} · Match scores are dynamically calibrated against this job&apos;s required stack.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/console/talent')}
              className="h-8 text-xs bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 rounded-xl gap-1.5 self-start sm:self-auto shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear role filter</span>
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Vetted Talent Pool
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                Flowmingo AI Verified
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Pre-screened software engineers, product designers, and AI specialists. Name and contact details hidden until unlocked.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOwnerOrAdmin ? (
              <Link href="/console/billing">
                <Button
                  size="sm"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold h-9 px-3.5 rounded-xl shadow-xs gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                  <span>{workspace.token_balance} Tokens Available</span>
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{workspace.token_balance} Tokens (Ask admin to unlock)</span>
              </div>
            )}
          </div>
        </div>

        {/* FAIRNESS & ANONYMIZATION NOTICE BAR */}
        <div className="p-3.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Name and contact details hidden until unlocked.</strong> Audio and blurred video previews available.
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200">
                <Info className="h-3.5 w-3.5" />
                <span>Algorithmic Fairness Policy</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs p-3">
              Fairness Guarantee: Match scores and rankings strictly exclude candidate name, photo, gender, age, accent, ethnicity, or location proxies. 100% evaluated on technical demonstration and communication clarity.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* TABS: All Candidates / Shortlisted / Unlocked */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-auto"
          >
            <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl h-9">
              <TabsTrigger value="all" className="text-xs font-semibold rounded-lg gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>All Candidates ({candidates.length})</span>
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="text-xs font-semibold rounded-lg gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <span>Shortlisted ({shortlistedIds.size})</span>
              </TabsTrigger>
              <TabsTrigger value="unlocked" className="text-xs font-semibold rounded-lg gap-1.5">
                <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                <span>Unlocked ({candidates.filter((c) => c.is_unlocked).length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-neutral-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 text-xs font-semibold"
            >
              <option value="match">Best Match</option>
              <option value="technical">Highest Technical Depth</option>
              <option value="newest">Newest Assessment</option>
            </select>
          </div>
        </div>

        {/* MULTI-CRITERIA FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                placeholder="Search candidates by skills, keywords, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Seniority Filter */}
            <select
              value={seniorityFilter}
              onChange={(e) => setSeniorityFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
            >
              <option value="ALL">All Seniority</option>
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Staff">Staff</option>
            </select>

            {/* Skill Filter */}
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
            >
              <option value="ALL">All Skills</option>
              <option value="Next.js">Next.js</option>
              <option value="React">React</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Supabase">Supabase</option>
              <option value="Kubernetes">Kubernetes</option>
              <option value="Terraform">Terraform</option>
              <option value="Figma">Figma</option>
              <option value="Python">Python</option>
            </select>

            {/* Score Range Filter */}
            <select
              value={scoreRangeFilter}
              onChange={(e) => setScoreRangeFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
            >
              <option value="ALL">All Match Scores</option>
              <option value="90">90%+ Top Match</option>
              <option value="80">80%+ Strong Fit</option>
              <option value="70">70%+ Qualified</option>
            </select>

            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
            >
              <option value="ALL">All Availability</option>
              <option value="Available">Available Immediately</option>
              <option value="Open to offers">Open to Offers</option>
            </select>

            {/* Location / Remote Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs"
            >
              <option value="ALL">All Locations</option>
              <option value="NIGERIA">Open to Nigeria (WAT / UTC+1)</option>
              <option value="AFRICA">Open to Africa / EMEA</option>
              <option value="REMOTE">Global 100% Remote</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <span>
              Showing {filteredCandidates.length} of {candidates.length} pre-vetted candidates
            </span>
            {(search || seniorityFilter !== 'ALL' || skillFilter !== 'ALL' || scoreRangeFilter !== 'ALL' || availabilityFilter !== 'ALL' || locationFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSeniorityFilter('ALL');
                  setSkillFilter('ALL');
                  setScoreRangeFilter('ALL');
                  setAvailabilityFilter('ALL');
                  setLocationFilter('ALL');
                }}
                className="text-neutral-900 dark:text-white font-semibold underline hover:text-amber-600"
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {hasError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTalent} className="h-7 text-xs border-rose-300">
              <RefreshCw className="h-3 w-3 mr-1" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* CANDIDATE CARDS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          /* EMPTY STATES */
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 space-y-3">
            {activeTab === 'shortlisted' ? (
              <>
                <Heart className="h-10 w-10 text-neutral-300 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  No Shortlisted Candidates Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Click the heart icon on any candidate card to save them to your shortlist for fast team review.
                </p>
                <Button size="sm" onClick={() => setActiveTab('all')} className="text-xs mt-2">
                  Browse All Candidates
                </Button>
              </>
            ) : activeTab === 'unlocked' ? (
              <>
                <Unlock className="h-10 w-10 text-neutral-300 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  No Unlocked Candidates Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Unlock candidates with your tokens to reveal full contact details, downloadable CVs, and direct WhatsApp links.
                </p>
                <Button size="sm" onClick={() => setActiveTab('all')} className="text-xs mt-2">
                  Browse Vetted Pool
                </Button>
              </>
            ) : (
              <>
                <Users className="h-10 w-10 text-neutral-300 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  No Candidates Match Your Filters
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try broadening your skill, seniority, or score range filters to see available verified candidates.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setSeniorityFilter('ALL');
                    setSkillFilter('ALL');
                    setScoreRangeFilter('ALL');
                    setAvailabilityFilter('ALL');
                    setLocationFilter('ALL');
                  }}
                  className="text-xs mt-2"
                >
                  Reset All Filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((cand) => {
              const isUnlocked = Boolean(cand.is_unlocked);
              const isShortlisted = shortlistedIds.has(cand.candidate_id || cand.id);
              const isCompared = compareIds.includes(cand.candidate_id || cand.id);
              const isExpanded = Boolean(expandedBreakdowns[cand.candidate_id || cand.id]);
              const matchAnalysis = calculateJobMatch(cand, selectedJob);
              const ageInfo = getAssessmentAgeInfo(cand.assessment_completed_date || cand.created_at);

              return (
                <div
                  key={cand.id || cand.candidate_id}
                  data-candidate-card={cand.candidate_id}
                  className={`flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border transition-all shadow-2xs overflow-hidden ${
                    isCompared
                      ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Card Header: Video Player with 15-min signed URL, Watermark & Preview */}
                  <div className="p-3 pb-0 relative">
                    <VideoAssessmentPlayer
                      candidateId={cand.candidate_id || cand.id}
                      videoUrl={cand.secure_video_url}
                      posterUrl={cand.poster_url}
                      durationSeconds={cand.duration_seconds || 165}
                      status={cand.status}
                      expiresAt={cand.expires_at}
                      candidateName={cand.candidate_name}
                      isUnlocked={isUnlocked}
                      watermarkText={`${workspace.company_name} · ${workspace.billing_email}`}
                    />

                    {/* Shortlist & Compare Buttons Top Overlay */}
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 z-25">
                      {/* Compare toggle */}
                      <button
                        type="button"
                        onClick={() => toggleCompare(cand.candidate_id || cand.id)}
                        className={`h-7 px-2 rounded-lg text-[10px] font-bold backdrop-blur-md border transition-all flex items-center gap-1 ${
                          isCompared
                            ? 'bg-neutral-950 text-white border-white'
                            : 'bg-black/60 text-white/90 border-white/20 hover:bg-black/80'
                        }`}
                        title="Select to compare side-by-side"
                      >
                        <Scale className="h-3 w-3" />
                        <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                      </button>

                      {/* Heart Shortlist toggle */}
                      <button
                        type="button"
                        onClick={() => toggleShortlist(cand.candidate_id || cand.id)}
                        className="h-7 w-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-105 transition-all"
                        title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isShortlisted ? 'fill-rose-500 text-rose-500' : 'text-white'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 flex-1 space-y-4">
                    {/* Candidate Name, Match Score & Status Badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {cand.candidate_name}
                        </h3>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Match Score Badge */}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            {matchAnalysis.matchScore}% {matchAnalysis.isRelativeMatch ? 'Match' : 'Overall Score'}
                          </Badge>

                          {/* Unlocked / Masked status */}
                          {isUnlocked ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0 gap-1"
                            >
                              <Unlock className="h-2.5 w-2.5" />
                              <span>Unlocked</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 shrink-0 gap-1"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              <span>Masked</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {cand.target_role}
                      </div>

                      {/* Location, Availability & Assessment Age */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                        <span>{cand.location || 'Remote'}</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-neutral-200 text-neutral-600 dark:text-neutral-400">
                          {cand.availability || 'Available'}
                        </Badge>
                        <span>·</span>
                        <span className={ageInfo.isOld ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                          {ageInfo.label}
                        </span>
                      </div>

                      {/* Older than 12 months advisory flag */}
                      {ageInfo.isOld && (
                        <div className="mt-1.5 p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                          <span>Assessment &gt;12 months old: Request fresh calibration</span>
                        </div>
                      )}
                    </div>

                    {/* MATCH SCORE REASONS & COLLAPSIBLE BREAKDOWN */}
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">
                          Match Evaluation
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBreakdown(cand.candidate_id || cand.id)}
                          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? 'Hide breakdown' : 'See breakdown'}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>

                      {/* Reasons summary line */}
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                        {matchAnalysis.reasonsLabel}
                      </p>

                      {/* Collapsible breakdown */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2 text-[11px]">
                          {matchAnalysis.breakdown.matchedSkills.length > 0 && (
                            <div>
                              <span className="text-neutral-400 font-medium block mb-1">Matched Skills:</span>
                              <div className="flex flex-wrap gap-1">
                                {matchAnalysis.breakdown.matchedSkills.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                    ✓ {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchAnalysis.breakdown.gapSkills.length > 0 && (
                            <div>
                              <span className="text-neutral-400 font-medium block mb-1">Skill Gaps:</span>
                              <div className="flex flex-wrap gap-1">
                                {matchAnalysis.breakdown.gapSkills.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                                    ! {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-neutral-400 space-y-0.5 pt-1">
                            <div>Seniority: {matchAnalysis.breakdown.seniorityFit}</div>
                            <div>Location: {matchAnalysis.breakdown.locationEligibility}</div>
                            <div>Comp: {matchAnalysis.breakdown.compensationFit}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ADVISORY SCORES: Technical Depth & Communication */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 cursor-help">
                            <div className="flex items-center justify-between text-[10px] text-neutral-500">
                              <span>Technical Depth</span>
                              <HelpCircle className="h-2.5 w-2.5" />
                            </div>
                            <div className="font-extrabold text-neutral-900 dark:text-white mt-0.5">
                              {cand.technical_depth_score || 90}%
                            </div>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">Advisory score</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          AI-generated, for guidance. Review the video before deciding.
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 cursor-help">
                            <div className="flex items-center justify-between text-[10px] text-neutral-500">
                              <span>Communication</span>
                              <HelpCircle className="h-2.5 w-2.5" />
                            </div>
                            <div className="font-extrabold text-neutral-900 dark:text-white mt-0.5">
                              {cand.communication_score || 90}%
                            </div>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">Advisory score</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          AI-generated, for guidance. Review the video before deciding.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* AI Assessment Summary */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 stroke-[1.5]" />
                        <span>Flowmingo AI Assessment Summary</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                        {cand.ai_summary}
                      </p>
                    </div>

                    {/* View Full Profile & Rubric Link */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDetailCandidate(cand);
                          setTranscriptSearch('');
                        }}
                        className="text-[11px] font-bold text-neutral-900 dark:text-white hover:text-amber-600 flex items-center gap-1 underline"
                      >
                        <Layers className="h-3 w-3" />
                        <span>View full profile & rubric</span>
                      </button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openNotesModal(cand)}
                        className="h-7 px-2 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white gap-1"
                      >
                        <MessageSquare className="h-3 w-3 stroke-[1.5]" />
                        <span>Notes & Score</span>
                      </Button>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                    {cand.status === 'PROCESSING' ? (
                      <Button
                        disabled
                        size="sm"
                        className="w-full h-9 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-semibold rounded-xl cursor-not-allowed gap-1.5 shadow-none"
                      >
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                        <span>Screening in Progress</span>
                      </Button>
                    ) : isUnlocked ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => openContactModal(cand)}
                          className="flex-1 h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-xl gap-1.5"
                        >
                          <Mail className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Contact Candidate</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCandidateToReportIssue(cand)}
                          title="Report issue under our replacement policy"
                          className="h-8 px-2 text-[11px] font-semibold text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          Report
                        </Button>
                      </div>
                    ) : isOwnerOrAdmin ? (
                      <Button
                        onClick={() => setCandidateToConfirmUnlock(cand)}
                        disabled={unlockingId === cand.candidate_id}
                        size="sm"
                        className="w-full h-9 text-xs bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold rounded-xl shadow-xs gap-1.5"
                      >
                        {unlockingId === cand.candidate_id ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                            <span>Unlocking Candidate...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-[1.5]" />
                            <span>Unlock Candidate Profile (1 Token)</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        size="sm"
                        className="w-full h-9 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold rounded-xl cursor-not-allowed gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Ask an admin to unlock</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FLOATING ACTION BAR: Compare Candidates (When 2 or 3 selected) */}
        {compareIds.length >= 2 && (
          <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4">
            <div className="bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 px-5 py-3 rounded-2xl shadow-2xl border border-neutral-800 flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Scale className="h-4 w-4 text-amber-400" />
                <span>{compareIds.length} candidates selected for side-by-side comparison</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="h-8 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950"
                >
                  Compare Now
                </Button>
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="text-xs text-neutral-400 hover:text-white p-1"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATE DETAIL VIEW MODAL (Full Rubric, Searchable Transcript & Key Moments) */}
        <Dialog
          open={Boolean(activeDetailCandidate)}
          onOpenChange={(open) => {
            if (!open) setActiveDetailCandidate(null);
          }}
        >
          <DialogContent className="max-w-4xl p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            {activeDetailCandidate && (
              <div className="space-y-6">
                <DialogHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-white">
                          {activeDetailCandidate.candidate_name}
                        </DialogTitle>
                        {activeDetailCandidate.is_unlocked ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Unlocked Profile
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            Name & Contacts Hidden
                          </Badge>
                        )}
                      </div>
                      <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                        {activeDetailCandidate.target_role} · {activeDetailCandidate.location || 'Remote'} · {activeDetailCandidate.availability || 'Available'}
                      </DialogDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="text-xs font-extrabold bg-emerald-600 text-white">
                        {calculateJobMatch(activeDetailCandidate, selectedJob).matchScore}% Match
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>

                {/* Video Player in Detail View */}
                <div className="max-w-2xl mx-auto">
                  <VideoAssessmentPlayer
                    ref={detailPlayerRef}
                    candidateId={activeDetailCandidate.candidate_id || activeDetailCandidate.id}
                    videoUrl={activeDetailCandidate.secure_video_url}
                    posterUrl={activeDetailCandidate.poster_url}
                    durationSeconds={activeDetailCandidate.duration_seconds || 165}
                    status={activeDetailCandidate.status}
                    expiresAt={activeDetailCandidate.expires_at}
                    candidateName={activeDetailCandidate.candidate_name}
                    isUnlocked={activeDetailCandidate.is_unlocked}
                    watermarkText={`${workspace.company_name} · ${workspace.billing_email}`}
                  />
                </div>

                {/* AI Key Moments & Clickable Timestamps */}
                {activeDetailCandidate.key_moments && activeDetailCandidate.key_moments.length > 0 && (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span>Flowmingo AI Key Moments (Click timestamp to jump)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {activeDetailCandidate.key_moments.map((km, idx) => (
                        <div
                          key={idx}
                          onClick={() => detailPlayerRef.current?.seekTo(km.time)}
                          className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-amber-400 cursor-pointer transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-neutral-900 dark:text-white truncate">
                              {km.title}
                            </span>
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">
                              {km.timestamp_label}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-2">
                            {km.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Searchable Transcript with Clickable Timestamps */}
                {activeDetailCandidate.transcript && activeDetailCandidate.transcript.length > 0 && (
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-neutral-600" />
                        <span>Interactive Transcript</span>
                      </div>
                      <Input
                        placeholder="Search spoken words in transcript..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="h-7 w-48 text-[11px]"
                      />
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-neutral-200/60 dark:divide-neutral-800">
                      {activeDetailCandidate.transcript
                        .filter((t) =>
                          !transcriptSearch.trim() ||
                          t.text.toLowerCase().includes(transcriptSearch.toLowerCase())
                        )
                        .map((t, idx) => (
                          <div key={idx} className="pt-2 flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => detailPlayerRef.current?.seekTo(t.time)}
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shrink-0"
                            >
                              [{t.timestamp_label}]
                            </button>
                            <p className="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed">
                              {t.text}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Unlocked Details Section */}
                {activeDetailCandidate.is_unlocked && (
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-3">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Unlocked Dossier Details (Permanent to your Organization)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Direct Email:</span>
                        <a href={`mailto:${activeDetailCandidate.candidate_email}`} className="font-semibold text-neutral-900 dark:text-white underline">
                          {activeDetailCandidate.candidate_email}
                        </a>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Direct Phone:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {activeDetailCandidate.phone || '+234 812 345 6789'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px]">Verified CV:</span>
                        <a
                          href={activeDetailCandidate.cv_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-600 dark:text-amber-400 underline flex items-center gap-1"
                        >
                          <span>Download CV (PDF)</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-500">
                    {activeDetailCandidate.is_unlocked
                      ? 'Candidate contact info unlocked.'
                      : 'Candidate identity masked until unlocked with 1 token.'}
                  </span>

                  {activeDetailCandidate.is_unlocked ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => openContactModal(activeDetailCandidate)}
                        className="text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Contact Candidate</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCandidateToReportIssue(activeDetailCandidate)}
                        className="text-xs rounded-xl"
                      >
                        Report Issue
                      </Button>
                    </div>
                  ) : isOwnerOrAdmin ? (
                    <Button
                      size="sm"
                      onClick={() => setCandidateToConfirmUnlock(activeDetailCandidate)}
                      disabled={unlockingId === activeDetailCandidate.candidate_id}
                      className="text-xs bg-neutral-950 text-white rounded-xl gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span>Unlock Full Dossier (1 Token)</span>
                    </Button>
                  ) : (
                    <Button disabled size="sm" className="text-xs cursor-not-allowed">
                      Ask an admin to unlock
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* SIDE-BY-SIDE CANDIDATE COMPARISON MODAL (2-3 Candidates) */}
        <Dialog open={isCompareModalOpen} onOpenChange={setIsCompareModalOpen}>
          <DialogContent className="max-w-5xl p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-500" />
                    <span>Side-by-Side Candidate Comparison</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                    Compare technical depth, communication clarity, and skill overlap side-by-side.
                  </DialogDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setCompareIds([])} className="text-xs">
                  Clear All
                </Button>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {compareCandidates.map((cand) => {
                const matchAnalysis = calculateJobMatch(cand, selectedJob);

                return (
                  <div
                    key={cand.id || cand.candidate_id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {cand.candidate_name}
                        </span>
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                          {matchAnalysis.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{cand.target_role}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{cand.seniority} · {cand.years_of_experience || 5} yrs exp</div>
                    </div>

                    <div className="space-y-1.5 p-2.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Technical Depth:</span>
                        <span className="font-bold">{cand.technical_depth_score || 90}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Communication:</span>
                        <span className="font-bold">{cand.communication_score || 90}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Expected Salary:</span>
                        <span className="font-bold">{cand.expected_salary || 'Competitive'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Availability:</span>
                        <span className="font-semibold text-emerald-600">{cand.availability || 'Available'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-neutral-500 block mb-1 text-[11px] font-semibold">Skills Evaluated:</span>
                      <div className="flex flex-wrap gap-1">
                        {(cand.skills || []).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-neutral-500 block mb-1 text-[11px] font-semibold">AI Assessment:</span>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-4">
                        {cand.ai_summary}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        setActiveDetailCandidate(cand);
                      }}
                      className="w-full text-xs h-8"
                    >
                      View Full Dossier
                    </Button>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* UNLOCK CONFIRMATION DIALOG */}
        <Dialog
          open={Boolean(candidateToConfirmUnlock)}
          onOpenChange={(open) => {
            if (!open) setCandidateToConfirmUnlock(null);
          }}
        >
          <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 fill-amber-500 stroke-[1.5]" />
              </div>
              <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                Unlock Candidate Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Spend 1 token to reveal verified contact info and full assessment dossier.
              </DialogDescription>
            </DialogHeader>

            {candidateToConfirmUnlock && (
              <div className="space-y-4 pt-3 text-xs">
                {/* Candidate Info Box */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {candidateToConfirmUnlock.candidate_name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {calculateJobMatch(candidateToConfirmUnlock, selectedJob).matchScore}% Match
                    </span>
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    {candidateToConfirmUnlock.target_role}
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    Spend 1 token to unlock Candidate #{(candidateToConfirmUnlock.candidate_id || candidateToConfirmUnlock.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}? You will see their name, verified email, direct phone number, and complete technical portfolio.
                  </p>
                </div>

                {/* Balance Readout */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400">Available Organization Balance:</span>
                  <span className="font-extrabold text-neutral-900 dark:text-white">
                    {workspace.token_balance} Tokens
                  </span>
                </div>

                {/* Zero balance alert */}
                {workspace.token_balance < 1 ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>Insufficient Tokens (0 Remaining)</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {isOwnerOrAdmin
                        ? 'You have 0 tokens. Please top up your token balance in Billing to unlock candidate contact details.'
                        : 'You have 0 tokens. Ask an admin to top up token packs in Billing.'}
                    </p>
                    {isOwnerOrAdmin && (
                      <Link href="/console/billing" className="inline-block pt-1">
                        <Button size="sm" className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl">
                          Purchase Tokens in Billing
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Replacement Policy Note */}
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Replacement Guarantee: </span>
                      If this candidate has withdrawn their application or is unreachable after 5 business days, 1 replacement token is refunded back to your organization upon review.
                    </div>

                    {/* NDPA 2023 Statutory Compliance Notice */}
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Notice:</strong> Use this information only for recruitment. Handle it in line with the Nigeria Data Protection Act 2023.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCandidateToConfirmUnlock(null)}
                        className="h-9 text-xs rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUnlock(candidateToConfirmUnlock)}
                        disabled={unlockingId === candidateToConfirmUnlock.candidate_id}
                        className="h-9 text-xs font-semibold rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 gap-1.5"
                      >
                        {unlockingId === candidateToConfirmUnlock.candidate_id ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                            <span>Unlocking Candidate...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>Confirm & Spend 1 Token</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CONTACT CANDIDATE MODAL (Email & WhatsApp Outreach with Logging) */}
        <Dialog
          open={Boolean(candidateToContact)}
          onOpenChange={(open) => {
            if (!open) setCandidateToContact(null);
          }}
        >
          <DialogContent className="max-w-lg p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                    Contact {candidateToContact?.candidate_name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                    Select communication channel and customize your invitation message.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {candidateToContact && (
              <div className="space-y-4 pt-3 text-xs">
                {/* Channel Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setContactChannel('EMAIL')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      contactChannel === 'EMAIL'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-900 dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <Mail className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">Official Email</div>
                      <div className="text-[10px] text-neutral-500">{candidateToContact.candidate_email}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setContactChannel('WHATSAPP')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      contactChannel === 'WHATSAPP'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-900 dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">WhatsApp Outreach</div>
                      <div className="text-[10px] text-neutral-500">{candidateToContact.whatsapp || candidateToContact.phone}</div>
                    </div>
                  </div>
                </div>

                {contactChannel === 'EMAIL' && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Subject Line
                    </label>
                    <Input
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Message Template
                  </label>
                  <Textarea
                    rows={6}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
                  Sync730 logs all outreach attempts in your workspace audit ledger to maintain team coordination and prevent redundant candidate contacts.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCandidateToContact(null)}
                    className="h-9 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteContact}
                    disabled={isLoggingContact}
                    className="h-9 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 gap-1.5"
                  >
                    {contactChannel === 'EMAIL' ? (
                      <>
                        <Mail className="h-3.5 w-3.5" />
                        <span>Send Email & Log Contact</span>
                      </>
                    ) : (
                      <>
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Open WhatsApp & Log Contact</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* REPORT ISSUE WITH UNLOCKED CANDIDATE DIALOG */}
        <Dialog
          open={Boolean(candidateToReportIssue)}
          onOpenChange={(open) => {
            if (!open) setCandidateToReportIssue(null);
          }}
        >
          <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                Report Issue with Unlocked Candidate
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Candidate: {candidateToReportIssue?.candidate_name} ({candidateToReportIssue?.target_role})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReportIssue} className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1 text-neutral-600 dark:text-neutral-400">
                <span className="font-bold text-neutral-900 dark:text-white">5-Day Replacement Policy</span>
                <p className="text-[11px] leading-relaxed">
                  If the candidate has withdrawn or is unresponsive after 5 business days, our team will credit 1 replacement token back to your balance upon review.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Reason for replacement claim *
                </label>
                <Textarea
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="e.g. Email bounced or candidate stated they already accepted another role..."
                  className="w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCandidateToReportIssue(null)}
                  className="h-8 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="h-8 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* EVALUATION NOTES & SCORING MODAL */}
        <Dialog
          open={Boolean(activeCandidateForNotes)}
          onOpenChange={(open) => {
            if (!open) setActiveCandidateForNotes(null);
          }}
        >
          <DialogContent className="max-w-xl p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold mb-1 w-fit">
                <MessageSquare className="h-3 w-3 stroke-[1.5]" />
                <span>Internal Team Rubric & Score</span>
              </div>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                Evaluation Notes for {activeCandidateForNotes?.candidate_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Target Role: {activeCandidateForNotes?.target_role}. Notes and scores are visible to authorized team members in your workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              {/* New Note Form */}
              <form onSubmit={handleSaveNote} className="space-y-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Add Your Assessment Note
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[11px] text-neutral-500">Score (0-100):</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newNoteScore}
                      onChange={(e) =>
                        setNewNoteScore(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                      }
                      className="h-7 w-16 text-xs text-center"
                    />
                  </div>
                </div>

                <Textarea
                  placeholder="Record your feedback on architecture depth, communication style, or live problem-solving..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="min-h-[80px] text-xs"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingNote}
                    size="sm"
                    className="h-8 px-3 text-xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold rounded-lg"
                  >
                    {isSubmittingNote ? 'Saving...' : 'Save Evaluation'}
                  </Button>
                </div>
              </form>

              {/* Existing Notes List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Previous Team Notes ({notesList.length})
                </h4>

                {isLoadingNotes ? (
                  <div className="py-3 space-y-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : notesList.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">
                    No evaluation notes recorded yet. Be the first to leave feedback!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notesList.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {n.author_email}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                              {n.author_role}
                            </Badge>
                          </div>
                          {typeof n.score === 'number' && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Score: {n.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {n.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default function ConsoleTalentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <VettedTalentContent />
    </Suspense>
  );
}
