import {
  AdminMetrics,
  AdminActivityItem,
  PlatformTransaction,
  AdminAuditLog,
  AdminUserProfile,
  AdminCorporateWorkspace,
} from './types';
import { getLocalWorkspace, getLocalAssessments, saveLocalAssessment, getLocalUnlocks } from '@/lib/recruiter/store';

// Storage keys
const AUDIT_LOGS_KEY = 'sync730_admin_audit_logs';
const TRANSACTIONS_KEY = 'sync730_platform_transactions';
const USERS_KEY = 'sync730_admin_users';

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

// In-Memory store for Server-side fallback
let globalAdminServerStore = {
  users: [...SEED_ADMIN_USERS],
  transactions: [...SEED_PLATFORM_TRANSACTIONS],
  auditLogs: [...SEED_ADMIN_AUDIT_LOGS],
};

/* ==============================================================================
 * Store Accessors
 * ============================================================================== */

export function getAdminAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return globalAdminServerStore.auditLogs;
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
  globalAdminServerStore.auditLogs.unshift(log);
}

export function getPlatformTransactions(): PlatformTransaction[] {
  if (typeof window === 'undefined') return globalAdminServerStore.transactions;
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
  globalAdminServerStore.transactions.unshift(tx);
}

export function getAdminUsers(): AdminUserProfile[] {
  if (typeof window === 'undefined') return globalAdminServerStore.users;
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
  globalAdminServerStore.users = users;
}
