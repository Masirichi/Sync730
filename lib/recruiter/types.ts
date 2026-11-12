export type RecruiterRole = 'OWNER' | 'ADMIN' | 'INTERVIEWER';

export interface CorporateWorkspace {
  id: string;
  company_name: string;
  billing_email: string;
  token_balance: number;
  industry?: string | null;
  company_size?: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: RecruiterRole;
  email?: string;
  full_name?: string;
  created_at?: string;
}

export interface EmployerJob {
  id: string;
  workspace_id: string;
  job_title: string;
  flowmingo_project_id: string;
  status: 'active' | 'draft' | 'closed';
  department?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  description?: string;
  created_at: string;
}

export interface VideoAssessment {
  id: string;
  candidate_id: string;
  target_role: string;
  overall_match_score: number;
  technical_depth_score: number;
  communication_score: number;
  ai_summary: string;
  secure_video_url: string;
  poster_url?: string;
  duration_seconds?: number;
  proctoring_flags: string[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROCESSING';
  created_at: string;
  expires_at?: number;
  // Fields populated on unlock
  candidate_name?: string;
  candidate_email?: string;
  is_unlocked?: boolean;
}

export interface TokenUnlockRecord {
  id: string;
  workspace_id: string;
  candidate_id: string;
  tokens_spent: number;
  unlocked_at: string;
}

export interface DashboardMetrics {
  vetted_candidates_count: number;
  funnel: {
    invited: number;
    started: number;
    completed: number;
    passed: number;
    completion_rate_percent: number;
  };
  avg_match_score: number;
  active_roles_count: number;
  unlocked_candidates_count: number;
  available_tokens: number;
  has_jobs: boolean;
}

export interface RecruiterTask {
  id: string;
  type: 'REVIEW_VIDEO' | 'PENDING_INVITE' | 'INACTIVE_JOB' | 'LOW_TOKENS';
  title: string;
  description: string;
  due_date: string;
  is_overdue: boolean;
  relative_due_label: string;
  link: string;
  badge_label: string;
  badge_variant: 'destructive' | 'warning' | 'default' | 'secondary';
}
