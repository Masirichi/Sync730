import {
  AdminMetrics,
  AdminActivityItem,
  PlatformTransaction,
  AdminAuditLog,
  AdminUserProfile,
  AdminCorporateWorkspace,
  AdminRemoteJob,
} from './types';
import { getLocalWorkspace, getLocalAssessments, saveLocalAssessment, getLocalUnlocks } from '@/lib/recruiter/store';

// Storage keys
const AUDIT_LOGS_KEY = 'sync730_admin_audit_logs';
const TRANSACTIONS_KEY = 'sync730_platform_transactions';
const USERS_KEY = 'sync730_admin_users';
const ADMIN_JOBS_KEY = 'sync730_admin_remote_jobs';

// Seed Admin Users
export const SEED_ADMIN_USERS: AdminUserProfile[] = [
  {
    id: 'usr-admin-001',
    email: 'admin@sync730.com',
    full_name: 'David O. Alabi',
    role: 'PLATFORM_ADMIN',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    avatar_url: '',
    phone: '+234 801 000 0001',
  },
  {
    id: 'usr-recruiter-001',
    email: 'elena.rostova@fintechglobal.co',
    full_name: 'Elena Rostova',
    role: 'recruiter',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    avatar_url: '',
    phone: '+234 812 345 6789',
  },
  {
    id: 'usr-recruiter-002',
    email: 'hiring@acmeglobal.com',
    full_name: 'Alex Morgan',
    role: 'recruiter',
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    avatar_url: '',
    phone: '+234 809 111 2233',
  },
  {
    id: 'usr-cand-001',
    email: 'jane.doe@sync730.com',
    full_name: 'Jane Doe',
    role: 'candidate',
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    avatar_url: '',
    phone: '+234 812 345 6789',
  },
  {
    id: 'usr-cand-002',
    email: 'chinedu.eze@sync730.com',
    full_name: 'Chinedu Eze',
    role: 'candidate',
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    avatar_url: '',
    phone: '+234 803 987 6543',
  },
  {
    id: 'usr-cand-003',
    email: 'amara.okonkwo@sync730.com',
    full_name: 'Amara Okonkwo',
    role: 'candidate',
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    avatar_url: '',
    phone: '+234 901 234 5678',
  },
];

// Seed Platform Transactions
export const SEED_PLATFORM_TRANSACTIONS: PlatformTransaction[] = [
  {
    id: 'tx-001',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    workspace_id: 'ws-sync730-demo',
    company_name: 'Acme Global Ventures',
    amount_ngn: 100000,
    transaction_type: 'TOKEN_PURCHASE',
    payment_reference: 'pstk_ref_9823194',
    status: 'SUCCESS',
    notes: 'Purchased 5 candidate unlock tokens via Paystack',
  },
  {
    id: 'tx-002',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    workspace_id: 'ws-fintech-01',
    company_name: 'Fintech Global Ventures',
    amount_ngn: 200000,
    transaction_type: 'TOKEN_PURCHASE',
    payment_reference: 'pstk_ref_7741289',
    status: 'SUCCESS',
    notes: 'Purchased 10 candidate unlock tokens via Paystack',
  },
  {
    id: 'tx-003',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    workspace_id: 'cand-prep-001',
    company_name: 'Jane Doe (B2C Candidate)',
    amount_ngn: 2500,
    transaction_type: 'MOCK_PREP_FEE',
    payment_reference: 'pstk_mock_prep_5512',
    status: 'SUCCESS',
    notes: 'Paid AI Mock Video Prep Sandbox unlock fee',
  },
];

// Seed Admin Audit Logs
export const SEED_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-001',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'SYSTEM_BOOTSTRAP',
    target_id: 'system',
    notes: 'Sync730 Platform Admin Command Center initialized with RBAC controls',
  },
  {
    id: 'log-002',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'TOKEN_ADJUSTMENT',
    target_id: 'ws-fintech-01',
    notes: 'Granted 2 trial tokens on company workspace initialization',
  },
  {
    id: 'log-003',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'VIDEO_ASSESSMENT_VERIFIED',
    target_id: 'va-cand-001',
    notes: 'Verified candidate video integrity for Jane Doe. 0 proctoring infractions.',
  },
];

// Seed Admin-Curated & Remote Jobs
export const SEED_ADMIN_REMOTE_JOBS: AdminRemoteJob[] = [
  {
    id: 'job-admin-feat-001',
    external_id: 'ext-admin-feat-001',
    title: 'Lead Systems Architect & Tech Director',
    company: 'Sync730 Partner Labs',
    career_url: 'https://careers.sync730.com/roles/lead-systems-architect',
    url: 'https://careers.sync730.com/roles/lead-systems-architect',
    location_tier: 'Worldwide',
    candidate_required_location: 'Worldwide Remote',
    salary: '$140,000 - $180,000 / yr',
    description: 'Spearhead our next-generation distributed talent intelligence network. Direct cloud architecture across global microservices and pan-African engineering nodes.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    tags: ['Go', 'Kubernetes', 'TypeScript', 'Distributed Systems'],
    source: 'company_direct',
    source_type: 'ADMIN_CURATED',
    is_active: true,
    is_featured: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-admin-cur-002',
    external_id: 'ext-admin-cur-002',
    title: 'Senior Full Stack Product Engineer',
    company: 'Fintech Velocity Africa',
    career_url: 'https://fintechvelocity.co/careers/senior-fullstack',
    url: 'https://fintechvelocity.co/careers/senior-fullstack',
    location_tier: 'Africa Only',
    candidate_required_location: 'Nigeria / Kenya / Remote',
    salary: '₦1,800,000 - ₦2,600,000 / mo',
    description: 'Build high-throughput payment rails and core banking APIs. Partner with risk engineering to deploy resilient transaction ledger models.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    tags: ['Next.js', 'PostgreSQL', 'Node.js', 'Paystack'],
    source: 'company_direct',
    source_type: 'ADMIN_CURATED',
    is_active: true,
    is_featured: false,
    published_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

let memoryJobs = [...SEED_ADMIN_REMOTE_JOBS];
let memoryUsers = [...SEED_ADMIN_USERS];
let memoryTransactions = [...SEED_PLATFORM_TRANSACTIONS];
let memoryAuditLogs = [...SEED_ADMIN_AUDIT_LOGS];

/* ==============================================================================
 * Store Accessors (Universal Browser-Safe)
 * ============================================================================== */

export function getAdminAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return memoryAuditLogs;
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(SEED_ADMIN_AUDIT_LOGS));
      return SEED_ADMIN_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_AUDIT_LOGS;
  }
}

export function saveAdminAuditLog(log: AdminAuditLog) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminAuditLogs();
      const updated = [log, ...existing];
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_audit_logs_updated'));
    } catch (e) {
      console.warn('Failed to save audit log:', e);
    }
  }
  memoryAuditLogs.unshift(log);
}

export function getPlatformTransactions(): PlatformTransaction[] {
  if (typeof window === 'undefined') return memoryTransactions;
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_PLATFORM_TRANSACTIONS));
      return SEED_PLATFORM_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PLATFORM_TRANSACTIONS;
  }
}

export function savePlatformTransaction(tx: PlatformTransaction) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getPlatformTransactions();
      const updated = [tx, ...existing];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_transactions_updated'));
    } catch (e) {
      console.warn('Failed to save transaction:', e);
    }
  }
  memoryTransactions.unshift(tx);
}

export function getAdminUsers(): AdminUserProfile[] {
  if (typeof window === 'undefined') return memoryUsers;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_ADMIN_USERS));
      return SEED_ADMIN_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_USERS;
  }
}

export function saveAdminUsers(users: AdminUserProfile[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event('sync730_users_updated'));
    } catch (e) {
      console.warn('Failed to save users:', e);
    }
  }
  memoryUsers = users;
}

export function getAdminRemoteJobs(): AdminRemoteJob[] {
  if (typeof window === 'undefined') return memoryJobs;
  try {
    const raw = localStorage.getItem(ADMIN_JOBS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(SEED_ADMIN_REMOTE_JOBS));
      return SEED_ADMIN_REMOTE_JOBS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_ADMIN_REMOTE_JOBS;
  }
}

export function saveAdminRemoteJob(job: AdminRemoteJob): AdminRemoteJob {
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const updated = [job, ...existing.filter((j) => j.id !== job.id)];
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to save admin job:', e);
    }
  }
  
  const idx = memoryJobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    memoryJobs[idx] = job;
  } else {
    memoryJobs.unshift(job);
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_POSTED',
    target_id: job.id,
    notes: `Published verified admin role: "${job.title}" at ${job.company} (${job.location_tier})`,
  });

  return job;
}

export function toggleAdminJobActive(jobId: string, currentStatus?: boolean): { is_active: boolean } {
  let newStatus = false;
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
      if (target) {
        target.is_active = currentStatus !== undefined ? !currentStatus : !target.is_active;
        newStatus = target.is_active;
      } else {
        newStatus = !currentStatus;
      }
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to toggle active status:', e);
    }
  }

  const sTarget = memoryJobs.find((j) => j.id === jobId || j.external_id === jobId);
  if (sTarget) {
    sTarget.is_active = currentStatus !== undefined ? !currentStatus : !sTarget.is_active;
    newStatus = sTarget.is_active;
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Changed status of job ${jobId} to ${newStatus ? 'ACTIVE (Republished)' : 'TAKEN_DOWN'}`,
  });

  return { is_active: newStatus };
}

export function toggleAdminJobFeatured(jobId: string, currentStatus?: boolean): { is_featured: boolean } {
  let newFeatured = false;
  if (typeof window !== 'undefined') {
    try {
      const existing = getAdminRemoteJobs();
      const target = existing.find((j) => j.id === jobId || j.external_id === jobId);
      if (target) {
        target.is_featured = currentStatus !== undefined ? !currentStatus : !target.is_featured;
        newFeatured = target.is_featured;
      } else {
        newFeatured = !currentStatus;
      }
      localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(existing));
      window.dispatchEvent(new Event('sync730_admin_jobs_updated'));
      window.dispatchEvent(new Event('sync730_remote_jobs_updated'));
    } catch (e) {
      console.warn('Failed to toggle featured status:', e);
    }
  }

  const sTarget = memoryJobs.find((j) => j.id === jobId || j.external_id === jobId);
  if (sTarget) {
    sTarget.is_featured = currentStatus !== undefined ? !currentStatus : !sTarget.is_featured;
    newFeatured = sTarget.is_featured;
  }

  saveAdminAuditLog({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    admin_id: 'usr-admin-001',
    action_type: 'JOB_STATUS_CHANGE',
    target_id: jobId,
    notes: `Toggled featured status of job ${jobId} to ${newFeatured ? 'FEATURED (Pinned)' : 'UNFEATURED'}`,
  });

  return { is_featured: newFeatured };
}
