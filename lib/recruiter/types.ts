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
  proctoring_flags: string[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
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
