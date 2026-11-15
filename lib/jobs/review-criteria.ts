// lib/jobs/review-criteria.ts
// Mandatory listing review checks for public roles on Sync730.
// Only roles that pass all 4 checks appear on /jobs and /jobs/[slug].

export interface ListingReviewCheckResult {
  passed: boolean;
  checks: {
    employerIdentified: boolean;
    workingApplyLink: boolean;
    payRangeProvided: boolean;
    notExpired: boolean;
    notHiddenByReports: boolean;
  };
  reasons: string[];
}

export interface ReviewableJob {
  company_name?: string;
  company?: string;
  apply_url?: string;
  career_url?: string;
  url?: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  valid_through?: string;
  expires_at?: string;
  is_active?: boolean;
  reports_count?: number;
  is_apply_link_flagged?: boolean;
  status?: string;
}

/**
 * Validates if a job passes Sync730's 4 listing review checks:
 * 1. Employer identified: non-empty verified company name (not 'Unknown' or placeholder)
 * 2. Working apply link: valid URL structure and not flagged as broken/phishing
 * 3. Pay range provided: listed salary string or min/max numeric range
 * 4. Not expired: valid_through / expires_at has not passed, and not hidden by >= 3 reports
 */
export function evaluateListingReview(job: ReviewableJob): ListingReviewCheckResult {
  const company = (job.company_name || job.company || '').trim();
  const employerIdentified =
    company.length > 1 &&
    !['unknown', 'confidential company', 'n/a', 'stealth'].includes(company.toLowerCase());

  const applyUrl = (job.apply_url || job.career_url || job.url || '').trim();
  const workingApplyLink =
    applyUrl.length > 5 &&
    (applyUrl.startsWith('http://') || applyUrl.startsWith('https://')) &&
    !job.is_apply_link_flagged;

  const hasSalaryNumbers =
    typeof job.salary_min === 'number' &&
    typeof job.salary_max === 'number' &&
    job.salary_min > 0 &&
    job.salary_max >= job.salary_min;

  const hasSalaryText = Boolean(job.salary && job.salary.trim().length > 0 && !job.salary.toLowerCase().includes('not listed'));
  const payRangeProvided = hasSalaryNumbers || hasSalaryText;

  // Expiration check
  const now = Date.now();
  const expiryDate = job.valid_through || job.expires_at;
  const notExpired = expiryDate ? new Date(expiryDate).getTime() > now : true;

  // Report threshold check (3 reports hides the job pending review)
  const notHiddenByReports = (job.reports_count || 0) < 3;

  const passed =
    employerIdentified &&
    workingApplyLink &&
    payRangeProvided &&
    notExpired &&
    notHiddenByReports &&
    job.is_active !== false &&
    job.status?.toLowerCase() !== 'closed' &&
    job.status?.toLowerCase() !== 'rejected';

  const reasons: string[] = [];
  if (!employerIdentified) reasons.push('Employer not identified or verified');
  if (!workingApplyLink) reasons.push('Working apply link missing or flagged');
  if (!payRangeProvided) reasons.push('Pay range not provided');
  if (!notExpired) reasons.push('Role has expired');
  if (!notHiddenByReports) reasons.push('Hidden pending review due to community reports (>= 3)');

  return {
    passed,
    checks: {
      employerIdentified,
      workingApplyLink,
      payRangeProvided,
      notExpired,
      notHiddenByReports,
    },
    reasons,
  };
}
