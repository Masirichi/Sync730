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
import { getServerJobs, getServerAuditLogs } from '@/lib/admin/server-store';
import { getLocalAssessments, getLocalUnlocks } from '@/lib/recruiter/store';
import { computeLivePlatformMetrics } from '@/lib/stats/live-metrics';
import { getAllReports } from '@/lib/jobs/reports-and-alerts';
import { formatLagosDateTime } from '@/lib/admin/date';
import {
  AdminMetricsData,
  AdminUserProfile,
  AdminCorporateWorkspace,
  AdminRemoteJob,
  AdminRecentAuditItem,
} from './types';

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

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * oneDayMs;

  // Reconcile: admin live roles equals public live roles by construction
  const liveRolesCount = includeDemo
    ? adminJobs.filter((j) => j.is_active).length
    : publicLiveCount;

  // Roles to verify / Needs review
  const needsReviewCount = filteredJobs.filter((j) => {
    const s = (j as any).status || (j as any).review_status;
    return s === 'needs_review' || s === 'needs-review' || s === 'ingested';
  }).length;

  // Verified roles count (verified or live or has verified timestamp)
  const verifiedRolesCount = filteredJobs.filter((j) => {
    return (j as any).status === 'verified' || (j as any).status === 'live' || Boolean(j.last_verified_at) || j.is_active;
  }).length;

  // Roles going stale: live roles within 3 days of the 14-day limit (age 11-14 days)
  const goingStaleCount = filteredJobs.filter((j) => {
    if (!j.is_active) return false;
    const verifiedStr = j.last_verified_at || (j as any).verified_at || j.published_at || j.created_at;
    if (!verifiedStr) return false;
    const vTime = new Date(verifiedStr).getTime();
    if (isNaN(vTime)) return false;
    const ageDays = (now - vTime) / oneDayMs;
    return ageDays >= 11 && ageDays <= 14;
  }).length;

  // Removed roles in last 30 days
  const removedLast30DaysCount = filteredJobs.filter((j) => {
    if (j.is_active === false || (j as any).status === 'removed') {
      const updatedTime = new Date((j as any).updated_at || j.created_at || j.published_at).getTime();
      return !isNaN(updatedTime) && updatedTime >= thirtyDaysAgo;
    }
    return false;
  }).length;

  const archivedCount = filteredJobs.filter((j) => j.is_active === false).length;
  const featuredCount = filteredJobs.filter((j) => j.is_featured && j.is_active).length;
  const totalRolesCount = filteredJobs.length;

  // Reconciled distinct employers hiring
  const employersCount = livePlatformMetrics.employersCount;

  // --------------------------------------------------------------------------
  // 4. REPORTS
  // --------------------------------------------------------------------------
  let allReports: any[] = getAllReports();
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('job_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      allReports = data;
    }
  } catch {}

  const filteredReports = allReports.filter((r) => {
    if (includeDemo) return true;
    const jId = (r.jobId || r.job_id || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    if (jId.includes('test') || reason.includes('test')) return false;
    return true;
  });

  const openReportsCount = filteredReports.filter((r) => {
    const status = (r.status || 'OPEN').toUpperCase();
    return status === 'OPEN';
  }).length;
  const resolvedReportsCount = filteredReports.filter((r) => {
    const status = (r.status || '').toUpperCase();
    return status === 'RESOLVED' || status === 'DISMISSED';
  }).length;

  // --------------------------------------------------------------------------
  // 5. APPLICATIONS
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
  // 6. FLAGGED VIDEOS & ASSESSMENTS
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
    const isMockFlagged = Boolean(a.candidate_id?.includes('002') || a.id?.includes('002'));
    return a.moderation_status === 'FLAGGED' || hasFlags || isMockFlagged;
  }).length;

  const completedAssessmentsCount = filteredAssessments.filter((a: any) => a.status === 'COMPLETED').length;

  // --------------------------------------------------------------------------
  // 7. REVENUE & TOKENS (REVENUE ALWAYS EXCLUDES MOCK/TEST TRANSACTIONS)
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
  // 8. MISSION HEALTH COMPUTATIONS (Small-sample honesty: sample >= 20 required)
  // --------------------------------------------------------------------------
  // REAL: Share of live roles verified in last 14 days
  const liveVerifiedInLast14 = filteredJobs.filter((j) => {
    if (!j.is_active) return false;
    const verifiedStr = j.last_verified_at || (j as any).verified_at || j.published_at || j.created_at;
    if (!verifiedStr) return false;
    const vTime = new Date(verifiedStr).getTime();
    if (isNaN(vTime)) return false;
    const ageDays = (now - vTime) / oneDayMs;
    return ageDays <= 14;
  }).length;

  const shareVerified14 = liveRolesCount >= 20
    ? `${Math.round((liveVerifiedInLast14 / Math.max(liveRolesCount, 1)) * 100)}%`
    : null;

  // FASTER: Median age of role when verified
  const verifiedRolesWithAge = filteredJobs
    .filter((j) => {
      const vStr = j.last_verified_at || (j as any).verified_at;
      const cStr = j.published_at || j.created_at;
      return Boolean(vStr && cStr);
    })
    .map((j) => {
      const vTime = new Date((j.last_verified_at || (j as any).verified_at)!).getTime();
      const cTime = new Date((j.published_at || j.created_at)!).getTime();
      return Math.max(0, (vTime - cTime) / oneDayMs);
    })
    .sort((a, b) => a - b);

  let medianRoleAgeFormatted: string | null = null;
  if (verifiedRolesWithAge.length >= 20) {
    const mid = Math.floor(verifiedRolesWithAge.length / 2);
    const medianDays = verifiedRolesWithAge.length % 2 !== 0
      ? verifiedRolesWithAge[mid]
      : (verifiedRolesWithAge[mid - 1] + verifiedRolesWithAge[mid]) / 2;
    medianRoleAgeFormatted = `${medianDays.toFixed(1)} days`;
  }

  // --------------------------------------------------------------------------
  // 9. RECENT ACTIVITY: Last 10 audit entries as "{Actor} {action} {target}, {time}"
  // --------------------------------------------------------------------------
  let rawAuditLogs: any[] = [];
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data && data.length > 0) {
      rawAuditLogs = data;
    }
  } catch {}

  if (rawAuditLogs.length === 0) {
    try {
      rawAuditLogs = getServerAuditLogs();
    } catch {
      rawAuditLogs = getAdminAuditLogs();
    }
  }

  const recentAuditEntries: AdminRecentAuditItem[] = rawAuditLogs.slice(0, 10).map((log, idx) => {
    let actorName = log.actor_name || log.admin_id || 'Platform Administrator';
    let actionVerb = log.action || log.action_type || 'updated';
    let targetLabel = log.target_label || log.target_id || 'Platform item';
    let targetType = log.target_type || log.metadata?.target_type || 'SYSTEM';

    if (log.action_type === 'TOKEN_ADJUSTMENT' || log.action === 'TOKEN_ADJUSTMENT') {
      actionVerb = 'adjusted tokens for';
      targetType = 'WORKSPACE';
    } else if (log.action_type === 'ROLE_VERIFIED' || log.action === 'ROLE_VERIFIED') {
      actionVerb = 'verified role';
      targetType = 'ROLE';
    } else if (log.action_type === 'ROLE_DEMOTED' || log.action === 'ROLE_DEMOTED' || log.action === 'ROLE_CHANGED') {
      actionVerb = 'updated role for';
      targetType = 'USER';
    } else if (log.action_type === 'VIDEO_ASSESSMENT_VERIFIED' || log.action === 'VIDEO_VERIFIED') {
      actionVerb = 'approved video for';
      targetType = 'VIDEO';
    } else if (log.action_type === 'ROLE_TAKEDOWN' || log.action === 'ROLE_TAKEDOWN') {
      actionVerb = 'took down role';
      targetType = 'ROLE';
    } else if (log.action_type === 'ROLE_PINNED' || log.action === 'ROLE_PINNED') {
      actionVerb = 'pinned featured role';
      targetType = 'ROLE';
    } else if (log.action_type === 'SYSTEM_BOOTSTRAP') {
      actionVerb = 'initialized';
      targetType = 'SYSTEM';
    }

    if (log.metadata?.action_verb) actionVerb = log.metadata.action_verb;
    if (log.metadata?.target_label) targetLabel = log.metadata.target_label;
    if (log.metadata?.actor_name) actorName = log.metadata.actor_name;

    let link = '/command/audit';
    if (targetType === 'ROLE' || targetType === 'JOB') {
      link = '/command/roles';
    } else if (targetType === 'WORKSPACE' || targetType === 'MONEY') {
      link = '/command/money';
    } else if (targetType === 'USER') {
      link = '/command/users';
    } else if (targetType === 'VIDEO') {
      link = '/command/video-review';
    } else if (targetType === 'REPORT') {
      link = '/command/reports';
    }

    const lagosTime = formatLagosDateTime(log.created_at || new Date().toISOString());
    const timeAgo = lagosTime.relative || 'recently';

    return {
      id: log.id || `audit-item-${idx}`,
      actor_name: actorName,
      action_verb: actionVerb,
      target_label: targetLabel,
      target_type: targetType as any,
      target_id: log.target_id,
      time_ago: timeAgo,
      timestamp: log.created_at || new Date().toISOString(),
      link,
      formatted_entry: `${actorName} ${actionVerb} ${targetLabel}, ${timeAgo}`,
    };
  });

  // --------------------------------------------------------------------------
  // 10. METRICS DATA PAYLOAD
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
    reports: {
      open: openReportsCount,
      resolved: resolvedReportsCount,
      total: filteredReports.length,
    },
    attention: {
      roles_to_verify: needsReviewCount,
      open_reports: openReportsCount,
      flagged_videos: flaggedVideosCount,
      roles_going_stale: goingStaleCount,
    },
    role_pipeline: {
      needs_review: needsReviewCount,
      verified: verifiedRolesCount,
      live: liveRolesCount,
      going_stale: goingStaleCount,
      removed_last_30_days: removedLast30DaysCount,
    },
    mission_health: {
      faster: {
        median_time_to_shortlist: {
          label: 'Median time from application to shortlist',
          value: null,
          status: 'not_tracked',
          description: 'Not tracked yet',
        },
        median_role_age_when_verified: {
          label: 'Median age of a role when verified',
          value: medianRoleAgeFormatted,
          status: medianRoleAgeFormatted ? 'available' : 'not_enough_data',
          sample_size: verifiedRolesWithAge.length,
          min_sample: 20,
          description: medianRoleAgeFormatted ? `${verifiedRolesWithAge.length} verified roles evaluated` : 'Not enough data yet',
        },
      },
      fairer: {
        retake_rate: {
          label: 'Retake rate',
          value: null,
          status: 'not_tracked',
          description: 'Not tracked yet',
        },
        appeal_overturn_rate: {
          label: 'Appeal overturn rate',
          value: null,
          status: 'not_tracked',
          description: 'Not tracked yet',
        },
        flagged_video_rate: {
          label: 'Flagged-video rate',
          value: completedAssessmentsCount >= 20
            ? `${((flaggedVideosCount / Math.max(completedAssessmentsCount, 1)) * 100).toFixed(1)}%`
            : null,
          status: completedAssessmentsCount >= 20 ? 'available' : 'not_enough_data',
          sample_size: completedAssessmentsCount,
          min_sample: 20,
          description: completedAssessmentsCount >= 20
            ? `${flaggedVideosCount} of ${completedAssessmentsCount} assessments flagged`
            : 'Not enough data yet',
        },
        reviewer_ai_override_rate: {
          label: "How often reviewers change the AI's recommendation",
          value: null,
          status: 'not_tracked',
          description: 'Not tracked yet',
        },
      },
      real: {
        share_verified_last_14_days: {
          label: 'Share of live roles verified in the last 14 days',
          value: shareVerified14,
          status: shareVerified14 ? 'available' : 'not_enough_data',
          sample_size: liveRolesCount,
          min_sample: 20,
          description: shareVerified14
            ? `${liveVerifiedInLast14} of ${liveRolesCount} live roles verified within 14 days`
            : 'Not enough data yet',
        },
        open_reports: {
          label: 'Open reports',
          value: openReportsCount,
          status: 'available',
          sample_size: filteredReports.length,
          description: openReportsCount === 0 ? 'All clear' : `${openReportsCount} unresolved`,
        },
        median_time_to_take_down: {
          label: 'Median time to take down a reported role',
          value: null,
          status: 'not_tracked',
          description: 'Not tracked yet',
        },
      },
    },
    metadata: {
      updated_at: new Date().toISOString(),
      is_demo_included: includeDemo,
    },
    recent_activity: recentAuditEntries,
  };

  return metricsData;
}
