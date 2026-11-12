// lib/jobs/service.ts
// Central service for retrieving, filtering, and sanitizing public job listings.

import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { getServerJobs } from '@/lib/admin/server-store';
import { normalizeJobCategory } from '@/lib/crawler/categories';
import { normalizeJobRecord, deduplicateJobs } from '@/lib/crawler/job-utils';
import { generateJobSlug, matchesJobSlug } from './slugs';
import { getLocalJobs } from '@/lib/recruiter/store';

export interface PublicJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_name: string;
  company_logo?: string;
  employer_verified: boolean;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  location: string;
  location_rule: string; // e.g. "Open to Nigeria", "Open to Africa", "Worldwide"
  employment_type: string; // "Full-time", "Contract", etc.
  seniority: string; // "Junior", "Mid-Level", "Senior", "Lead", etc.
  posted_date: string;
  valid_through?: string;
  source_label: 'Direct Employer' | 'Partner' | 'Platform Curated';
  source_type: 'employer' | 'partner' | 'curated';
  summary: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  description: string;
  is_active: boolean;
  is_featured: boolean;
  apply_url?: string; // STRICT: only present when user is logged in AND apply-ready!
}

export interface JobFilterParams {
  q?: string;
  department?: string;
  location?: string;
  seniority?: string;
  job_type?: string;
  salary_shown?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedJobsResult {
  jobs: PublicJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Normalizes any job into a PublicJob record.
 */
function toPublicJob(raw: any): PublicJob {
  const id = String(raw.id || raw.external_id || 'job-100');
  const title = raw.title || raw.job_title || 'Role Opportunity';
  const company = raw.company_name || raw.company || 'Partner Employer';
  const location_rule =
    raw.candidate_required_location ||
    raw.location_tier ||
    raw.location ||
    'Worldwide';

  // Determine source type and label
  let source_type: 'employer' | 'partner' | 'curated' = 'curated';
  let source_label: 'Direct Employer' | 'Partner' | 'Platform Curated' = 'Platform Curated';

  const rawSourceType = String(raw.source_type || '').toLowerCase();
  if (rawSourceType === 'employer' || raw.employer_type === 'direct' || raw.workspace_id) {
    source_type = 'employer';
    source_label = 'Direct Employer';
  } else if (rawSourceType === 'partner' || raw.source_name?.includes('Partner')) {
    source_type = 'partner';
    source_label = 'Partner';
  }

  // Parse responsibilities and requirements if available, or generate standard sections
  const description = raw.description || raw.job_description || '';
  const skills = Array.isArray(raw.skills) && raw.skills.length > 0
    ? raw.skills
    : Array.isArray(raw.tags) && raw.tags.length > 0
    ? raw.tags
    : ['Software Engineering', 'Problem Solving', 'Collaboration'];

  // Verification status heuristic
  const employer_verified =
    source_type === 'employer' ||
    Boolean(raw.is_featured) ||
    Boolean(raw.last_verified_at) ||
    raw.verification_status === 'verified';

  // Seniority
  let seniority = raw.seniority || 'Mid-Level';
  if (!raw.seniority) {
    const tLower = title.toLowerCase();
    if (tLower.includes('senior') || tLower.includes('sr.')) seniority = 'Senior';
    else if (tLower.includes('lead') || tLower.includes('principal') || tLower.includes('staff')) seniority = 'Lead/Staff';
    else if (tLower.includes('junior') || tLower.includes('entry') || tLower.includes('intern')) seniority = 'Junior';
  }

  // Employment type
  const employment_type = raw.employment_type || raw.job_type || 'Full-time';

  // Posted date
  const posted_date = raw.posted_at || raw.published_at || raw.created_at || new Date().toISOString();

  // Valid through (default 60 days from posted)
  const postedTime = new Date(posted_date).getTime();
  const valid_through = new Date(postedTime + 60 * 24 * 3600 * 1000).toISOString();

  // Responsibilities & requirements split heuristic
  const responsibilities: string[] = [];
  const requirements: string[] = [];

  if (description.includes('Responsibilities') || description.includes('What you’ll do')) {
    const parts = description.split(/Responsibilities|What you’ll do/i);
    if (parts[1]) {
      const respSection = parts[1].split(/Requirements|Qualifications|What you’ll need/i)[0];
      respSection.split(/\n|•|-|\*/).map((s: string) => s.trim()).filter((s: string) => s.length > 15).slice(0, 5).forEach((s: string) => responsibilities.push(s));
    }
  }

  if (description.includes('Requirements') || description.includes('Qualifications')) {
    const parts = description.split(/Requirements|Qualifications|What you’ll need/i);
    if (parts[1]) {
      parts[1].split(/\n|•|-|\*/).map((s: string) => s.trim()).filter((s: string) => s.length > 15).slice(0, 6).forEach((s: string) => requirements.push(s));
    }
  }

  if (responsibilities.length === 0) {
    responsibilities.push(
      `Deliver reliable, high-quality solutions for ${company} across modern software architectures.`,
      `Collaborate directly with cross-functional teams in product, engineering, and design.`,
      `Participate in code reviews, technical architecture planning, and continuous deployment workflows.`
    );
  }

  if (requirements.length === 0) {
    requirements.push(
      `Proven hands-on experience in core disciplines including ${skills.slice(0, 3).join(', ')}.`,
      `Strong asynchronous communication skills and comfort working in distributed teams.`,
      `Demonstrated capability to write clean, maintainable, and well-tested code.`
    );
  }

  const slug = generateJobSlug({
    id,
    title,
    company_name: company,
    candidate_required_location: location_rule,
  });

  return {
    id,
    slug,
    title,
    company,
    company_name: company,
    company_logo: raw.company_logo,
    employer_verified,
    salary: raw.salary || (raw.salary_min ? `${raw.salary_currency || '$'}${raw.salary_min.toLocaleString()} - ${raw.salary_currency || '$'}${raw.salary_max?.toLocaleString() || ''}` : undefined),
    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    salary_currency: raw.salary_currency,
    salary_period: raw.salary_period,
    location: location_rule,
    location_rule,
    employment_type,
    seniority,
    posted_date,
    valid_through,
    source_label,
    source_type,
    summary: raw.summary || description.slice(0, 220).replace(/<[^>]*>?/gm, '').trim() + '...',
    responsibilities,
    requirements,
    skills,
    description,
    is_active:
      raw.is_active !== false &&
      raw.status?.toLowerCase() !== 'closed' &&
      raw.status?.toLowerCase() !== 'paused',
    is_featured: Boolean(raw.is_featured),
    apply_url: raw.apply_url || raw.career_url || raw.url,
  };
}

/**
 * Loads all jobs from all active sources (seeds, server store, recruiter employer jobs).
 */
export function getAllJobs(includeClosed = false): PublicJob[] {
  const jobMap = new Map<string, PublicJob>();

  // 1. Recruiter employer jobs (highest priority for "Direct Employer")
  try {
    const recruiterJobs = getLocalJobs();
    recruiterJobs.forEach((rj: any) => {
      const publicJob = toPublicJob({
        ...rj,
        title: rj.job_title,
        company: 'Partner Employer', // Or workspace company
        source_type: 'employer',
        is_active: rj.status?.toLowerCase() === 'active',
      });
      jobMap.set(publicJob.id, publicJob);
    });
  } catch {}

  // 2. Server admin jobs
  try {
    const adminJobs = getServerJobs();
    adminJobs.forEach((aj) => {
      const publicJob = toPublicJob(aj);
      jobMap.set(publicJob.id, publicJob);
    });
  } catch {}

  // 3. Baseline seed jobs
  SEED_REMOTE_JOBS.forEach((sj, idx) => {
    const id = `seed-job-${idx + 1}`;
    if (!jobMap.has(id)) {
      const publicJob = toPublicJob({
        ...sj,
        id,
        source_type: 'curated',
      });
      jobMap.set(id, publicJob);
    }
  });

  const allJobs = Array.from(jobMap.values());

  if (!includeClosed) {
    return allJobs.filter(j => j.is_active);
  }

  return allJobs;
}

/**
 * Retrieves a single job by its slug or ID.
 * Strictly sanitizes external apply URLs if visitor is not logged in and apply-ready.
 */
export function getPublicJobBySlugOrId(
  slugOrId: string,
  options?: {
    isAuthenticated?: boolean;
    isApplyReady?: boolean;
  }
): { job: PublicJob | null; isClosed: boolean; similarJobs: PublicJob[] } {
  const allJobs = getAllJobs(true); // Include closed so we can show "This job is closed" banner

  const found = allJobs.find(j => matchesJobSlug(slugOrId, j));
  if (!found) {
    return { job: null, isClosed: false, similarJobs: [] };
  }

  const isClosed = !found.is_active;

  // Find 3 similar active jobs for recommendations
  const rawSimilarJobs = allJobs
    .filter(j => j.is_active && j.id !== found.id)
    .filter(j =>
      j.seniority === found.seniority ||
      j.skills.some(s => found.skills.includes(s)) ||
      j.location_rule === found.location_rule
    )
    .slice(0, 3);

  // STRICT PRIVACY PROTECTION:
  // Never leak apply_url on the job or similar jobs to logged-out or non-apply-ready visitors!
  const sanitizedSimilarJobs = rawSimilarJobs.map(sj => {
    const copy = { ...sj };
    delete copy.apply_url;
    return copy;
  });

  const sanitizedJob: PublicJob = { ...found };
  if (!options?.isAuthenticated || !options?.isApplyReady) {
    delete sanitizedJob.apply_url;
  }

  return {
    job: sanitizedJob,
    isClosed,
    similarJobs: sanitizedSimilarJobs,
  };
}

/**
 * Filters and paginates public jobs.
 */
export function getFilteredPublicJobs(
  filters: JobFilterParams = {}
): PaginatedJobsResult {
  const allJobs = getAllJobs(false); // Live active jobs only

  let filtered = allJobs;

  // 1. Search Query (matches title, company, skills, description)
  if (filters.q && filters.q.trim()) {
    const query = filters.q.toLowerCase().trim();
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(query) ||
      j.company.toLowerCase().includes(query) ||
      j.skills.some(s => s.toLowerCase().includes(query)) ||
      j.summary.toLowerCase().includes(query)
    );
  }

  // 2. Department / Track
  if (filters.department && filters.department !== 'all') {
    const dep = filters.department.toLowerCase();
    filtered = filtered.filter(j => {
      const cat = normalizeJobCategory('', j.title, j.description).toLowerCase();
      return cat.includes(dep) || j.title.toLowerCase().includes(dep);
    });
  }

  // 3. Location Rule
  if (filters.location && filters.location !== 'all') {
    const loc = filters.location.toLowerCase();
    filtered = filtered.filter(j => {
      const l = j.location_rule.toLowerCase();
      if (loc.includes('nigeria')) return l.includes('nigeria') || l.includes('africa') || l.includes('worldwide');
      if (loc.includes('africa')) return l.includes('africa') || l.includes('worldwide');
      if (loc.includes('worldwide')) return l.includes('worldwide');
      return l.includes(loc);
    });
  }

  // 4. Seniority
  if (filters.seniority && filters.seniority !== 'all') {
    const sen = filters.seniority.toLowerCase();
    filtered = filtered.filter(j => j.seniority.toLowerCase().includes(sen));
  }

  // 5. Job Type
  if (filters.job_type && filters.job_type !== 'all') {
    const jt = filters.job_type.toLowerCase();
    filtered = filtered.filter(j => j.employment_type.toLowerCase().includes(jt));
  }

  // 6. Salary Shown
  if (filters.salary_shown) {
    filtered = filtered.filter(j => Boolean(j.salary));
  }

  // Sort: Featured first, then newest
  filtered.sort((a, b) => {
    if (b.is_featured !== a.is_featured) return b.is_featured ? 1 : -1;
    return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
  });

  const total = filtered.length;
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Number(filters.limit) || 12);
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedJobs = filtered.slice(startIndex, startIndex + limit);

  // SANITIZE: Remove apply_url from all public list results
  const publicList = paginatedJobs.map(j => {
    const sanitized = { ...j };
    delete sanitized.apply_url;
    return sanitized;
  });

  return {
    jobs: publicList,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}
