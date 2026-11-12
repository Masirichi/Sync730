import { RemoteJob } from '@/lib/supabase/types';

export type SeniorityLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead/Staff';
export type JobTypeOption = 'Full-time' | 'Contract' | 'Part-time';
export type SortOption = 'best_match' | 'newest' | 'salary_desc';

export interface ParsedSalary {
  min: number;
  max: number;
  currency: string;
  annualizedMax: number;
}

/**
 * Extracts and annualizes numeric salary ranges from arbitrary job board strings.
 */
export function parseSalary(salaryStr?: string | null): ParsedSalary | null {
  if (!salaryStr) return null;
  const str = salaryStr.trim();
  if (!str) return null;

  // Detect currency
  let currency = 'USD';
  if (str.includes('NGN') || str.includes('₦') || str.includes('?2,') || str.includes('?1,')) {
    currency = 'NGN';
  } else if (str.includes('EUR') || str.includes('€') || str.includes('?85,') || str.includes('?95,')) {
    currency = 'EUR';
  } else if (str.includes('GBP') || str.includes('£')) {
    currency = 'GBP';
  }

  // Extract all numeric occurrences
  const numbers: number[] = [];
  const regex = /(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|thousand)?/gi;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const rawNum = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(rawNum)) {
      const unit = (match[2] || '').toLowerCase();
      let multiplier = 1;
      if (unit === 'k' || unit === 'thousand') multiplier = 1000;
      else if (unit === 'm' || unit === 'million') multiplier = 1000000;
      numbers.push(rawNum * multiplier);
    }
  }

  if (numbers.length === 0) return null;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  // Annualize hourly and monthly rates
  let annualizedMax = max;
  const lower = str.toLowerCase();
  if (
    lower.includes('/ hr') ||
    lower.includes('/hr') ||
    lower.includes('per hour') ||
    (currency === 'USD' && max <= 300)
  ) {
    annualizedMax = max * 2000;
  } else if (
    lower.includes('/ month') ||
    lower.includes('/mo') ||
    lower.includes('per month') ||
    (currency === 'USD' && max <= 15000)
  ) {
    annualizedMax = max * 12;
  }

  return { min, max, currency, annualizedMax };
}

/**
 * Accurately detects Seniority level from job title, description, and tags.
 */
export function detectSeniority(job: RemoteJob): SeniorityLevel {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase()).join(' ');
  const combined = `${title} ${desc} ${tags}`;

  if (
    title.includes('lead') ||
    title.includes('staff') ||
    title.includes('principal') ||
    title.includes('director') ||
    title.includes('head of') ||
    title.includes('architect') ||
    title.includes('chief') ||
    title.includes('vp') ||
    title.includes('engineering manager')
  ) {
    return 'Lead/Staff';
  }

  if (
    title.includes('senior') ||
    title.includes('sr.') ||
    title.includes('sr ') ||
    title.includes('experienced')
  ) {
    return 'Senior';
  }

  if (
    title.includes('entry') ||
    title.includes('junior') ||
    title.includes('intern') ||
    title.includes('associate') ||
    title.includes('graduate') ||
    title.includes('trainee') ||
    tags.includes('entry') ||
    tags.includes('junior') ||
    tags.includes('intern')
  ) {
    return 'Entry';
  }

  if (combined.includes('intern') || combined.includes('entry level')) {
    return 'Entry';
  }

  return 'Mid';
}

/**
 * Checks if a job is open to talent in Nigeria or across the African continent.
 */
export function isOpenToAfrica(job: RemoteJob): boolean {
  if (job.location_tier === 'Africa Only' || job.location_tier === 'Worldwide') return true;
  const loc = (job.candidate_required_location || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase()).join(' ');
  const combined = `${loc} ${title} ${desc} ${tags}`;

  return (
    combined.includes('nigeria') ||
    combined.includes('africa') ||
    combined.includes('worldwide') ||
    combined.includes('lagos') ||
    combined.includes('nairobi') ||
    combined.includes('accra') ||
    combined.includes('ghana') ||
    combined.includes('kenya') ||
    combined.includes('south africa') ||
    combined.includes('emea') ||
    combined.includes('anywhere')
  );
}

/**
 * Matches job against query string across title, company, skills/tags, and description.
 */
export function matchesSearchQuery(job: RemoteJob, rawQuery: string): boolean {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return true;

  const title = (job.title || '').toLowerCase();
  const company = (job.company || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const location = (job.candidate_required_location || '').toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  return (
    title.includes(query) ||
    company.includes(query) ||
    location.includes(query) ||
    desc.includes(query) ||
    tags.some((tag) => tag.includes(query))
  );
}

/**
 * Computes search query match relevance score for Best Match sorting.
 */
function getMatchScore(job: RemoteJob, q: string): number {
  if (!q) return 0;
  let score = 0;
  const title = (job.title || '').toLowerCase();
  const company = (job.company || '').toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());
  const desc = (job.description || '').toLowerCase();

  if (title === q) score += 30;
  else if (title.includes(q)) score += 15;

  if (tags.includes(q)) score += 12;
  else if (tags.some((t) => t.includes(q))) score += 6;

  if (company.includes(q)) score += 5;
  if (desc.includes(q)) score += 2;

  return score;
}

/**
 * Sorts jobs according to the chosen sort strategy: Best Match, Newest, Salary high to low.
 */
export function sortJobs(
  jobs: RemoteJob[],
  sortBy: SortOption,
  searchQuery: string = ''
): RemoteJob[] {
  const sorted = [...jobs];

  if (sortBy === 'newest') {
    return sorted.sort((a, b) => {
      const timeB = new Date(b.created_at || b.published_at || 0).getTime();
      const timeA = new Date(a.created_at || a.published_at || 0).getTime();
      return timeB - timeA;
    });
  }

  if (sortBy === 'salary_desc') {
    return sorted.sort((a, b) => {
      const salB = parseSalary(b.salary)?.annualizedMax || 0;
      const salA = parseSalary(a.salary)?.annualizedMax || 0;
      return salB - salA;
    });
  }

  // Best match:
  // 1. Featured jobs first (is_featured)
  // 2. Query relevance
  // 3. Newest
  const q = searchQuery.toLowerCase().trim();
  return sorted.sort((a, b) => {
    if (Boolean(b.is_featured) !== Boolean(a.is_featured)) {
      return b.is_featured ? 1 : -1;
    }

    if (q) {
      const scoreA = getMatchScore(a, q);
      const scoreB = getMatchScore(b, q);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    const timeB = new Date(b.created_at || b.published_at || 0).getTime();
    const timeA = new Date(a.created_at || a.published_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Formats relative timestamp for "Last synced: X minutes ago"
 */
export function formatTimeAgo(timestampMs: number): string {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}
