import {
  CorporateWorkspace,
  WorkspaceMember,
  EmployerJob,
  VideoAssessment,
  TokenUnlockRecord,
  CandidateContactLog,
  RecruiterRole,
} from './types';
import { createBrowserClient } from '@/lib/supabase/client';

const WORKSPACE_KEY = 'sync730_active_workspace';
const JOBS_KEY = 'sync730_employer_jobs';
const ASSESSMENTS_KEY = 'sync730_talent_assessments';
const UNLOCKS_KEY = 'sync730_token_unlocks';
const MEMBERS_KEY = 'sync730_workspace_members';
const CONTACT_LOGS_KEY = 'sync730_candidate_contact_logs';

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

// Initial Seed Candidates with Video Assessments & Rich Vetting Metrics
export const SEED_VIDEO_ASSESSMENTS: (VideoAssessment & {
  real_name: string;
  real_email: string;
  phone: string;
  whatsapp?: string;
  cv_url?: string;
})[] = [
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
    poster_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 165, // 2:45
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    seniority: 'Senior',
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Node.js', 'Tailwind CSS', 'PostgreSQL'],
    years_of_experience: 6,
    availability: 'Available',
    expected_salary: '$95,000 - $125,000 USD',
    location: 'Lagos, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    real_name: 'Jane Doe',
    real_email: 'jane.doe@sync730.com',
    phone: '+234 812 345 6789',
    whatsapp: '+2348123456789',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/jane_doe_fullstack_lead.pdf',
    transcript: [
      {
        time: 15,
        timestamp_label: '0:15',
        text: 'In our enterprise Next.js application, we segregated dynamic client state from heavy server-side streaming chunks to eliminate hydration waterfalls.',
      },
      {
        time: 48,
        timestamp_label: '0:48',
        text: 'For Supabase, we enforced granular Row-Level Security policies tied to JWT auth claims and tuned postgres indexes for tenant isolation.',
      },
      {
        time: 95,
        timestamp_label: '1:35',
        text: 'When handling high-frequency webhooks, we buffered incoming payloads through idempotent queue workers to guarantee at-least-once processing without race conditions.',
      },
      {
        time: 140,
        timestamp_label: '2:20',
        text: 'To ensure zero regressions, we maintain 90% unit test coverage using Vitest and verify critical user flows with Playwright end-to-end.',
      },
    ],
    key_moments: [
      {
        time: 15,
        timestamp_label: '0:15',
        title: 'App Router Hydration & Streaming Optimization',
        summary: 'Deep architectural dive on eliminating client waterfalls using React Server Components.',
      },
      {
        time: 48,
        timestamp_label: '0:48',
        title: 'Multi-Tenant Supabase RLS & Index Tuning',
        summary: 'Details strict database security boundaries with zero authorization bypasses.',
      },
      {
        time: 95,
        timestamp_label: '1:35',
        title: 'Idempotent Webhook & Queue Worker Architecture',
        summary: 'Explains distributed concurrency safeguards for external payment and partner events.',
      },
    ],
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
    poster_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 210, // 3:30
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    seniority: 'Lead',
    skills: ['Figma', 'Design Systems', 'Mobile UX', 'Design Tokens', 'User Research', 'Accessibility (WCAG)'],
    years_of_experience: 8,
    availability: 'Open to offers',
    expected_salary: '$110,000 - $135,000 USD',
    location: 'Abuja, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    real_name: 'Chinedu Eze',
    real_email: 'chinedu.eze@sync730.com',
    phone: '+234 803 987 6543',
    whatsapp: '+2348039876543',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/chinedu_eze_lead_designer.pdf',
    transcript: [
      {
        time: 20,
        timestamp_label: '0:20',
        text: 'Our design system unified 4 distinct mobile and desktop brand properties into a single semantic token matrix using Figma Variables.',
      },
      {
        time: 75,
        timestamp_label: '1:15',
        text: 'We audited color contrast to ensure WCAG 2.1 AAA compliance and established 48x48 pixel touch target baselines across all mobile touchpoints.',
      },
      {
        time: 150,
        timestamp_label: '2:30',
        text: 'Collaborating directly with engineering via Storybook and token transformers, we reduced handoff drift and shipping cycle times by 40%.',
      },
    ],
    key_moments: [
      {
        time: 20,
        timestamp_label: '0:20',
        title: 'Multi-Brand Token Architecture',
        summary: 'Demonstrates unified typography, elevation, and palette primitives across cross-functional platforms.',
      },
      {
        time: 75,
        timestamp_label: '1:15',
        title: 'Accessibility & Contrast Compliance',
        summary: 'Emphasizes inclusive design guidelines for diverse global audiences.',
      },
    ],
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
    poster_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 195, // 3:15
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
    seniority: 'Staff',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'ArgoCD', 'CI/CD Pipelines', 'Prometheus', 'Grafana'],
    years_of_experience: 10,
    availability: 'Available',
    expected_salary: '$130,000 - $160,000 USD',
    location: 'Nairobi, Kenya',
    timezone: 'EAT (UTC+3)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
    real_name: 'Amara Okonkwo',
    real_email: 'amara.okonkwo@sync730.com',
    phone: '+234 901 234 5678',
    whatsapp: '+2349012345678',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/amara_okonkwo_staff_sre.pdf',
    transcript: [
      {
        time: 18,
        timestamp_label: '0:18',
        text: 'We managed multi-region EKS clusters backed by Karpenter for dynamic node autoscaling based on custom Prometheus queue depth metrics.',
      },
      {
        time: 68,
        timestamp_label: '1:08',
        text: 'During simulated regional network partition drills, our ArgoCD GitOps sync restored 100% of cluster state within 90 seconds.',
      },
      {
        time: 130,
        timestamp_label: '2:10',
        text: 'We implemented OpenTelemetry tracing across all gRPC services, allowing us to drop mean time to detection (MTTD) from 15 minutes to under 2 minutes.',
      },
    ],
    key_moments: [
      {
        time: 18,
        timestamp_label: '0:18',
        title: 'Kubernetes Autoscaling with Karpenter',
        summary: 'Cost-optimized infrastructure scaling managing spike loads with zero latency degradation.',
      },
      {
        time: 68,
        timestamp_label: '1:08',
        title: 'GitOps Disaster Recovery Drill',
        summary: 'Proves failover resilience and automated cluster state reconciliation.',
      },
    ],
  },
  {
    id: 'va-cand-004',
    candidate_id: 'cand-004-tariq-mansoor',
    target_role: 'Senior AI / LLM Engineer (RAG & Autonomous Agents)',
    overall_match_score: 90,
    technical_depth_score: 93,
    communication_score: 88,
    ai_summary:
      'Flowmingo AI is currently transcribing and analyzing acoustic clarity, vector embeddings of reasoning depth, and anti-cheating gaze consistency.',
    secure_video_url: '',
    poster_url: '',
    duration_seconds: 0,
    proctoring_flags: [],
    status: 'PROCESSING',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    seniority: 'Senior',
    skills: ['Python', 'FastAPI', 'LangChain', 'Vector DBs', 'PyTorch', 'Next.js'],
    years_of_experience: 7,
    availability: 'Open to offers',
    expected_salary: '$115,000 - $145,000 USD',
    location: 'Cairo, Egypt',
    timezone: 'EET (UTC+2)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 2).toISOString(),
    real_name: 'Tariq Mansoor',
    real_email: 'tariq.mansoor@sync730.com',
    phone: '+234 818 765 4321',
    whatsapp: '+2348187654321',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/tariq_mansoor_ai_engineer.pdf',
  },
  {
    id: 'va-cand-005',
    candidate_id: 'cand-005-kemi-adebayo',
    target_role: 'Mid-Level Frontend Engineer (React & TypeScript)',
    overall_match_score: 87,
    technical_depth_score: 88,
    communication_score: 91,
    ai_summary:
      'Strong execution on accessible web components, React 18 concurrent rendering, and performant state normalization. Articulates component lifecycle clearly.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 180, // 3:00
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 390).toISOString(), // ~13 months ago (flags >12m advisory)
    seniority: 'Mid-Level',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Jest', 'HTML5/CSS3'],
    years_of_experience: 4,
    availability: 'Available',
    expected_salary: '$60,000 - $80,000 USD',
    location: 'Ibadan, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: true,
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 390).toISOString(),
    real_name: 'Kemi Adebayo',
    real_email: 'kemi.adebayo@sync730.com',
    phone: '+234 814 555 1234',
    whatsapp: '+2348145551234',
    cv_url: 'https://sync730.blob.core.windows.net/resumes/kemi_adebayo_frontend.pdf',
    transcript: [
      {
        time: 12,
        timestamp_label: '0:12',
        text: 'I structured our design tokens in Tailwind and built responsive data tables handling 5,000 rows with virtual windowing.',
      },
      {
        time: 55,
        timestamp_label: '0:55',
        text: 'Using React Query for server caching eliminated redundant fetch calls and gave users instant offline feedback.',
      },
    ],
    key_moments: [
      {
        time: 12,
        timestamp_label: '0:12',
        title: 'Virtual Table Performance Tuning',
        summary: 'Discusses 60fps scrolling and memory management on low-spec mobile devices.',
      },
    ],
  },
  {
    id: 'va-cand-006',
    candidate_id: 'cand-006-emeka-offor',
    target_role: 'Staff Backend Architect (Go & Distributed Systems)',
    overall_match_score: 94,
    technical_depth_score: 98,
    communication_score: 90,
    ai_summary: 'Architected high-throughput financial transaction settlement engines.',
    secure_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    poster_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 150,
    proctoring_flags: [],
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    seniority: 'Staff',
    skills: ['Go', 'gRPC', 'Kafka', 'PostgreSQL', 'Distributed Systems'],
    years_of_experience: 11,
    availability: 'Not looking', // Marked 'Not looking' -> Hidden by default as required!
    expected_salary: '$140,000 - $170,000 USD',
    location: 'Enugu, Nigeria',
    timezone: 'WAT (UTC+1)',
    open_to_nigeria: true,
    open_to_africa: true,
    open_to_remote: true,
    consent_to_show_recruiters: false, // Consent false -> Hidden as required!
    assessment_completed_date: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    real_name: 'Emeka Offor',
    real_email: 'emeka.offor@sync730.com',
    phone: '+234 802 333 4444',
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
  contactLogs: [] as CandidateContactLog[],
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

export function getLocalAssessments(): (VideoAssessment & { real_name?: string; real_email?: string; phone?: string; whatsapp?: string; cv_url?: string })[] {
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

export function getLocalCandidateContactLogs(workspaceId?: string): CandidateContactLog[] {
  if (typeof window === 'undefined') {
    return workspaceId
      ? globalServerStore.contactLogs.filter((l) => l.workspace_id === workspaceId)
      : globalServerStore.contactLogs;
  }
  try {
    const raw = localStorage.getItem(CONTACT_LOGS_KEY);
    const logs: CandidateContactLog[] = raw ? JSON.parse(raw) : [];
    return workspaceId ? logs.filter((l) => l.workspace_id === workspaceId) : logs;
  } catch {
    return [];
  }
}

export function saveLocalCandidateContactLog(log: CandidateContactLog) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCandidateContactLogs();
      const updated = [log, ...existing];
      localStorage.setItem(CONTACT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_contact_logs_updated'));
    } catch (e) {
      console.warn('Failed to save contact log to localStorage:', e);
    }
  }
  globalServerStore.contactLogs.unshift(log);
}

/**
 * Mask a candidate assessment according to strict B2B privacy rules
 */
export function formatMaskedCandidate(
  cand: VideoAssessment & {
    real_name?: string;
    real_email?: string;
    phone?: string;
    whatsapp?: string;
    cv_url?: string;
  },
  isUnlocked: boolean
): VideoAssessment {
  if (isUnlocked) {
    return {
      ...cand,
      candidate_name: cand.real_name || cand.candidate_name || 'Verified Professional',
      candidate_email: cand.real_email || cand.candidate_email || 'candidate@sync730.com',
      phone: cand.phone || '+234 812 000 0000',
      whatsapp: cand.whatsapp || cand.phone || '+2348120000000',
      cv_url: cand.cv_url || 'https://sync730.blob.core.windows.net/resumes/verified_cv.pdf',
      is_unlocked: true,
    };
  }

  // Generate deterministic masked ID
  const shortId = (cand.candidate_id || cand.id || 'CAND').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return {
    ...cand,
    candidate_name: `Sync730 Verified Candidate #${shortId}`,
    candidate_email: 'masked@sync730.com',
    phone: undefined,
    whatsapp: undefined,
    cv_url: undefined,
    is_unlocked: false,
  };
}
