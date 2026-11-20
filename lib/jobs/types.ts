// lib/jobs/types.ts
// Canonical type definitions for Sync730 Job Model, Categories, Eligibility, and Reports.

export type JobCategory =
  | 'Customer Support'
  | 'Software Engineering'
  | 'Design'
  | 'Product'
  | 'Data'
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Finance'
  | 'Other';

export const JOB_CATEGORIES: readonly JobCategory[] = [
  'Customer Support',
  'Software Engineering',
  'Design',
  'Product',
  'Data',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Other',
] as const;

export interface JobEligibility {
  scope: 'africa_wide' | 'countries';
  countries: string[];
  timezoneNote?: string;
}

export type ReviewStatus = 'approved' | 'needs-review' | 'rejected' | 'pending';

export type JobModality = 'Remote' | 'Hybrid' | 'Onsite';

export type CanonicalReportReason =
  | 'Role is closed'
  | 'Not open to Africa as stated'
  | 'Looks like a scam'
  | 'Other';

export interface JobReport {
  id: string;
  jobId: string;
  reason: CanonicalReportReason;
  note?: string;
  reporter_ip?: string;
  createdAt: string;
}

export interface PublicJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_name: string;
  company_logo?: string;
  employer_verified: boolean;
  employer_verified_at?: string;
  role_verified: boolean;
  role_verified_at?: string;
  roleVerifiedAt: string; // Internal only; never rendered in the UI
  eligibility: JobEligibility;
  category: JobCategory;
  is_agency: boolean;
  is_sponsored: boolean;
  is_featured: boolean;
  modality: JobModality;
  city_location?: string;
  industry?: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  location: string;
  location_rule: string;
  eligible_countries: string[];
  employment_type: string;
  seniority: string;
  posted_date: string;
  valid_through?: string;
  source_label: 'Employer' | 'Partner' | 'Agency' | 'Curated';
  source_type: 'employer' | 'partner' | 'agency' | 'curated';
  summary: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  description: string;
  is_active: boolean;
  review_status?: ReviewStatus;
  reports_count: number;
  is_apply_link_flagged: boolean;
  apply_url?: string;
  matchScore?: number;
  matchReasons?: string[];
  is_startup?: boolean;
  tags?: string[];
  source_platform?: string;
  platform?: string;
  career_url?: string;
  url?: string;
}

export interface JobPublishingInput {
  id?: string;
  title?: string;
  job_title?: string;
  company?: string;
  company_name?: string;
  description?: string | null;
  job_description?: string | null;
  salary?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  apply_url?: string | null;
  career_url?: string | null;
  url?: string | null;
  category?: string;
  eligibility?: JobEligibility;
  eligible_countries?: string[];
  location_rule?: string;
  role_verified_at?: string;
  roleVerifiedAt?: string;
  is_active?: boolean;
}
