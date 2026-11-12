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
