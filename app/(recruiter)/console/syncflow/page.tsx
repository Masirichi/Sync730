'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Columns3,
  Search,
  Plus,
  Users,
  Video,
  MessageSquare,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  Building2,
  Clock,
  BadgeCheck,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Briefcase,
  Star,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export type RecruiterSyncFlowStage =
  | 'SOURCED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'ARCHIVED';

export interface RecruiterTalentItem {
  id: string;
  candidate_id: string;
  name: string;
  role: string;
  seniority: 'Mid' | 'Senior' | 'Lead' | 'Staff';
  location: string;
  avatar_url?: string;
  match_score: number;
  tech_depth: number;
  communication_score: number;
  skills: string[];
  expected_salary_ngn: string;
  job_title: string;
  stage: RecruiterSyncFlowStage;
  updated_at: string;
  notes: string[];
  interview_date?: string;
}

const STAGES_CONFIG: {
  id: RecruiterSyncFlowStage;
  label: string;
  colorClass: string;
  borderClass: string;
  dotClass: string;
  description: string;
}[] = [
  {
    id: 'SOURCED',
    label: 'Sourced & Matched',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-500',
    description: 'Vetted candidates matched from marketplace or inbound sourcing.',
  },
  {
    id: 'SCREENING',
    label: 'AI Screening & Rubric',
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500',
    description: 'Calibrated STAR video reviews and GitHub code architecture evaluation.',
  },
  {
    id: 'INTERVIEW',
    label: 'Interview Scheduled',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
    dotClass: 'bg-purple-500',
    description: 'Live technical deep-dive and system design team rounds.',
  },
  {
    id: 'OFFER',
    label: 'Offer Extended',
    colorClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-500/30',
    dotClass: 'bg-[#FF5500]',
    description: 'Offer letters, compensation in Naira (₦), and terms review.',
  },
  {
    id: 'HIRED',
    label: 'Hired & Onboarded',
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    description: 'Accepted offers and successfully placed technical talents.',
  },
];

const SEED_TALENTS: RecruiterTalentItem[] = [
  {
    id: 'sync-1',
    candidate_id: 'cand-001',
    name: 'David O. Alabi',
    role: 'Senior Distributed Systems Engineer',
    seniority: 'Senior',
    location: 'Lagos, Nigeria (WAT)',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    match_score: 96,
    tech_depth: 94,
    communication_score: 91,
    skills: ['Go', 'Kafka', 'Rust', 'Kubernetes', 'gRPC'],
    expected_salary_ngn: '₦32,000,000 / yr',
    job_title: 'Senior Backend Engineer (Go & Distributed)',
    stage: 'SOURCED',
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: ['Excellent architecture breakdown in STAR interview. 7+ yrs distributed Go.'],
  },
  {
    id: 'sync-2',
    candidate_id: 'cand-002',
    name: 'Amina K. Bello',
    role: 'Cloud Architect & Infrastructure Lead',
    seniority: 'Lead',
    location: 'Lagos, Nigeria (WAT)',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80',
    match_score: 95,
    tech_depth: 96,
    communication_score: 94,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Prometheus'],
    expected_salary_ngn: '₦38,000,000 / yr',
    job_title: 'Staff Cloud & DevOps Architect',
    stage: 'SCREENING',
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: ['Automated rubric passed with zero integrity flags. High Kubernetes mastery.'],
  },
  {
    id: 'sync-3',
    candidate_id: 'cand-003',
    name: 'Chidi N. Okafor',
    role: 'Staff Full-Stack & Systems Engineer',
    seniority: 'Staff',
    location: 'Lagos, Nigeria (WAT)',
    avatar_url: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=300&auto=format&fit=crop&q=80',
    match_score: 97,
    tech_depth: 98,
    communication_score: 95,
    skills: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
    expected_salary_ngn: '₦35,000,000 / yr',
    job_title: 'Senior Full Stack Engineer (Fintech Core)',
    stage: 'INTERVIEW',
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    notes: ['System design round scheduled for Monday 10:00 AM WAT.'],
    interview_date: 'Mon, 10:00 AM WAT',
  },
  {
    id: 'sync-4',
    candidate_id: 'cand-004',
    name: 'Fatima B. Mohammed',
    role: 'Lead AI / ML Systems Engineer',
    seniority: 'Lead',
    location: 'Lagos, Nigeria (WAT)',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    match_score: 98,
    tech_depth: 97,
    communication_score: 93,
    skills: ['Python', 'PyTorch', 'Vector Search', 'FastAPI', 'LLM RAG'],
    expected_salary_ngn: '₦40,000,000 / yr',
    job_title: 'Lead AI / LLM Application Engineer',
    stage: 'OFFER',
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    notes: ['Formal offer letter extended in Naira with stock option package.'],
  },
  {
    id: 'sync-5',
    candidate_id: 'cand-005',
    name: 'Babajide A. Adeyemi',
    role: 'Senior SRE & Security Engineer',
    seniority: 'Senior',
    location: 'Lagos, Nigeria (WAT)',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    match_score: 94,
    tech_depth: 93,
    communication_score: 90,
    skills: ['Linux Kernel', 'Docker', 'eBPF', 'WAF', 'PostgreSQL'],
    expected_salary_ngn: '₦30,000,000 / yr',
    job_title: 'Security Operations & SRE Specialist',
    stage: 'HIRED',
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    notes: ['Offer accepted! Onboarding starts 1st of next month.'],
  },
];

export default function RecruiterSyncFlowPage() {
  const router = useRouter();

  const [talents, setTalents] = useState<RecruiterTalentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');

  // Drawer / Details Modal State
  const [selectedTalent, setSelectedTalent] = useState<RecruiterTalentItem | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Schedule Interview Dialog State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTalent, setScheduleTalent] = useState<RecruiterTalentItem | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');

  // Add Note Dialog State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteTalent, setNoteTalent] = useState<RecruiterTalentItem | null>(null);
  const [newNote, setNewNote] = useState('');

  // Load from local storage or initialize with seed data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sync730_recruiter_syncflow_pipeline');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTalents(parsed);
          return;
        }
      }
    } catch {}

    setTalents(SEED_TALENTS);
    try {
      localStorage.setItem('sync730_recruiter_syncflow_pipeline', JSON.stringify(SEED_TALENTS));
    } catch {}
  }, []);

  const saveTalents = (items: RecruiterTalentItem[]) => {
    setTalents(items);
    try {
      localStorage.setItem('sync730_recruiter_syncflow_pipeline', JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('sync730_recruiter_syncflow_updated'));
    } catch {}
  };

  // Move Stage Handler
  const handleMoveStage = (id: string, newStage: RecruiterSyncFlowStage) => {
    const updated = talents.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          stage: newStage,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    saveTalents(updated);
    const stageLabel = STAGES_CONFIG.find((s) => s.id === newStage)?.label || newStage;
    toast.success(`Talent advanced to ${stageLabel}`);
  };

  // Schedule Interview Submit
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTalent || !interviewDate || !interviewTime) {
      toast.error('Please specify both date and time for the interview.');
      return;
    }

    const scheduledString = `${interviewDate} at ${interviewTime} WAT`;
    const updated = talents.map((t) => {
      if (t.id === scheduleTalent.id) {
        return {
          ...t,
          stage: 'INTERVIEW' as RecruiterSyncFlowStage,
          interview_date: scheduledString,
          notes: [...t.notes, `Interview scheduled: ${scheduledString}`],
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    saveTalents(updated);
    setIsScheduleOpen(false);
    toast.success(`Interview scheduled for ${scheduleTalent.name} (${scheduledString})`);
  };

  // Add Note Submit
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTalent || !newNote.trim()) return;

    const updated = talents.map((t) => {
      if (t.id === noteTalent.id) {
        return {
          ...t,
          notes: [...t.notes, newNote.trim()],
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    saveTalents(updated);
    setNewNote('');
    setIsNoteOpen(false);
    toast.success('Private evaluation note saved');
  };

  // Unique list of jobs for filter
  const uniqueJobs = useMemo(() => {
    const set = new Set<string>();
    talents.forEach((t) => set.add(t.job_title));
    return Array.from(set);
  }, [talents]);

  // Filtered Talents
  const filteredTalents = useMemo(() => {
    return talents.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesJob = selectedJobFilter === 'ALL' || t.job_title === selectedJobFilter;

      return matchesSearch && matchesJob;
    });
  }, [talents, searchQuery, selectedJobFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Seniority', 'Location', 'Match Score', 'Stage', 'Expected Salary (NGN)', 'Job Title'];
    const rows = filteredTalents.map((t) => [
      `"${t.name}"`,
      `"${t.role}"`,
      `"${t.seniority}"`,
      `"${t.location}"`,
      `"${t.match_score}%"`,
      `"${t.stage}"`,
      `"${t.expected_salary_ngn}"`,
      `"${t.job_title}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `syncflow_talent_pipeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('SyncFlow talent pipeline exported to CSV');
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Columns3 className="h-3.5 w-3.5 text-[#FF5500]" />
            <span>SYNCFLOW RECRUITER ATS</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            SyncFlow Talent Pipeline
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage vetted African engineers across your hiring stages with calibrated AI scorecards and real-time chat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Pipeline</span>
          </Button>

          <Link href="/console/talent">
            <Button
              size="sm"
              className="bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs h-9 gap-1.5 shadow-sm shadow-orange-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add from Vetted Talent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES_CONFIG.map((stage) => {
          const count = talents.filter((t) => t.stage === stage.id).length;
          return (
            <div
              key={stage.id}
              className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {stage.label}
                </span>
                <span className={`h-2 w-2 rounded-full ${stage.dotClass}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground tabular-nums">
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-2xl border border-border/70">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidate by name, skills (e.g. Go, Rust, AWS), or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-background/90 border-border/80"
          />
        </div>

        {/* Job Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Filter Search:</span>
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="h-10 rounded-xl border border-border/80 bg-background/90 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Active Searches ({talents.length})</option>
            {uniqueJobs.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4.5 overflow-x-auto pb-6">
        {STAGES_CONFIG.map((stage) => {
          const stageTalents = filteredTalents.filter((t) => t.stage === stage.id);

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl border border-border/80 bg-secondary/20 p-3 min-w-[260px] h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.dotClass}`} />
                  <span className="text-xs font-bold text-foreground">
                    {stage.label}
                  </span>
                </div>
                <span className="rounded-full bg-background border border-border/70 px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">
                  {stageTalents.length}
                </span>
              </div>

              {/* Candidates List in this Column */}
              <div className="mt-3 space-y-3 flex-1 min-h-[380px]">
                {stageTalents.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/70 rounded-xl text-muted-foreground text-xs">
                    <Users className="h-5 w-5 mb-1.5 opacity-40" />
                    <span>No candidates in {stage.label}</span>
                  </div>
                ) : (
                  stageTalents.map((talent) => (
                    <div
                      key={talent.id}
                      className="group relative rounded-xl border border-border/80 bg-card p-4 shadow-sm hover:border-orange-500/40 hover:shadow-md transition-all duration-200"
                    >
                      {/* Top Row: Avatar & Match Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-9 w-9 rounded-full overflow-hidden border border-border/70 bg-secondary shrink-0">
                            {talent.avatar_url ? (
                              <img
                                src={talent.avatar_url}
                                alt={talent.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                                {talent.name.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                              {talent.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {talent.seniority} · {talent.location}
                            </p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          {talent.match_score}%
                        </span>
                      </div>

                      {/* Role & Target Job */}
                      <div className="mt-2.5">
                        <p className="text-xs font-medium text-foreground line-clamp-1">
                          {talent.role}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          Target: {talent.job_title}
                        </p>
                      </div>

                      {/* Skills Tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {talent.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-secondary/70 border border-border/60 px-1.5 py-0.5 text-[9px] font-medium text-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                        {talent.skills.length > 3 && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            +{talent.skills.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Naira Compensation Display */}
                      <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
                        <span className="text-muted-foreground">Comp (NGN):</span>
                        <span className="font-semibold text-foreground">
                          {talent.expected_salary_ngn}
                        </span>
                      </div>

                      {/* Interview Date if present */}
                      {talent.interview_date && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 px-2 py-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="truncate">{talent.interview_date}</span>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="mt-3.5 pt-2 border-t border-border/60 flex items-center justify-between gap-1">
                        {/* Quick Direct Chat */}
                        <Link
                          href={`/console/messages?candidate=${encodeURIComponent(talent.name)}`}
                          title="Direct Message"
                          className="h-7 w-7 rounded-lg border border-border/80 bg-background hover:border-orange-500/40 hover:text-orange-500 flex items-center justify-center text-muted-foreground transition-colors shrink-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>

                        {/* View Dossier / Rubric */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTalent(talent);
                            setIsDossierOpen(true);
                          }}
                          title="View Assessment Dossier"
                          className="h-7 w-7 rounded-lg border border-border/80 bg-background hover:border-orange-500/40 hover:text-orange-500 flex items-center justify-center text-muted-foreground transition-colors shrink-0"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        {/* Schedule Interview */}
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleTalent(talent);
                            setIsScheduleOpen(true);
                          }}
                          title="Schedule Interview"
                          className="h-7 w-7 rounded-lg border border-border/80 bg-background hover:border-orange-500/40 hover:text-orange-500 flex items-center justify-center text-muted-foreground transition-colors shrink-0"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>

                        {/* Move Stage Selector */}
                        <div className="relative">
                          <select
                            value={talent.stage}
                            onChange={(e) =>
                              handleMoveStage(talent.id, e.target.value as RecruiterSyncFlowStage)
                            }
                            className="h-7 text-[10px] font-semibold rounded-lg border border-border/80 bg-background text-foreground px-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                          >
                            <option value="SOURCED">Sourced</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hired</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Evaluation Dossier Sheet */}
      <Sheet open={isDossierOpen} onOpenChange={setIsDossierOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTalent && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-border/80 shrink-0">
                    {selectedTalent.avatar_url ? (
                      <img
                        src={selectedTalent.avatar_url}
                        alt={selectedTalent.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-bold">
                        {selectedTalent.name.substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <SheetTitle className="text-lg font-bold">
                      {selectedTalent.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {selectedTalent.role} · {selectedTalent.location}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Match & Evaluation Metrics */}
              <div className="space-y-3 rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Overall AI Match</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {selectedTalent.match_score}%
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Technical Depth Score</span>
                    <span className="font-semibold text-foreground">{selectedTalent.tech_depth} / 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${selectedTalent.tech_depth}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-muted-foreground">STAR Communication Score</span>
                    <span className="font-semibold text-foreground">{selectedTalent.communication_score} / 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${selectedTalent.communication_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Compensation in Naira */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Expected Compensation</span>
                  <p className="text-base font-bold text-foreground">
                    {selectedTalent.expected_salary_ngn}
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-xs">
                  Verified Local NGN
                </Badge>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Verified Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTalent.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-border/80 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Evaluation Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Evaluation Notes
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteTalent(selectedTalent);
                      setIsNoteOpen(true);
                    }}
                    className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Note
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedTalent.notes.map((n, i) => (
                    <div key={i} className="rounded-xl border border-border/70 bg-secondary/20 p-3 text-xs text-foreground">
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-border/70 flex gap-3">
                <Link
                  href={`/console/messages?candidate=${encodeURIComponent(selectedTalent.name)}`}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-xs font-semibold text-white shadow-md shadow-orange-500/20"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Start Direct Chat</span>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setIsDossierOpen(false)}
                  className="rounded-full h-11 px-6 text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Schedule Technical Interview
            </DialogTitle>
            <DialogDescription className="text-xs">
              Coordinate technical rounds with {scheduleTalent?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Interview Date</label>
              <Input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="mt-1 h-9 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Time (West Africa Time / WAT)</label>
              <Input
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-semibold"
              >
                Confirm & Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Private Candidate Note
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record interview feedback or team impressions for {noteTalent?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNoteSubmit} className="space-y-4 py-2">
            <Textarea
              placeholder="e.g. Strong system design instincts on Redis caching and high-availability database replication..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="text-xs"
              required
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNoteOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-semibold"
              >
                Save Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
