export type PlatformRole = 'candidate' | 'recruiter' | 'PLATFORM_ADMIN' | 'admin';

export interface AdminMetrics {
  total_candidates: number;
  active_workspaces: number;
  completed_assessments: number;
  tokens_unlocked: number;
  gross_revenue_ngn: number;
  recent_activity: AdminActivityItem[];
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
}

export interface AdminCorporateWorkspace {
  id: string;
  company_name: string;
  billing_email: string;
  token_balance: number;
  industry?: string | null;
  company_size?: string | null;
  created_at: string;
}

export interface AdminRemoteJob {
  id: string;
  external_id?: string;
  title: string;
  company: string;
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
  published_at: string;
  created_at: string;
}
