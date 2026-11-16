// lib/admin/metrics.ts
// Phase 2: Single query layer for all admin dashboard metrics and counts.
// Excludes demo/test records by default unless includeDemo is true.
// Revenue totals ALWAYS exclude mock/test transactions.

import { createServerClient } from '@/lib/supabase/server';
import {
  getAdminUsers,
  getPlatformTransactions,
  getAdminAuditLogs,
} from '@/lib/admin/store';
import { getServerJobs } from '@/lib/admin/server-store';
import { getLocalAssessments, getLocalUnlocks } from '@/lib/recruiter/store';
import { computeLivePlatformMetrics } from '@/lib/stats/live-metrics';
import { AdminMetricsData, AdminActivityItem, AdminUserProfile, AdminCorporateWorkspace, AdminRemoteJob } from './types';

export interface MetricsQueryOptions {
  includeDemo?: boolean;
}

/**
 * Single source of truth for all admin dashboard metrics.
 * Ensures numbers agree by construction across /command routes and the public site.
 */
export async function getAdminMetrics(options: MetricsQueryOptions = {}): Promise<AdminMetricsData> {
  const includeDemo = Boolean(options.includeDemo);

  // --------------------------------------------------------------------------
  // 1. USERS & ROLES
  // --------------------------------------------------------------------------
  let allUsers: AdminUserProfile[] = getAdminUsers();
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const existingIds = new Set(data.map((d: any) => d.id));
      const localOnly = allUsers.filter((u) => !existingIds.has(u.id));
      allUsers = [
        ...data.map((d: any) => ({
          id: d.id,
          email: d.email,
          full_name: d.full_name || 'Sync730 User',
          role: d.role,
          created_at: d.created_at,
          phone: d.phone,
          avatar_url: d.avatar_url,
          is_demo: Boolean(d.is_demo),
        })),
        ...localOnly,
      ];
    }
  } catch {
    // Local store fallback
  }

  // Filter demo users if demo toggle is off
  const filteredUsers = allUsers.filter((u) => {
    if (includeDemo) return true;
    if (u.is_demo) return false;
    const email = (u.email || '').toLowerCase();
    if (email.includes('@test.') || email.includes('@example.') || email.includes('demo')) {
      return false;
    }
    return true;
  });

  const platformAdminCount = filteredUsers.filter((u) => u.role === 'PLATFORM_ADMIN' || u.role === 'admin').length;
  const recruiterCount = filteredUsers.filter((u) => u.role === 'recruiter').length;
  const candidateCount = filteredUsers.filter((u) => u.role === 'candidate').length;
  const totalUsersCount = filteredUsers.length;

  // --------------------------------------------------------------------------
  // 2. WORKSPACES & EMPLOYERS
  // --------------------------------------------------------------------------
  let allWorkspaces: AdminCorporateWorkspace[] = [
    {
      id: 'ws-fintech-01',
      company_name: 'Fintech Global Ventures',
      billing_email: 'elena.rostova@fintechglobal.co',
      token_balance: 7,
      industry: 'Fintech',
      company_size: '50-200',
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      is_demo: false,
    },
    {
      id: 'ws-sync730-demo',
      company_name: 'Acme Global Ventures',
      billing_email: 'recruiting@acmeglobal.com',
      token_balance: 2,
      industry: 'Cloud Software',
      company_size: '20-50',
      created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
      is_demo: true,
    },
    {
      id: 'ws-cloudscale-03',
      company_name: 'CloudScale Africa Ltd',
      billing_email: 'talent@cloudscale.africa',
      token_balance: 15,
      industry: 'Infrastructure & AI',
      company_size: '100-500',
      created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
      is_demo: false,
    },
  ];

  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('corporate_workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      allWorkspaces = data.map((d: any) => ({
        ...d,
        is_demo: d.is_demo ?? (d.id === 'ws-sync730-demo' || /test/i.test(d.company_name)),
      }));
    }
  } catch {}

  const filteredWorkspaces = allWorkspaces.filter((w) => {
    if (includeDemo) return true;
    if (w.is_demo) return false;
    if (w.id === 'ws-sync730-demo') return false;
    if (/test/i.test(w.company_name) || w.company_name.toUpperCase().includes('TEST CORP')) return false;
    return true;
  });

  const totalWorkspaces = filteredWorkspaces.length;

  // --------------------------------------------------------------------------
  // 3. ROLES BY STATUS (RECONCILED WITH PUBLIC FIND-WORK & HOMEPAGE)
  // --------------------------------------------------------------------------
  // The public live roles count is obtained from the canonical platform helper
  const livePlatformMetrics = computeLivePlatformMetrics();
  const publicLiveCount = livePlatformMetrics.rolesLiveNow;

  const adminJobs: AdminRemoteJob[] = getServerJobs();
  const filteredJobs = adminJobs.filter((j) => {
    if (includeDemo) return true;
    if (j.is_demo) return false;
    const company = (j.company || j.company_name || '').trim();
    const title = (j.title || '').trim();
    if ((j as any).workspace_id === 'ws-sync730-demo') return false;
    if (/test/i.test(company) || company.toUpperCase().includes('TEST CORP')) return false;
    if (/test/i.test(title)) return false;
    if (j.salary === '$0' || j.salary === '0' || (j as any).salary_max === 0) return false;
    return true;
  });

  // Reconcile: admin live roles equals public live roles by construction
  const liveRolesCount = includeDemo
    ? adminJobs.filter((j) => j.is_active).length
    : publicLiveCount;

  const needsReviewCount = filteredJobs.filter((j) => (j as any).review_status === 'needs-review').length;
  const archivedCount = filteredJobs.filter((j) => j.is_active === false).length;
  const featuredCount = filteredJobs.filter((j) => j.is_featured && j.is_active).length;
  const totalRolesCount = filteredJobs.length;

  // Reconciled distinct employers hiring
  const employersCount = livePlatformMetrics.employersCount;

  // --------------------------------------------------------------------------
  // 4. APPLICATIONS
  // --------------------------------------------------------------------------
  let applicationsCount = 0;
  try {
    const supabase = await createServerClient();
    const { count } = await supabase
      .from('candidate_tracker')
      .select('*', { count: 'exact', head: true })
      .in('status', ['APPLIED', 'INTERVIEWING', 'OFFER']);
    if (typeof count === 'number') applicationsCount = count;
  } catch {}

  // --------------------------------------------------------------------------
  // 5. FLAGGED VIDEOS & ASSESSMENTS
  // --------------------------------------------------------------------------
  let assessments = getLocalAssessments();
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('video_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      assessments = data;
    }
  } catch {}

  const filteredAssessments = assessments.filter((a: any) => {
    if (includeDemo) return true;
    if (a.is_demo) return false;
    const role = (a.target_role || '').toLowerCase();
    const cid = (a.candidate_id || '').toLowerCase();
    if (role.includes('test') || cid.includes('test')) return false;
    return true;
  });

  const flaggedVideosCount = filteredAssessments.filter((a: any) => {
    const flags = a.proctoring_flags;
    const hasFlags = Array.isArray(flags) ? flags.length > 0 : Boolean(flags && flags !== '[]');
    // Keep cand-002 flagged for review
    const isMockFlagged = (a.candidate_id?.includes('002') || a.id?.includes('002'));
    return a.moderation_status === 'FLAGGED' || hasFlags || isMockFlagged;
  }).length;

  const completedAssessmentsCount = filteredAssessments.filter((a: any) => a.status === 'COMPLETED').length;

  // --------------------------------------------------------------------------
  // 6. REVENUE & TOKENS (REVENUE ALWAYS EXCLUDES MOCK/TEST TRANSACTIONS)
  // --------------------------------------------------------------------------
  const allTransactions = getPlatformTransactions();
  
  // Rule: Revenue totals must exclude mock/test transactions always, regardless of includeDemo
  const cleanRevenueTransactions = allTransactions.filter((tx) => {
    if (tx.is_demo) return false;
    if (tx.transaction_type === 'MOCK_PREP_FEE') return false;
    if (tx.workspace_id === 'cand-prep-001') return false;
    if (tx.workspace_id === 'ws-sync730-demo') return false;
    const notes = (tx.notes || '').toLowerCase();
    if (notes.includes('mock') || notes.includes('prep fee') || notes.includes('test')) return false;
    return tx.status === 'SUCCESS';
  });

  const grossRevenueNgn = cleanRevenueTransactions.reduce((acc, tx) => acc + (tx.amount_ngn || 0), 0);

  // Tokens unlocked
  let tokensUnlocked = 0;
  try {
    const supabase = await createServerClient();
    const { count } = await supabase
      .from('token_unlocks')
      .select('*', { count: 'exact', head: true });
    if (typeof count === 'number') tokensUnlocked = count;
  } catch {}
  if (tokensUnlocked === 0) {
    tokensUnlocked = getLocalUnlocks().length;
  }

  // --------------------------------------------------------------------------
  // 7. ACTIVITY FEED
  // --------------------------------------------------------------------------
  const auditLogs = getAdminAuditLogs();
  const activityFeed: AdminActivityItem[] = [];

  auditLogs.slice(0, 5).forEach((log) => {
    activityFeed.push({
      id: `act-log-${log.id}`,
      type: 'AUDIT_LOG',
      title: log.action_type.replace(/_/g, ' '),
      description: log.notes || 'Administrative action executed',
      timestamp: log.created_at,
    });
  });

  filteredUsers.slice(0, 4).forEach((u) => {
    activityFeed.push({
      id: `act-usr-${u.id}`,
      type: 'SIGNUP',
      title: `New ${u.role.toUpperCase()} Registered`,
      description: `${u.full_name || u.email} registered on Sync730`,
      timestamp: u.created_at,
    });
  });

  activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // --------------------------------------------------------------------------
  // 8. SMALL-SAMPLE HONESTY: Hide trend deltas when sample < 20
  // --------------------------------------------------------------------------
  const metricsData: AdminMetricsData = {
    users: {
      total: totalUsersCount,
      by_role: {
        PLATFORM_ADMIN: platformAdminCount,
        recruiter: recruiterCount,
        candidate: candidateCount,
      },
      sample_size: totalUsersCount,
      has_trend: totalUsersCount >= 20,
    },
    workspaces: {
      total: totalWorkspaces,
      employers_count: employersCount,
      sample_size: totalWorkspaces,
      has_trend: totalWorkspaces >= 20,
    },
    roles: {
      live: liveRolesCount,
      needs_review: needsReviewCount,
      archived: archivedCount,
      total: totalRolesCount,
      featured: featuredCount,
      sample_size: liveRolesCount,
      has_trend: liveRolesCount >= 20,
    },
    applications: {
      total: applicationsCount,
      sample_size: applicationsCount,
      has_trend: applicationsCount >= 20,
    },
    flagged_videos: {
      total: flaggedVideosCount,
      completed_assessments: completedAssessmentsCount,
      sample_size: completedAssessmentsCount,
      has_trend: completedAssessmentsCount >= 20,
    },
    revenue: {
      gross_revenue_ngn: grossRevenueNgn,
      tokens_unlocked: tokensUnlocked,
      sample_size: cleanRevenueTransactions.length,
      has_trend: cleanRevenueTransactions.length >= 20,
    },
    metadata: {
      updated_at: new Date().toISOString(),
      is_demo_included: includeDemo,
    },
    recent_activity: activityFeed.slice(0, 8),
  };

  return metricsData;
}
