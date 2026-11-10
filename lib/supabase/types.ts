export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
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
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
}
