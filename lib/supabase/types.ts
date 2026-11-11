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

export type JobSource =
  | 'remotive'
  | 'arbeitnow'
  | 'scalearmy'
  | 'bruntwork'
  | 'jobberman'
  | 'freehire'
  | 'company_direct';

export interface RemoteJob {
  id: string;
  external_id: string;
  title: string;
  company: string;
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
