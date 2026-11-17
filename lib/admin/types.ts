export type PlatformRole = 'candidate' | 'recruiter' | 'PLATFORM_ADMIN' | 'admin';

export interface AdminMetrics {
  total_candidates: number;
  active_workspaces: number;
  completed_assessments: number;
  tokens_unlocked: number;
  gross_revenue_ngn: number;
  recent_activity: AdminActivityItem[];
}

export interface AdminMetricsData {
  users: {
    total: number;
    by_role: {
      PLATFORM_ADMIN: number;
      recruiter: number;
      candidate: number;
    };
    sample_size: number;
    has_trend: boolean;
  };
  workspaces: {
    total: number;
    employers_count: number;
    sample_size: number;
    has_trend: boolean;
  };
  roles: {
    live: number;
    needs_review: number;
    archived: number;
    total: number;
    featured: number;
    sample_size: number;
    has_trend: boolean;
  };
  applications: {
    total: number;
    sample_size: number;
    has_trend: boolean;
  };
  flagged_videos: {
    total: number;
    completed_assessments: number;
    sample_size: number;
    has_trend: boolean;
  };
  revenue: {
    gross_revenue_ngn: number;
    tokens_unlocked: number;
    sample_size: number;
    has_trend: boolean;
  };
  reports?: {
    open: number;
    resolved: number;
    total: number;
  };
  attention: AttentionMetrics;
  role_pipeline: RolePipelineMetrics;
  mission_health: MissionHealthMetrics;
  recent_activity?: AdminRecentAuditItem[];
  metadata: {
    updated_at: string;
    is_demo_included: boolean;
  };
}

export interface AttentionMetrics {
  roles_to_verify: number;
  open_reports: number;
  flagged_videos: number;
  roles_going_stale: number;
}

export interface RolePipelineMetrics {
  needs_review: number;
  verified: number;
  live: number;
  going_stale: number;
  removed_last_30_days: number;
}

export interface MissionHealthItem {
  label: string;
  value: string | number | null;
  status: 'available' | 'not_enough_data' | 'not_tracked';
  sample_size?: number;
  min_sample?: number;
  description?: string;
}

export interface MissionHealthMetrics {
  faster: {
    median_time_to_shortlist: MissionHealthItem;
    median_role_age_when_verified: MissionHealthItem;
  };
  fairer: {
    retake_rate: MissionHealthItem;
    appeal_overturn_rate: MissionHealthItem;
    flagged_video_rate: MissionHealthItem;
    reviewer_ai_override_rate: MissionHealthItem;
  };
  real: {
    share_verified_last_14_days: MissionHealthItem;
    open_reports: MissionHealthItem;
    median_time_to_take_down: MissionHealthItem;
  };
}

export interface AdminRecentAuditItem {
  id: string;
  actor_name: string;
  action_verb: string;
  target_label: string;
  target_type: 'ROLE' | 'WORKSPACE' | 'USER' | 'VIDEO' | 'REPORT' | 'SETTING' | 'SYSTEM';
  target_id?: string;
  time_ago: string;
  timestamp: string;
  link: string;
  formatted_entry: string;
}

export interface AdminActivityItem {
  id: string;
  type: 'SIGNUP' | 'AUDIT_LOG' | 'TOKEN_ADJUSTMENT' | 'VETTING' | 'CRAWLER';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PlatformTransaction {
  id: string;
  created_at: string;
  workspace_id: string;
  company_name?: string;
  amount_ngn: number;
  transaction_type: 'TOKEN_PURCHASE' | 'ADMIN_ADJUSTMENT' | 'MOCK_PREP_FEE';
  payment_reference: string;
  status: string;
  notes?: string;
  is_demo?: boolean;
}

export interface AdminAuditLog {
  id: string;
  created_at: string;
  admin_id: string;
  action_type: string;
  target_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AdminUserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: PlatformRole;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  is_demo?: boolean;
}

export interface AdminCorporateWorkspace {
  id: string;
  company_name: string;
  billing_email: string;
  token_balance: number;
  industry?: string | null;
  company_size?: string | null;
  created_at: string;
  is_demo?: boolean;
}

export interface AdminRemoteJob {
  id: string;
  external_id?: string;
  title: string;
  company: string;
  employer_type?: 'direct' | 'agency';
  company_name?: string;
  source_name?: string;
  apply_url?: string;
  posted_at?: string;
  last_verified_at?: string | null;
  expires_at?: string | null;
  open_to_nigeria?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: 'hour' | 'month' | 'year' | null;
  skills?: string[];
  company_logo?: string | null;
  candidate_required_location?: string;
  location_tier: 'Worldwide' | 'EMEA' | 'Africa Only';
  salary?: string | null;
  url?: string | null;
  career_url?: string | null;
  description?: string | null;
  category?: string | null;
  job_type?: string;
  tags?: string[] | null;
  source?: string;
  source_type: 'ADMIN_CURATED' | 'CRAWLER';
  is_active: boolean;
  is_featured: boolean;
  work_mode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | string;
  city_location?: string | null;
  published_at: string;
  created_at: string;
  is_demo?: boolean;
}
