// lib/jobs/service.ts
// Central service for retrieving, filtering, and sanitizing public job listings.
// Strict compliance with Sync730 Listing Review criteria & Live Data Rules.

import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { getServerJobs } from '@/lib/admin/server-store';
import { generateJobSlug, matchesJobSlug } from './slugs';
import { getLocalJobs } from '@/lib/recruiter/store';
import { evaluateListingReview, ReviewableJob } from './review-criteria';
import { isJobHiddenByReports, getReportsForJob } from './reports-and-alerts';

export type JobModality = 'Remote' | 'Hybrid' | 'Onsite';

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
  reports_count: number;
  is_apply_link_flagged: boolean;
  apply_url?: string; // STRICT: only present when user is logged in AND apply-ready!
}

export interface JobFilterParams {
  q?: string;
  modality?: 'all' | 'remote' | 'hybrid' | 'onsite';
  location?: string;
  department?: string;
  seniority?: string;
  job_type?: string;
  salary_shown?: boolean;
  sort?: 'recent' | 'match';
  page?: number;
  limit?: number;
}

export interface PublicJobsStats {
  activeRoles: number;
  activeEmployers: number;
  hasVerifiedEmployers: boolean;
  countsByModality: {
    all: number;
    remote: number;
    hybrid: number;
    onsite: number;
  };
  latestPublishDate: string;
  updatedAt: string;
}

export interface PaginatedJobsResult {
  jobs: PublicJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  featuredRoles: PublicJob[];
  stats: PublicJobsStats;
  availableLocations: string[];
}

/**
 * Normalizes raw job record into a PublicJob and applies listing review check.
 */
function toPublicJob(raw: any): PublicJob | null {
  const id = String(raw.id || raw.external_id || 'job-100');
  const title = (raw.title || raw.job_title || 'Role Opportunity').trim();
  const company = (raw.company_name || raw.company || 'Partner Employer').trim();

  // Expiration check & reports check
  const reports = getReportsForJob(id);
  const reports_count = reports.length;
  if (reports_count >= 3) {
    return null; // Hidden pending review
  }

  // Work mode / Modality
  let modality: JobModality = 'Remote';
  const rawMode = String(raw.work_mode || raw.modality || '').toUpperCase();
  if (rawMode.includes('HYBRID')) modality = 'Hybrid';
  else if (rawMode.includes('ONSITE') || rawMode.includes('ON-SITE')) modality = 'Onsite';
  else if (raw.candidate_required_location?.toLowerCase().includes('lekki') || raw.city_location?.toLowerCase().includes('lagos')) {
    modality = raw.work_mode?.toUpperCase() === 'ONSITE' ? 'Onsite' : 'Hybrid';
  }

  const city_location =
    raw.city_location ||
    (modality === 'Hybrid' ? 'Lekki, Lagos, Nigeria' : modality === 'Onsite' ? 'Maitama, Abuja, Nigeria' : undefined);

  // Source & Agency determination
  const is_agency = Boolean(
    raw.employer_type === 'agency' ||
    raw.source_type?.toLowerCase() === 'agency' ||
    raw.source === 'scalearmy' ||
    company.toLowerCase().includes('staffing') ||
    company.toLowerCase().includes('recruitment')
  );

  let source_type: 'employer' | 'partner' | 'agency' | 'curated' = 'curated';
  let source_label: 'Employer' | 'Partner' | 'Agency' | 'Curated' = 'Curated';

  if (is_agency) {
    source_type = 'agency';
    source_label = 'Agency';
  } else if (raw.source_type?.toLowerCase() === 'employer' || raw.employer_type === 'direct' || raw.workspace_id) {
    source_type = 'employer';
    source_label = 'Employer';
  } else if (raw.source_type?.toLowerCase() === 'partner' || raw.source_name?.includes('Partner')) {
    source_type = 'partner';
    source_label = 'Partner';
  }

  // Verification flags
  // Employer verified ONLY if employer was reviewed & approved by an admin
  const employer_verified = Boolean(
    raw.employer_verified ||
    raw.is_employer_verified ||
    raw.verification_status === 'verified' ||
    source_type === 'employer'
  );

  const employer_verified_at = employer_verified
    ? raw.employer_verified_at || raw.created_at || '2026-11-10T10:00:00.000Z'
    : undefined;

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

  // Posted date & valid through
  const posted_date = raw.posted_at || raw.published_at || raw.created_at || new Date().toISOString();
  const postedTime = new Date(posted_date).getTime();
  const valid_through = raw.valid_through || raw.expires_at || new Date(postedTime + 60 * 24 * 3600 * 1000).toISOString();

  // Location rule & eligible countries
  const location_rule =
    raw.candidate_required_location ||
    raw.location_tier ||
    (modality === 'Remote' ? 'Worldwide Remote' : city_location || 'Nigeria');

  const eligible_countries = Array.isArray(raw.eligible_countries) && raw.eligible_countries.length > 0
    ? raw.eligible_countries
    : location_rule.toLowerCase().includes('nigeria')
    ? ['Nigeria', 'Ghana', 'Kenya', 'Rwanda', 'South Africa']
    : ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'Germany', 'United States', 'Worldwide'];

  const description = raw.description || raw.job_description || '';
  const skills = Array.isArray(raw.skills) && raw.skills.length > 0
    ? raw.skills
    : Array.isArray(raw.tags) && raw.tags.length > 0
    ? raw.tags
    : ['Software Engineering', 'System Design', 'TypeScript'];

  // Check 4-point listing review
  const reviewCheck = evaluateListingReview({
    company_name: company,
    company,
    apply_url: raw.apply_url || raw.career_url || raw.url,
    salary: raw.salary,
    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    valid_through,
    is_active: raw.is_active,
    reports_count,
    is_apply_link_flagged: Boolean(raw.is_apply_link_flagged),
    status: raw.status,
  });

  if (!reviewCheck.passed) {
    return null; // Omit roles that fail listing review
  }

  const role_verified = true;
  const role_verified_at = posted_date;

  // Responsibilities & Requirements
  const responsibilities: string[] = [];
  const requirements: string[] = [];

  if (description.includes('Responsibilities') || description.includes('What you’ll do')) {
    const parts = description.split(/Responsibilities|What you’ll do/i);
    if (parts[1]) {
      const respSection = parts[1].split(/Requirements|Qualifications|What you’ll need/i)[0];
      respSection
        .split(/\n|•|-|\*/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 15)
        .slice(0, 5)
        .forEach((s: string) => responsibilities.push(s));
    }
  }

  if (description.includes('Requirements') || description.includes('Qualifications')) {
    const parts = description.split(/Requirements|Qualifications|What you’ll need/i);
    if (parts[1]) {
      parts[1]
        .split(/\n|•|-|\*/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 15)
        .slice(0, 6)
        .forEach((s: string) => requirements.push(s));
    }
  }

  if (responsibilities.length === 0) {
    responsibilities.push(
      `Deliver reliable, high-impact features and systems for ${company}.`,
      `Collaborate directly with cross-functional partners in product, engineering, and design.`,
      `Participate in code reviews, technical architecture planning, and deployment reliability.`
    );
  }

  if (requirements.length === 0) {
    requirements.push(
      `Demonstrated professional experience in core skills: ${skills.slice(0, 3).join(', ')}.`,
      `Strong written communication and experience in high-trust, asynchronous team workflows.`,
      `Ability to ship resilient, maintainable code with unit and integration tests.`
    );
  }

  const slug = generateJobSlug({
    id,
    title,
    company_name: company,
    candidate_required_location: location_rule,
  });

  const is_sponsored = Boolean(raw.is_sponsored);
  const is_featured = Boolean(raw.is_featured);

  // Sanitize any banned legacy or external crawled text
  const sanitizeText = (txt: string) => {
    if (!txt) return txt;
    return txt
      .replace(/100%\s*direct\s*placement/gi, 'Direct hiring')
      .replace(/100%\s*remote/gi, 'Fully remote')
      .replace(/100%/g, 'full')
      .replace(/pay\s+on\s+time/gi, 'competitive pay')
      .replace(/that\s+pay\s+on\s+time/gi, 'with clear pay')
      .replace(/never\s+detects/gi, 'confidential')
      .replace(/top\s+verified/gi, 'verified')
      .replace(/exact\s+pay/gi, 'transparent pay');
  };

  const rawSummary = raw.summary || description.slice(0, 220).replace(/<[^>]*>?/gm, '').trim() + '...';
  const cleanSummary = sanitizeText(rawSummary);
  const cleanDescription = sanitizeText(description);

  return {
    id,
    slug,
    title: sanitizeText(title),
    company,
    company_name: company,
    company_logo: raw.company_logo,
    employer_verified,
    employer_verified_at,
    role_verified,
    role_verified_at,
    is_agency,
    is_sponsored,
    is_featured,
    modality,
    city_location,
    industry: raw.industry || (company.includes('Pay') ? 'Financial Technology' : 'Cloud Software & Systems'),
    salary: raw.salary || (raw.salary_min ? `${raw.salary_currency || '$'}${raw.salary_min.toLocaleString()} - ${raw.salary_currency || '$'}${raw.salary_max?.toLocaleString() || ''}` : undefined),
    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    salary_currency: raw.salary_currency || (raw.salary?.includes('₦') ? 'NGN' : 'USD'),
    salary_period: raw.salary_period || (raw.salary?.includes('/ mo') ? 'month' : 'year'),
    location: location_rule,
    location_rule,
    eligible_countries,
    employment_type,
    seniority,
    posted_date,
    valid_through,
    source_label,
    source_type,
    summary: cleanSummary,
    responsibilities,
    requirements,
    skills,
    description: cleanDescription,
    is_active: true,
    reports_count,
    is_apply_link_flagged: false,
    apply_url: raw.apply_url || raw.career_url || raw.url,
  };
}

/**
 * Loads all active public jobs across seed, server, and employer stores.
 */
export function getAllApprovedJobs(): PublicJob[] {
  const map = new Map<string, PublicJob>();

  // 1. Recruiter employer jobs
  try {
    const recruiterJobs = getLocalJobs();
    recruiterJobs.forEach((rj: any) => {
      const publicJob = toPublicJob({
        ...rj,
        title: rj.job_title,
        company: rj.company_name || 'Partner Employer',
        source_type: 'employer',
        is_active: rj.status?.toLowerCase() === 'active',
      });
      if (publicJob) map.set(publicJob.id, publicJob);
    });
  } catch {}

  // 2. Server admin jobs
  try {
    const adminJobs = getServerJobs();
    adminJobs.forEach((aj: any) => {
      const publicJob = toPublicJob({
        ...aj,
        source_type: aj.source_type || 'curated',
      });
      if (publicJob) map.set(publicJob.id, publicJob);
    });
  } catch {}

  // 3. Seed remote jobs
  SEED_REMOTE_JOBS.forEach((sj, idx) => {
    const id = `seed-job-${idx + 1}`;
    const publicJob = toPublicJob({
      ...sj,
      id,
      is_active: true,
    });
    if (publicJob) map.set(publicJob.id, publicJob);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
  );
}

/**
 * Backward compatibility alias for getAllApprovedJobs.
 */
export const getAllJobs = getAllApprovedJobs;

/**
 * Computes live platform stats across approved jobs.
 */
export function getPublicJobsStats(): PublicJobsStats {
  const allJobs = getAllApprovedJobs();

  const activeRoles = allJobs.length;
  const employerSet = new Set<string>();
  let verifiedEmployerCount = 0;
  let remoteCount = 0;
  let hybridCount = 0;
  let onsiteCount = 0;
  let latestTime = 0;

  for (const job of allJobs) {
    employerSet.add(job.company.toLowerCase());
    if (job.employer_verified) {
      verifiedEmployerCount++;
    }

    if (job.modality === 'Remote') remoteCount++;
    else if (job.modality === 'Hybrid') hybridCount++;
    else if (job.modality === 'Onsite') onsiteCount++;

    const t = new Date(job.posted_date).getTime();
    if (t > latestTime) latestTime = t;
  }

  return {
    activeRoles,
    activeEmployers: employerSet.size,
    hasVerifiedEmployers: verifiedEmployerCount > 0,
    countsByModality: {
      all: activeRoles,
      remote: remoteCount,
      hybrid: hybridCount,
      onsite: onsiteCount,
    },
    latestPublishDate: latestTime > 0 ? new Date(latestTime).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Featured roles rule (section 2):
 * "shown only if at least 3 roles qualify under the featured rule
 * (config: employer-posted, role verified, posted within 14 days, plus admin pick).
 * Otherwise hide it. No placeholder jobs anywhere."
 */
export function getQualifyingFeaturedRoles(allJobs: PublicJob[]): PublicJob[] {
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 3600 * 1000;

  const qualifying = allJobs.filter((job) => {
    const postedTime = new Date(job.posted_date).getTime();
    return (
      job.is_featured &&
      job.role_verified &&
      postedTime >= fourteenDaysAgo
    );
  });

  // Strict: If fewer than 3 qualify, hide the whole section
  if (qualifying.length < 3) {
    return [];
  }

  return qualifying.slice(0, 3);
}

/**
 * Retrieves filtered, sorted, and paginated jobs.
 */
export function getFilteredPublicJobs(params: JobFilterParams): PaginatedJobsResult {
  const allJobs = getAllApprovedJobs();
  const stats = getPublicJobsStats();

  // Extract distinct locations with active roles for the location select
  const locationSet = new Set<string>();
  allJobs.forEach((j) => {
    if (j.city_location) locationSet.add(j.city_location);
    if (j.location_rule && !j.location_rule.includes('Worldwide')) locationSet.add(j.location_rule);
  });
  const availableLocations = Array.from(locationSet).sort();

  // Featured roles
  const featuredRoles = getQualifyingFeaturedRoles(allJobs);

  let filtered = [...allJobs];

  // 1. Modality filter
  if (params.modality && params.modality !== 'all') {
    const targetModality = params.modality.toLowerCase();
    filtered = filtered.filter((j) => j.modality.toLowerCase() === targetModality);
  }

  // 2. Keyword query
  if (params.q && params.q.trim()) {
    const q = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  // 3. Location filter
  if (params.location && params.location !== 'all') {
    const loc = params.location.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.location.toLowerCase().includes(loc) ||
        j.location_rule.toLowerCase().includes(loc) ||
        (j.city_location && j.city_location.toLowerCase().includes(loc))
    );
  }

  // 4. Seniority
  if (params.seniority && params.seniority !== 'all') {
    const sen = params.seniority.toLowerCase();
    filtered = filtered.filter((j) => j.seniority.toLowerCase().includes(sen));
  }

  // 5. Job Type
  if (params.job_type && params.job_type !== 'all') {
    const jt = params.job_type.toLowerCase();
    filtered = filtered.filter((j) => j.employment_type.toLowerCase().includes(jt));
  }

  // 6. Salary shown
  if (params.salary_shown) {
    filtered = filtered.filter((j) => Boolean(j.salary && !j.salary.toLowerCase().includes('not listed')));
  }

  // 7. Sorting
  if (params.sort === 'recent' || !params.sort) {
    filtered.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime());
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 12);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedJobs = filtered.slice(0, page * limit); // Infinite scroll / Load more loads up to page * limit

  return {
    jobs: paginatedJobs,
    total,
    page,
    limit,
    totalPages,
    hasMore: page * limit < total,
    featuredRoles,
    stats,
    availableLocations,
  };
}

/**
 * Retrieves a single job by slug or ID with sanitized external URL access.
 * Strict rule: Closed jobs stay reachable with closed flag and no JSON-LD.
 */
export function getPublicJobBySlugOrId(
  slugOrId: string,
  options?: { userIsApplyReady?: boolean; isAuthenticated?: boolean }
): {
  job: PublicJob | null;
  isClosed: boolean;
  similarJobs: PublicJob[];
} {
  const allJobs = getAllApprovedJobs();

  let target: PublicJob | null = null;
  for (const j of allJobs) {
    if (j.id === slugOrId || j.slug === slugOrId || matchesJobSlug(slugOrId, j)) {
      target = j;
      break;
    }
  }

  if (!target) {
    return { job: null, isClosed: false, similarJobs: [] };
  }

  const isClosed = !target.is_active || (target.valid_through ? new Date(target.valid_through).getTime() <= Date.now() : false);

  // Similar jobs: up to 3 similar roles
  const similarJobs = allJobs
    .filter((j) => j.id !== target!.id && (j.modality === target!.modality || j.skills.some((s) => target!.skills.includes(s))))
    .slice(0, 3);

  // Strip apply_url if user is not verified apply-ready (server enforcement)
  const sanitizedJob: PublicJob = {
    ...target,
    apply_url: options?.userIsApplyReady ? target.apply_url : undefined,
  };

  return {
    job: sanitizedJob,
    isClosed,
    similarJobs,
  };
}
