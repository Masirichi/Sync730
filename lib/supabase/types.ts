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

// UserProfile alias for user_profiles view/table
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
