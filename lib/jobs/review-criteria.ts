// lib/jobs/review-criteria.ts
// Mandatory listing review checks for public roles on Sync730.
// Only roles that pass all listing review checks appear on /find-work, /jobs, and /jobs/[slug].

import { ROLE_STALE_WINDOW_DAYS, MAX_REPORTS_BEFORE_HIDE } from './config';
import { isRoleStale } from './helpers';

export interface ListingReviewCheckResult {
  passed: boolean;
  checks: {
    employerIdentified: boolean;
    workingApplyLink: boolean;
    payRangeProvided: boolean;
    notExpired: boolean;
    notHiddenByReports: boolean;
    notStale: boolean;
    notTestCompany: boolean;
    approvedStatus: boolean;
  };
  reasons: string[];
}

export interface ReviewableJob {
  company_name?: string;
  company?: string;
  apply_url?: string;
  career_url?: string;
  url?: string;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  valid_through?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  reports_count?: number;
  is_apply_link_flagged?: boolean;
  status?: string | null;
  review_status?: string | null;
  roleVerifiedAt?: string | null;
  role_verified_at?: string | null;
  last_verified_at?: string | null;
  posted_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}

/**
 * Validates if a job passes Sync730's listing review checks:
 * 1. Employer identified: non-empty verified company name (not 'Unknown' or placeholder)
 * 2. Working apply link: valid URL structure and not flagged as broken/phishing
 * 3. Pay range provided: listed salary string or min/max numeric range > 0
 * 4. Not expired: valid_through / expires_at has not passed
 * 5. Not hidden by reports: reports count < MAX_REPORTS_BEFORE_HIDE (3)
 * 6. Not stale: roleVerifiedAt is within the 14-day freshness window
 * 7. Not a test record: company name does not contain "test" (case-insensitive)
 * 8. Status approved: review_status is not 'needs-review', 'rejected', or 'closed'
 */
export function evaluateListingReview(job: ReviewableJob): ListingReviewCheckResult {
  const company = (job.company_name || job.company || '').trim();
  const employerIdentified =
    company.length > 1 &&
    !['unknown', 'confidential company', 'n/a', 'stealth'].includes(company.toLowerCase());

  // Test company rule
  const notTestCompany = !/test/i.test(company);

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

  const sText = (job.salary || '').trim().toLowerCase();
  const hasSalaryText = Boolean(
    sText.length > 0 &&
      !sText.includes('not listed') &&
      !sText.includes('not disclosed') &&
      sText !== '$0' &&
      sText !== '0'
  );
  const payRangeProvided = hasSalaryNumbers || hasSalaryText;

  // Expiration check
  const now = Date.now();
  const expiryDate = job.valid_through || job.expires_at;
  const notExpired = expiryDate ? new Date(expiryDate).getTime() > now : true;

  // Report threshold check (3 reports hides the job pending review)
  const notHiddenByReports = (job.reports_count || 0) < MAX_REPORTS_BEFORE_HIDE;

  // Stale check (roleVerifiedAt must be <= 14 days old)
  const verifiedTimestamp =
    job.roleVerifiedAt ||
    job.role_verified_at ||
    job.last_verified_at ||
    job.published_at ||
    job.posted_at ||
    job.created_at;
  const notStale = !isRoleStale(verifiedTimestamp, ROLE_STALE_WINDOW_DAYS);

  // Status check: excludes 'needs-review', 'rejected', 'closed'
  const revStatus = (job.review_status || '').toLowerCase();
  const generalStatus = (job.status || '').toLowerCase();
  const approvedStatus =
    revStatus !== 'needs-review' &&
    revStatus !== 'needs_review' &&
    revStatus !== 'rejected' &&
    generalStatus !== 'closed' &&
    generalStatus !== 'rejected' &&
    generalStatus !== 'needs-review' &&
    job.is_active !== false;

  const passed =
    employerIdentified &&
    notTestCompany &&
    workingApplyLink &&
    payRangeProvided &&
    notExpired &&
    notHiddenByReports &&
    notStale &&
    approvedStatus;

  const reasons: string[] = [];
  if (!employerIdentified) reasons.push('Employer not identified or verified');
  if (!notTestCompany) reasons.push('Company name contains "test" (forbidden test record)');
  if (!workingApplyLink) reasons.push('Working apply link missing or flagged');
  if (!payRangeProvided) reasons.push('Pay range not provided or salary is 0');
  if (!notExpired) reasons.push('Role has expired');
  if (!notHiddenByReports) reasons.push('Hidden pending review due to community reports (>= 3)');
  if (!notStale) reasons.push(`Role is stale (last verified older than ${ROLE_STALE_WINDOW_DAYS} days)`);
  if (!approvedStatus) reasons.push(`Role status is not approved (${job.review_status || job.status || 'inactive'})`);

  return {
    passed,
    checks: {
      employerIdentified,
      notTestCompany,
      workingApplyLink,
      payRangeProvided,
      notExpired,
      notHiddenByReports,
      notStale,
      approvedStatus,
    },
    reasons,
  };
}
