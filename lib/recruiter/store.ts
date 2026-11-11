import {
  CorporateWorkspace,
  WorkspaceMember,
  EmployerJob,
  VideoAssessment,
  TokenUnlockRecord,
  RecruiterRole,
} from './types';
import { createBrowserClient } from '@/lib/supabase/client';

const WORKSPACE_KEY = 'sync730_active_workspace';
const JOBS_KEY = 'sync730_employer_jobs';
const ASSESSMENTS_KEY = 'sync730_talent_assessments';
const UNLOCKS_KEY = 'sync730_token_unlocks';
const MEMBERS_KEY = 'sync730_workspace_members';

// Default initial corporate workspace
export const DEFAULT_WORKSPACE: CorporateWorkspace = {
  id: 'ws-sync730-demo',
  company_name: 'Acme Global Ventures',
  billing_email: 'recruiting@acmeglobal.com',
  token_balance: 2, // 2 free trial tokens
  industry: 'Fintech & Cloud Software',
  company_size: '50-200 Employees',
  created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
};

// Initial Seed Candidates with Video Assessments
export const SEED_VIDEO_ASSESSMENTS: (VideoAssessment & { real_name: string; real_email: string; phone: string })[] = [
  {
    id: 'va-cand-001',
    candidate_id: 'cand-001-jane-doe',
    target_role: 'Senior Full Stack Engineer (Next.js & Supabase)',
    overall_match_score: 95,
    technical_depth_score: 96,
    communication_score: 92,
    ai_summary:
      'Demonstrated high-velocity engineering depth across Next.js 14 App Router, Server Actions, and distributed Supabase architectures. Articulated nuanced tradeoffs between streaming SSR and state collocation with high clarity. Verified 0 proctoring infractions.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    real_name: 'Jane Doe',
    real_email: 'jane.doe@sync730.com',
    phone: '+234 812 345 6789',
  },
  {
    id: 'va-cand-002',
    candidate_id: 'cand-002-chinedu-eze',
    target_role: 'Lead Product Designer (Design Systems & Mobile UX)',
    overall_match_score: 91,
    technical_depth_score: 89,
    communication_score: 94,
    ai_summary:
      'Presents comprehensive mastery of multi-brand design token architectures, Figma variable systems, and accessible WCAG 2.1 AAA touch states. Communicates design decisions with executive polish and strong business empathy.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    real_name: 'Chinedu Eze',
    real_email: 'chinedu.eze@sync730.com',
    phone: '+234 803 987 6543',
  },
  {
    id: 'va-cand-003',
    candidate_id: 'cand-003-amara-okonkwo',
    target_role: 'Staff Site Reliability Engineer (Kubernetes & SRE)',
    overall_match_score: 93,
    technical_depth_score: 97,
    communication_score: 88,
    ai_summary:
      'Exemplary incident triage and distributed systems resilience. Detailed multi-cluster ArgoCD GitOps pipelines, Terraform IaC state locking, and automated disaster recovery scenarios across AWS and GCP with zero downtime.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
    real_name: 'Amara Okonkwo',
    real_email: 'amara.okonkwo@sync730.com',
    phone: '+234 901 234 5678',
  },
];

// Initial Seed Jobs
export const INITIAL_EMPLOYER_JOBS: EmployerJob[] = [
  {
    id: 'job-emp-001',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Senior Full Stack Engineer (Next.js & Supabase)',
    flowmingo_project_id: 'mock_flowmingo_proj_8921',
    status: 'active',
    department: 'Engineering',
    location: '100% Remote (Global Overlap)',
    job_type: 'Full-time',
    salary_range: '$95,000 - $130,000 USD',
    description: 'We are seeking an autonomous Senior Full Stack Engineer to lead web architecture, Core Web Vitals optimization, and real-time backend integrations.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'job-emp-002',
    workspace_id: 'ws-sync730-demo',
    job_title: 'Staff Cloud Infrastructure & SRE',
    flowmingo_project_id: 'mock_flowmingo_proj_3104',
    status: 'active',
    department: 'DevOps & Infrastructure',
    location: 'Remote (US / EMEA Hours)',
    job_type: 'Full-time',
    salary_range: '$110,000 - $150,000 USD',
    description: 'Scale multi-tenant Kubernetes clusters, manage automated CI/CD deployment gates, and ensure 99.99% uptime across production services.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

// Initial Workspace Members
export const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem-001',
    workspace_id: 'ws-sync730-demo',
    user_id: 'recruiter-admin-user',
    role: 'OWNER',
    email: 'alex.morgan@acmeglobal.com',
    full_name: 'Alex Morgan',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'mem-002',
    workspace_id: 'ws-sync730-demo',
    user_id: 'interviewer-user-01',
    role: 'INTERVIEWER',
    email: 'sarah.tech@acmeglobal.com',
    full_name: 'Sarah Chen (Tech Lead)',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
];

// In-Memory store for Server-side fallback
let globalServerStore = {
  workspace: DEFAULT_WORKSPACE,
  jobs: [...INITIAL_EMPLOYER_JOBS],
  assessments: [...SEED_VIDEO_ASSESSMENTS],
  unlocks: [] as TokenUnlockRecord[],
  members: [...INITIAL_MEMBERS],
};

/* ==============================================================================
 * B2B Store Client Functions
 * ============================================================================== */

export function getLocalWorkspace(): CorporateWorkspace {
  if (typeof window === 'undefined') return globalServerStore.workspace;
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(DEFAULT_WORKSPACE));
      return DEFAULT_WORKSPACE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveLocalWorkspace(ws: CorporateWorkspace) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(ws));
      window.dispatchEvent(new Event('sync730_workspace_updated'));
    } catch (e) {
      console.warn('Failed to save workspace to localStorage:', e);
    }
  }
  globalServerStore.workspace = ws;
}

export function getLocalJobs(): EmployerJob[] {
  if (typeof window === 'undefined') return globalServerStore.jobs;
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(INITIAL_EMPLOYER_JOBS));
      return INITIAL_EMPLOYER_JOBS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYER_JOBS;
  }
}

export function saveLocalJobs(jobs: EmployerJob[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
      window.dispatchEvent(new Event('sync730_jobs_updated'));
    } catch (e) {
      console.warn('Failed to save jobs to localStorage:', e);
    }
  }
  globalServerStore.jobs = jobs;
}

export function getLocalUnlocks(workspaceId?: string): TokenUnlockRecord[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.unlocks.filter((u) => u.workspace_id === workspaceId)
      : globalServerStore.unlocks;
  }
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    const unlocks: TokenUnlockRecord[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? unlocks.filter((u) => u.workspace_id === workspaceId) : unlocks;
  } catch {
    return [];
  }
}

export function saveLocalUnlock(unlock: TokenUnlockRecord) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalUnlocks();
      const updated = [...existing.filter((u) => !(u.workspace_id === unlock.workspace_id && u.candidate_id === unlock.candidate_id)), unlock];
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_unlocks_updated'));
    } catch (e) {
      console.warn('Failed to save unlock to localStorage:', e);
    }
  }
  globalServerStore.unlocks.push(unlock);
}

export function getLocalAssessments(): (VideoAssessment & { real_name?: string; real_email?: string; phone?: string })[] {
  if (typeof window === 'undefined') return globalServerStore.assessments;
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    if (!raw) {
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(SEED_VIDEO_ASSESSMENTS));
      return SEED_VIDEO_ASSESSMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_VIDEO_ASSESSMENTS;
  }
}

export function saveLocalAssessment(assessment: VideoAssessment & { real_name?: string; real_email?: string }) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalAssessments();
      const idx = existing.findIndex((a) => a.id === assessment.id || a.candidate_id === assessment.candidate_id);
      let updated;
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...existing[idx], ...assessment };
      } else {
        updated = [assessment, ...existing];
      }
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_assessments_updated'));
    } catch (e) {
      console.warn('Failed to save assessment to localStorage:', e);
    }
  }
  globalServerStore.assessments.push(assessment as any);
}

export function getLocalMembers(workspaceId?: string): WorkspaceMember[] {
  if (typeof window === 'undefined') return globalServerStore.members;
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    const members: WorkspaceMember[] = JSON.parse(raw);
    return workspaceId ? members.filter((m) => m.workspace_id === workspaceId) : members;
  } catch {
    return INITIAL_MEMBERS;
  }
}

export function saveLocalMember(member: WorkspaceMember) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalMembers();
      const updated = [...existing, member];
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_members_updated'));
    } catch (e) {
      console.warn('Failed to save member to localStorage:', e);
    }
  }
  globalServerStore.members.push(member);
}

/**
 * Mask a candidate assessment according to strict B2B privacy rules
 */
export function formatMaskedCandidate(
  cand: VideoAssessment & { real_name?: string; real_email?: string; phone?: string },
  isUnlocked: boolean
): VideoAssessment {
  if (isUnlocked) {
    return {
      ...cand,
      candidate_name: cand.real_name || cand.candidate_name || 'Verified Professional',
      candidate_email: cand.real_email || cand.candidate_email || 'candidate@sync730.com',
      is_unlocked: true,
    };
  }

  // Generate deterministic masked ID
  const shortId = (cand.candidate_id || cand.id || 'CAND').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return {
    ...cand,
    candidate_name: `Sync730 Verified Candidate #${shortId}`,
    candidate_email: 'masked@sync730.com',
    is_unlocked: false,
  };
}
