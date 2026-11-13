export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  is_featured?: boolean;
  source_type?: 'ADMIN_CURATED' | 'CRAWLER' | string;
}

export type UserProfile = Profile;

export interface TokenUnlock {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  tokens_spent: number;
  unlocked_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface CandidateWithPrivacy {
  id: string;
  display_name: string;
  display_email: string;
  display_phone?: string | null;
  headline: string;
  bio?: string | null;
  location?: string | null;
  skills: string[];
  match_percentage: number;
  initials: string;
  avatar_url?: string | null;
  is_masked: boolean;
  is_unlocked: boolean;
}

export type LocationTier = 'Worldwide' | 'EMEA' | 'Africa Only';
export type EmployerType = 'direct' | 'agency';
export type LocationRule = 'worldwide' | 'emea' | 'africa_only';
export type SalaryPeriod = 'hour' | 'month' | 'year';

export type JobSource =
  | 'remotive'
  | 'arbeitnow'
  | 'scalearmy'
  | 'bruntwork'
  | 'jobberman'
  | 'freehire'
  | 'company_direct'
  | 'remoteok'
  | 'devglobaljobs'
  | 'himalayas'
  | 'jobicy';

export interface RemoteJob {
  id: string;
  external_id: string;
  title: string;
  company: string;
  company_name?: string;
  source_name?: string;
  source_url?: string;
  apply_url?: string;
  posted_at?: string;
  last_verified_at?: string | null;
  expires_at?: string | null;
  employer_type?: EmployerType;
  seniority?: string;
  location_rule?: LocationRule;
  eligible_countries?: string[];
  open_to_nigeria?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: SalaryPeriod | null;
  skills?: string[];
  responsibilities?: string | null;
  requirements?: string | null;
  timezone_overlap?: string | null;
  payment_method?: string | null;
  company_logo?: string | null;
  description?: string | null;
  category?: string | null;
  job_type: string;
  candidate_required_location: string;
  location_tier: LocationTier;
  salary?: string | null;
  url?: string | null;
  source: JobSource | string;
  tags?: string[] | null;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_featured?: boolean;
  source_type?: 'ADMIN_CURATED' | 'CRAWLER' | string;
  work_mode?: 'REMOTE' | 'HYBRID' | 'ONSITE' | string;
  city_location?: string | null;
}

export type TrackerStatus = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';

export interface CandidateTrackerItem {
  id: string;
  candidate_id: string;
  job_id?: string | null;
  status: TrackerStatus;
  company: string;
  title: string;
  location?: string | null;
  salary?: string | null;
  url?: string | null;
  notes?: string | null;
  applied_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_range: string | null;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: SalaryPeriod | null;
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'open' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  resume_url?: string | null;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
}


// ==============================================================================
// Sprint 2: Paid B2C AI Mock Video Interview Sandbox Types
// ==============================================================================

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'BYPASSED';

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  hint: string;
}

export interface CandidateAnswer {
  question_id: number;
  question: string;
  transcript: string;
  duration_seconds: number;
  video_blob_url?: string;
}

export interface SampleBetterAnswer {
  question_id?: number;
  question: string;
  model_answer: string;
  key_takeaway?: string;
  key_takeaways?: string[];
}

export interface InterviewFeedbackScorecard {
  overall_score: number;
  communication_clarity: number;
  technical_depth: number;
  summary?: string;
  strengths: string[];
  areas_to_improve: string[];
  sample_better_answers: SampleBetterAnswer[];
}

export interface MockPrepSession {
  id: string;
  candidate_id?: string | null;
  target_role: string;
  company_name?: string | null;
  amount: number;
  currency: string;
  payment_reference: string;
  payment_status: PaymentStatus;
  interview_questions: InterviewQuestion[];
  candidate_answers: CandidateAnswer[];
  feedback_payload: InterviewFeedbackScorecard | null;
  created_at: string;
  updated_at?: string;
}


// ==============================================================================
// Sprint 3: Recruiter & Employer B2B Console Types
// ==============================================================================

export type RecruiterMemberRole = 'OWNER' | 'ADMIN' | 'INTERVIEWER';

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
  role: RecruiterMemberRole;
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
  is_active?: boolean;
  is_featured?: boolean;
  source_type?: string;
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
