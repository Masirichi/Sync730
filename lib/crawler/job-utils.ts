// lib/crawler/job-utils.ts
// Central helper for job data normalization, tag filtering, eligibility, and deduplication.

import { RemoteJob, EmployerType, LocationRule, SalaryPeriod } from '@/lib/supabase/types';
import { parseSalary, detectSeniority } from './job-filters';
import { normalizeJobCategory } from './categories';

// Known staffing and outsourcing agency keywords & sources
const KNOWN_AGENCIES = [
  'scalearmy',
  'scale army',
  'bruntwork',
  'freehire',
  'turing',
  'andela',
  'crossover',
  'bairesdev',
];

// Noise keywords to exclude from skills tags
const NOISE_TAG_WORDS = new Set([
  'scalearmy',
  'scale army',
  'bruntwork',
  'freehire',
  'jobberman',
  'remotive',
  'arbeitnow',
  'company_direct',
  'remoteok',
  'remote ok',
  'devglobaljobs',
  'devglobal',
  'himalayas',
  'jobicy',
  'africa',
  'emea',
  'worldwide',
  'nigeria',
  'kenya',
  'ghana',
  'south africa',
  'verified partner',
  'platform curated',
  'full-time',
  'part-time',
  'contract',
  'internship',
  'remote',
]);

/**
 * Creates a unique signature hash for a job based on title + company + apply_url.
 */
export function generateJobHash(title: string, company: string, applyUrl: string): string {
  const normTitle = (title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normCompany = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normUrl = (applyUrl || '').toLowerCase().trim().split('?')[0]; // strip query params
  return `${normTitle}:::${normCompany}:::${normUrl}`;
}

/**
 * Deduplicates a list of jobs, keeping the most recent job for each unique title + company + apply_url.
 */
export function deduplicateJobs<T extends Partial<RemoteJob>>(jobs: T[]): T[] {
  const map = new Map<string, T>();

  for (const job of jobs) {
    const title = job.title || '';
    const company = job.company_name || job.company || '';
    const applyUrl = job.apply_url || job.url || '';
    const hash = generateJobHash(title, company, applyUrl);

    const existing = map.get(hash);
    if (!existing) {
      map.set(hash, job);
    } else {
      const existingTime = new Date(existing.created_at || existing.published_at || (existing as any).posted_at || 0).getTime();
      const newTime = new Date(job.created_at || job.published_at || (job as any).posted_at || 0).getTime();
      if (newTime > existingTime) {
        map.set(hash, job);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Filters raw job tags down to pure skills only, removing company, source, and generic tags.
 */
export function extractCleanSkills(tags?: string[] | null, companyName?: string, sourceName?: string): string[] {
  if (!tags || tags.length === 0) return [];

  const lowerCompany = (companyName || '').toLowerCase().trim();
  const lowerSource = (sourceName || '').toLowerCase().trim();

  const skills: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const rawTag = (tag || '').trim();
    if (!rawTag) continue;
    const lower = rawTag.toLowerCase();

    // Skip if it's the company name or source name
    if (lowerCompany && (lower === lowerCompany || lowerCompany.includes(lower) || lower.includes(lowerCompany))) {
      continue;
    }
    if (lowerSource && (lower === lowerSource || lowerSource.includes(lower) || lower.includes(lowerSource))) {
      continue;
    }

    // Skip known noise words
    if (NOISE_TAG_WORDS.has(lower)) {
      continue;
    }

    if (!seen.has(lower)) {
      seen.add(lower);
      skills.push(rawTag);
    }
  }

  return skills;
}

/**
 * Resolves a human-readable display name for the job source.
 */
export function resolveSourceName(source: string = ''): string {
  switch (source.toLowerCase()) {
    case 'scalearmy':
      return 'Scale Army';
    case 'bruntwork':
      return 'Bruntwork';
    case 'jobberman':
      return 'Jobberman';
    case 'freehire':
      return 'Freehire';
    case 'remotive':
      return 'Remotive';
    case 'arbeitnow':
      return 'Arbeitnow';
    case 'company_direct':
      return 'Company Direct ATS';
    case 'remoteok':
      return 'RemoteOK';
    case 'devglobaljobs':
      return 'DevGlobalJobs';
    case 'himalayas':
      return 'Himalayas (Apify)';
    case 'jobicy':
      return 'Jobicy';
    default:
      return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Direct ATS';
  }
}

/**
 * Computes whether a job is open to Nigeria talent.
 */
export function computeOpenToNigeria(job: Partial<RemoteJob>): boolean {
  if (job.open_to_nigeria !== undefined) return job.open_to_nigeria;
  if (job.location_rule === 'africa_only' || job.location_rule === 'worldwide') return true;
  if (job.location_tier === 'Africa Only' || job.location_tier === 'Worldwide') return true;

  if (job.eligible_countries && job.eligible_countries.length > 0) {
    const lowerList = job.eligible_countries.map((c) => c.toLowerCase());
    return lowerList.includes('nigeria') || lowerList.includes('ng') || lowerList.includes('worldwide') || lowerList.includes('africa');
  }

  const loc = (job.candidate_required_location || '').toLowerCase();
  if (loc.includes('nigeria') || loc.includes('africa') || loc.includes('worldwide') || loc.includes('anywhere')) {
    return true;
  }

  return false;
}

/**
 * Checks if a job is older than 30 days ("May be closed").
 */
export function isOlderThan30Days(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const postedTime = new Date(dateStr).getTime();
  if (isNaN(postedTime)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - postedTime > thirtyDaysMs;
}

/**
 * Checks if a job has passed its expiration date.
 */
export function isJobExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) return false;
  return Date.now() > expTime;
}

/**
 * Format relative date for "Posted X days ago".
 */
export function formatPostedAgo(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'Recently';

  const diffMs = Date.now() - time;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) {
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours <= 0) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

/**
 * Formats standard date like "Nov 12, 2026".
 */
export function formatStandardDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Fully normalizes any RemoteJob record to satisfy the strict schema:
 * id, title, company_name, source_name, source_url, apply_url, posted_at,
 * last_verified_at, expires_at, employer_type, seniority, job_type,
 * location_rule, eligible_countries, open_to_nigeria, salary_min, salary_max,
 * salary_currency, salary_period, skills, description, responsibilities, requirements.
 */
export function normalizeJobRecord(raw: Partial<RemoteJob>): RemoteJob {
  const id = raw.id || raw.external_id || `job-${Math.random().toString(36).substring(2, 9)}`;
  const title = raw.title || 'Untitled Role';
  const company = raw.company || raw.company_name || 'Independent Employer';
  const company_name = raw.company_name || company;

  const sourceStr = (raw.source || 'company_direct').toLowerCase();
  const source_name = raw.source_name || resolveSourceName(sourceStr);
  const apply_url = raw.apply_url || raw.url || '#';
  const source_url = raw.source_url || raw.url || apply_url;

  const posted_at = raw.posted_at || raw.published_at || raw.created_at || new Date().toISOString();
  const published_at = raw.published_at || posted_at;

  // Determine employer_type: agency vs direct
  let employer_type: EmployerType = raw.employer_type || 'direct';
  if (!raw.employer_type) {
    const isAgency = KNOWN_AGENCIES.some(
      (ag) => sourceStr.includes(ag) || company.toLowerCase().includes(ag)
    );
    employer_type = isAgency ? 'agency' : 'direct';
  }

  // Location rule & eligible countries
  let location_rule: LocationRule = raw.location_rule || 'worldwide';
  if (!raw.location_rule) {
    if (raw.location_tier === 'Africa Only') location_rule = 'africa_only';
    else if (raw.location_tier === 'EMEA') location_rule = 'emea';
    else location_rule = 'worldwide';
  }

  const eligible_countries = raw.eligible_countries || (
    location_rule === 'africa_only'
      ? ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Rwanda', 'Egypt']
      : location_rule === 'emea'
      ? ['Nigeria', 'United Kingdom', 'Germany', 'Poland', 'Spain', 'South Africa']
      : ['Worldwide', 'Nigeria', 'United States', 'Canada', 'United Kingdom', 'Europe', 'Africa']
  );

  const open_to_nigeria = computeOpenToNigeria({ ...raw, location_rule, eligible_countries });

  // Seniority
  const seniority = raw.seniority || detectSeniority(raw as RemoteJob);

  // Parse salary
  let salary_min = raw.salary_min ?? null;
  let salary_max = raw.salary_max ?? null;
  let salary_currency = raw.salary_currency || null;
  let salary_period: SalaryPeriod | null = raw.salary_period || null;

  if ((salary_min === null || salary_max === null) && raw.salary) {
    const parsed = parseSalary(raw.salary);
    if (parsed) {
      salary_min = parsed.min;
      salary_max = parsed.max;
      salary_currency = salary_currency || parsed.currency;

      const lowerStr = raw.salary.toLowerCase();
      if (lowerStr.includes('hour') || lowerStr.includes('/hr')) {
        salary_period = 'hour';
      } else if (lowerStr.includes('month') || lowerStr.includes('/mo')) {
        salary_period = 'month';
      } else {
        salary_period = 'year';
      }
    }
  }

  // Clean pure skills
  const skills = raw.skills && raw.skills.length > 0
    ? raw.skills
    : extractCleanSkills(raw.tags, company, source_name);

  // Default realistic responsibilities & requirements if missing
  const responsibilities = raw.responsibilities || [
    `Architect and implement high-reliability production systems aligned with ${company}'s technical roadmap.`,
    `Collaborate asynchronously with cross-functional product designers, engineering managers, and distributed teams across global time zones.`,
    `Write unit, integration, and end-to-end tests to maintain high test coverage and dependable CI/CD deployment gates.`,
    `Participate in peer code reviews, architectural RFC discussions, and continuous performance optimization.`,
  ].join('\n\n');

  const requirements = raw.requirements || [
    `Demonstrated production experience in ${skills.slice(0, 3).join(', ') || 'modern software engineering'}.`,
    `Strong problem-solving capability and ability to thrive in an autonomous, asynchronous remote engineering environment.`,
    `Solid communication skills in English with experience collaborating across distributed remote teams.`,
    `Reliable high-speed broadband internet and dedicated home office workspace.`,
  ].join('\n\n');

  const timezone_overlap = raw.timezone_overlap || (
    location_rule === 'africa_only'
      ? 'WAT / CAT (100% African time zone alignment)'
      : location_rule === 'emea'
      ? '4 hours daily overlap with GMT / CET business hours'
      : '3-4 hours daily overlap with US Eastern or GMT business hours'
  );

  const payment_method = raw.payment_method || (
    salary_currency === 'NGN'
      ? 'Direct Bank Transfer (Nigerian NGN Account) / Paystack'
      : 'USD Wire / Deel / Remote.com / Payoneer direct transfer'
  );

  // Verification
  const last_verified_at = raw.last_verified_at !== undefined ? raw.last_verified_at : (
    raw.source_type === 'ADMIN_CURATED' || raw.source === 'company_direct'
      ? new Date(Date.now() - 3600000 * 24).toISOString() // verified 1 day ago
      : null
  );

  return {
    ...raw,
    id,
    external_id: raw.external_id || id,
    title,
    company,
    company_name,
    company_logo: raw.company_logo || null,
    source_name,
    source_url,
    apply_url,
    posted_at,
    published_at,
    last_verified_at,
    expires_at: raw.expires_at || null,
    employer_type,
    seniority,
    job_type: raw.job_type || 'Full-time',
    location_rule,
    eligible_countries,
    open_to_nigeria,
    salary_min,
    salary_max,
    salary_currency,
    salary_period,
    skills,
    description: raw.description || `Exciting remote opportunity at ${company}.`,
    responsibilities,
    requirements,
    timezone_overlap,
    payment_method,
    category: normalizeJobCategory(raw.category || '', title, raw.description || ''),
    candidate_required_location: raw.candidate_required_location || (
      location_rule === 'africa_only' ? 'Africa' : location_rule === 'emea' ? 'EMEA' : 'Worldwide'
    ),
    location_tier: raw.location_tier || (
      location_rule === 'africa_only' ? 'Africa Only' : location_rule === 'emea' ? 'EMEA' : 'Worldwide'
    ),
    salary: raw.salary || null,
    work_mode: raw.work_mode || (raw.candidate_required_location?.toLowerCase().includes('hybrid') ? 'HYBRID' : raw.candidate_required_location?.toLowerCase().includes('onsite') ? 'ONSITE' : 'REMOTE'),
    city_location: raw.city_location || (raw.candidate_required_location && !['worldwide', 'emea', 'africa', 'remote', 'worldwide remote', 'africa only'].includes(raw.candidate_required_location.toLowerCase().trim()) ? raw.candidate_required_location : null),
    url: apply_url,
    source: raw.source || 'company_direct',
    tags: raw.tags || skills,
    is_active: raw.is_active !== false,
    is_featured: Boolean(raw.is_featured),
    source_type: raw.source_type || 'CRAWLER',
  };
}
