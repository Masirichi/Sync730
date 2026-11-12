export type RecruiterRole = 'OWNER' | 'ADMIN' | 'INTERVIEWER';

export type TokenPackId = 'starter' | 'growth' | 'enterprise';

export type OrderStatus =
  | 'PENDING'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | 'ABANDONED'
  | 'FLAGGED_REVIEW';

export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT';

export interface TokenPackConfig {
  id: TokenPackId;
  name: string;
  tokens: number;
  amount: number; // in NGN
  amount_kobo: number; // in Kobo (for Paystack)
  currency: 'NGN';
  per_token_amount: number;
  per_token_display: string;
  price_display: string;
  discount_label: string | null;
  description: string;
}

export interface BillingOrder {
  id: string; // order_id (e.g. ord_xxx)
  workspace_id: string;
  pack_id: TokenPackId;
  tokens: number;
  amount: number; // in NGN
  amount_kobo: number;
  currency: 'NGN';
  created_by: string;
  created_at: string;
  expires_at: string;
  payment_reference: string;
  payment_method: 'card' | 'bank_transfer';
  status: OrderStatus;
  paid_at?: string;
  failure_reason?: string;
  confirmed_by?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

export interface TokenLedgerEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email?: string;
  order_id?: string;
  candidate_id?: string;
  candidate_masked_id?: string;
  type: LedgerEntryType;
  amount: number; // +5 for credit, -1 for debit
  balance_after: number;
  description: string;
  created_at: string;
}

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

export type JobStatus = 'active' | 'draft' | 'paused' | 'closed';

export interface EmployerJob {
  id: string;
  workspace_id: string;
  job_title: string;
  flowmingo_project_id: string;
  status: JobStatus;
  department?: string;
  seniority?: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff' | 'Principal' | 'Executive';
  job_type?: string;
  employment_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  work_arrangement?: 'Remote' | 'Hybrid' | 'Onsite';
  location?: string;
  location_country?: string;
  location_state?: string;
  location_city?: string;
  eligible_regions?: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency?: 'NGN' | 'USD' | 'EUR' | 'GBP';
  salary_period?: 'year' | 'month' | 'hour';
  salary_range?: string;
  skills?: string[];
  description?: string;
  requirements?: string;
  application_deadline?: string;
  assessment_template?: 'Engineering' | 'Product/Design' | 'Sales' | 'Customer Support' | 'Finance/Operations' | 'Custom';
  custom_questions?: Array<{ id: string; question: string; time_limit_seconds: number }>;
  invited_count?: number;
  assessed_count?: number;
  shortlisted_count?: number;
  created_at: string;
  updated_at?: string;
}

export type PipelineStage = 'Shortlisted' | 'Contacted' | 'Interviewing' | 'Offer' | 'Hired' | 'Rejected';

export interface PipelineStageHistory {
  from_stage: PipelineStage | 'Applied';
  to_stage: PipelineStage;
  moved_by: string;
  moved_at: string;
  reason?: string;
}

export interface ScorecardEntry {
  id: string;
  interviewer_id: string;
  interviewer_name: string;
  interviewer_role: RecruiterRole;
  technical_depth: number; // 1-5
  problem_solving: number; // 1-5
  culture_values: number; // 1-5
  communication: number; // 1-5
  overall_rating: number; // 1-5
  notes?: string;
  submitted_at: string;
}

export interface ScheduledInterview {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer_emails: string[];
  candidate_email: string;
  meeting_link?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface PipelineCandidate {
  id: string;
  job_id: string;
  candidate_id: string;
  masked_id: string;
  candidate_name?: string;
  candidate_email?: string;
  stage: PipelineStage;
  rejection_reason?: string;
  overall_match_score: number;
  technical_depth_score: number;
  communication_score: number;
  skills: string[];
  seniority: string;
  years_of_experience?: number;
  location?: string;
  expected_salary?: string;
  applied_at: string;
  updated_at: string;
  stage_history: PipelineStageHistory[];
  scorecards: ScorecardEntry[];
  scheduled_interviews: ScheduledInterview[];
  notes: Array<{
    id: string;
    author_name: string;
    author_role: RecruiterRole;
    text: string;
    created_at: string;
  }>;
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

  // Rich Talent Profile Attributes
  seniority?: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff' | 'Principal';
  skills?: string[];
  years_of_experience?: number;
  availability?: 'Available' | 'Open to offers' | 'Not looking';
  expected_salary?: string;
  location?: string;
  timezone?: string;
  open_to_nigeria?: boolean;
  open_to_africa?: boolean;
  open_to_remote?: boolean;
  consent_to_show_recruiters?: boolean;
  assessment_completed_date?: string;

  // Video Review & Deep Dive Assets
  transcript?: Array<{ time: number; timestamp_label: string; text: string }>;
  key_moments?: Array<{ time: number; timestamp_label: string; title: string; summary: string }>;

  // Relative job match analysis
  relative_match?: any;

  // Fields populated on unlock
  candidate_name?: string;
  candidate_email?: string;
  phone?: string;
  whatsapp?: string;
  cv_url?: string;
  is_unlocked?: boolean;
}

export interface CandidateContactLog {
  id: string;
  workspace_id: string;
  candidate_id: string;
  contact_type: 'EMAIL' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  message_template: string;
  logged_at: string;
  logged_by: string;
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
