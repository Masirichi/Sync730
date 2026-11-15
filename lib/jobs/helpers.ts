// lib/jobs/helpers.ts
// Pure utility functions for Salary Formatting, Eligibility, Category Normalization,
// and Stale Role Filtering for Sync730.

import { JobCategory, JobEligibility, PublicJob } from './types';
import { ROLE_STALE_WINDOW_DAYS, ROLE_STALE_WINDOW_MS } from './config';

export interface FormattedSalaryResult {
  text: string;
  formatted: string;
  isDisclosed: boolean;
  isConverted?: boolean;
  currency?: string;
  period?: string;
  toString(): string;
}

export interface EligibilityResult {
  label: string;
  hiddenCount: number;
  fullList: string[];
}

/**
 * Formats a numeric value with K/M abbreviation (e.g. 850000 -> 850K, 1200000 -> 1.2M).
 */
export function formatSalaryNumber(val: number): string {
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${Number(m.toFixed(1))}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return k % 1 === 0 ? `${k}K` : `${Number(k.toFixed(1))}K`;
  }
  return val.toLocaleString();
}

/**
 * Extracts numeric minimum, maximum, currency, and period from a job or salary source.
 */
export function parseSalaryData(job: {
  salary?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
}): {
  min?: number;
  max?: number;
  currency: 'NGN' | 'USD' | 'EUR' | 'GBP';
  period: 'mo' | 'yr' | 'hr';
} {
  let currency: 'NGN' | 'USD' | 'EUR' | 'GBP' = 'USD';
  let period: 'mo' | 'yr' | 'hr' = 'mo';

  const rawStr = (job.salary || job.salary_range || '').trim();
  const lowerStr = rawStr.toLowerCase();

  // 1. Currency
  if (job.salary_currency) {
    const c = job.salary_currency.toUpperCase();
    if (c === 'NGN' || c === '₦') currency = 'NGN';
    else if (c === 'EUR' || c === '€') currency = 'EUR';
    else if (c === 'GBP' || c === '£') currency = 'GBP';
    else currency = 'USD';
  } else if (rawStr.includes('₦') || lowerStr.includes('ngn')) {
    currency = 'NGN';
  } else if (rawStr.includes('€') || lowerStr.includes('eur')) {
    currency = 'EUR';
  } else if (rawStr.includes('£') || lowerStr.includes('gbp')) {
    currency = 'GBP';
  }

  // 2. Period
  if (job.salary_period) {
    const p = job.salary_period.toLowerCase();
    if (p.includes('hour') || p.includes('hr')) period = 'hr';
    else if (p.includes('year') || p.includes('yr') || p.includes('annum')) period = 'yr';
    else period = 'mo';
  } else if (lowerStr.includes('/hr') || lowerStr.includes('hour')) {
    period = 'hr';
  } else if (lowerStr.includes('/yr') || lowerStr.includes('year') || lowerStr.includes('annum')) {
    period = 'yr';
  } else {
    // Default: if >= $30,000 / year USD or NGN > 5M/yr, infer yearly if unspecified
    period = 'mo';
  }

  // 3. Min & Max
  let min = typeof job.salary_min === 'number' && job.salary_min > 0 ? job.salary_min : undefined;
  let max = typeof job.salary_max === 'number' && job.salary_max > 0 ? job.salary_max : undefined;

  if (min === undefined && rawStr) {
    const cleanNumbers = rawStr.match(/[\d,.]+(?:k|m)?/gi);
    if (cleanNumbers && cleanNumbers.length >= 2) {
      const p1 = parseToken(cleanNumbers[0]);
      const p2 = parseToken(cleanNumbers[1]);
      if (p1 !== null) min = p1;
      if (p2 !== null) max = p2;
    } else if (cleanNumbers && cleanNumbers.length === 1) {
      const p1 = parseToken(cleanNumbers[0]);
      if (p1 !== null) min = p1;
    }
  }

  // Default yearly detection if annual scale
  if (!job.salary_period && !lowerStr.includes('/mo') && !lowerStr.includes('month')) {
    if (currency === 'USD' && min && min >= 30_000) {
      period = 'yr';
    }
  }

  return { min, max, currency, period };
}

function parseToken(token: string): number | null {
  const clean = token.toLowerCase().replace(/[^0-9.km]/g, '');
  if (!clean) return null;
  if (clean.endsWith('m')) {
    const n = parseFloat(clean.replace('m', ''));
    return isNaN(n) ? null : Math.round(n * 1_000_000);
  }
  if (clean.endsWith('k')) {
    const n = parseFloat(clean.replace('k', ''));
    return isNaN(n) ? null : Math.round(n * 1_000);
  }
  const n = parseFloat(clean.replace(/,/g, ''));
  return isNaN(n) ? null : Math.round(n);
}

/**
 * Pure function: formats salary with symbol before number, K/M abbreviations,
 * en dash with spaces, and unit suffix.
 *
 * Examples:
 * - "₦850K – ₦1.2M / mo"
 * - "$120K – $160K / yr"
 * - Missing salary returns { text: 'Salary not disclosed', isDisclosed: false }
 */
export function formatSalary(job: {
  salary?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
}): FormattedSalaryResult {
  const undisclosed: FormattedSalaryResult = {
    text: 'Salary not disclosed',
    formatted: 'Salary not disclosed',
    isDisclosed: false,
    toString() {
      return this.formatted;
    },
  };

  if (!job) return undisclosed;

  const { min, max, currency, period } = parseSalaryData(job);

  if (min === undefined && max === undefined) {
    return undisclosed;
  }

  if (min !== undefined && min <= 0 && (!max || max <= 0)) {
    return undisclosed;
  }

  const symMap: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const sym = symMap[currency] || '$';
  const unitSuffix = ` / ${period}`;

  let rangeText = '';
  if (min !== undefined && max !== undefined) {
    const minStr = `${sym}${formatSalaryNumber(min)}`;
    const maxStr = `${sym}${formatSalaryNumber(max)}`;
    rangeText = `${minStr} – ${maxStr}${unitSuffix}`;
  } else if (min !== undefined) {
    const minStr = `${sym}${formatSalaryNumber(min)}`;
    rangeText = `${minStr}${unitSuffix}`;
  } else if (max !== undefined) {
    const maxStr = `${sym}${formatSalaryNumber(max)}`;
    rangeText = `Up to ${maxStr}${unitSuffix}`;
  } else {
    return undisclosed;
  }

  return {
    text: rangeText,
    formatted: rangeText,
    isDisclosed: true,
    currency,
    period,
    toString() {
      return this.formatted;
    },
  };
}

/**
 * Pure function: formats eligibility for African professionals.
 *
 * Examples:
 * - scope: "countries" -> "Open to Nigeria, Ghana, Kenya" with hiddenCount 4 for "+4"
 * - scope: "africa_wide" -> "Open to all of Africa"
 */
export function formatEligibility(
  job: {
    eligibility?: JobEligibility;
    eligible_countries?: string[];
    location_rule?: string;
    candidate_required_location?: string;
  },
  maxVisible = 3
): EligibilityResult {
  const eligibility = job.eligibility || normalizeToCanonicalEligibility(job);

  if (eligibility.scope === 'africa_wide') {
    const fullList =
      eligibility.countries && eligibility.countries.length > 0
        ? eligibility.countries
        : [
            'Nigeria',
            'Kenya',
            'Ghana',
            'South Africa',
            'Rwanda',
            'Egypt',
            'Uganda',
            'All African Countries',
          ];
    return {
      label: 'Open to all of Africa',
      hiddenCount: 0,
      fullList,
    };
  }

  const rawList = eligibility.countries && eligibility.countries.length > 0 ? eligibility.countries : [];
  // Filter out any non-country noise like 'Worldwide' or 'Remote'
  const countries = rawList.filter((c) => !['worldwide', 'remote', 'global'].includes(c.toLowerCase()));

  if (countries.length === 0) {
    return {
      label: 'Open to Africa',
      hiddenCount: 0,
      fullList: ['Africa'],
    };
  }

  if (countries.length <= maxVisible) {
    return {
      label: `Open to ${countries.join(', ')}`,
      hiddenCount: 0,
      fullList: countries,
    };
  }

  const visible = countries.slice(0, maxVisible);
  const hiddenCount = countries.length - maxVisible;

  return {
    label: `Open to ${visible.join(', ')}`,
    hiddenCount,
    fullList: countries,
  };
}

/**
 * Normalizes raw location data to canonical JobEligibility object.
 */
export function normalizeToCanonicalEligibility(raw: {
  eligibility?: any;
  eligible_countries?: string[];
  location_rule?: string;
  candidate_required_location?: string;
  location_tier?: string;
  timezone_overlap?: string | null;
}): JobEligibility {
  if (raw.eligibility && (raw.eligibility.scope === 'africa_wide' || raw.eligibility.scope === 'countries')) {
    return {
      scope: raw.eligibility.scope,
      countries: Array.isArray(raw.eligibility.countries) ? raw.eligibility.countries : [],
      timezoneNote: raw.eligibility.timezoneNote || raw.timezone_overlap,
    };
  }

  const countries = Array.isArray(raw.eligible_countries) ? [...raw.eligible_countries] : [];
  const locRule = (raw.location_rule || raw.location_tier || '').toLowerCase();
  const reqLoc = (raw.candidate_required_location || '').toLowerCase();

  const isAfricaWide =
    locRule.includes('africa_only') ||
    locRule.includes('africa wide') ||
    reqLoc.includes('all of africa') ||
    reqLoc.includes('pan-african') ||
    (countries.length >= 5 && countries.some((c) => c.toLowerCase().includes('nigeria')));

  if (isAfricaWide) {
    return {
      scope: 'africa_wide',
      countries: countries.filter((c) => !['worldwide', 'remote'].includes(c.toLowerCase())),
      timezoneNote: raw.timezone_overlap || undefined,
    };
  }

  return {
    scope: 'countries',
    countries: countries.filter((c) => !['worldwide', 'remote'].includes(c.toLowerCase())),
    timezoneNote: raw.timezone_overlap || undefined,
  };
}

/**
 * Normalizes any category string, job title, and description into one of the 10 canonical JobCategory enums.
 */
export function normalizeToCanonicalCategory(
  rawCategory = '',
  title = '',
  description = ''
): JobCategory {
  const t = title.toLowerCase();
  const c = rawCategory.toLowerCase();
  const d = description.toLowerCase();

  // Title-first classification for maximum accuracy on compound categories (e.g. "Sales & Marketing", "Product & Design")
  // 1. Customer Support
  if (
    t.includes('customer support') ||
    t.includes('customer success') ||
    t.includes('client care') ||
    t.includes('helpdesk') ||
    t.includes('support specialist') ||
    (t.includes('support engineer') && !t.includes('cloud') && !t.includes('devops'))
  ) {
    return 'Customer Support';
  }

  // 2. Design
  if (
    t.includes('designer') ||
    t.includes('ui/ux') ||
    t.includes('design systems') ||
    t.includes('graphic design') ||
    t.includes('brand designer')
  ) {
    return 'Design';
  }

  // 3. Product
  if (
    t.includes('product manager') ||
    t.includes('product lead') ||
    t.includes('head of product') ||
    t.includes('product owner')
  ) {
    return 'Product';
  }

  // 4. Data
  if (
    t.includes('data engineer') ||
    t.includes('data analyst') ||
    t.includes('data scientist') ||
    t.includes('analytics') ||
    t.includes('machine learning') ||
    t.includes('ai automation') ||
    t.includes('ai engineer')
  ) {
    return 'Data';
  }

  // 5. Software Engineering / DevOps / Cloud / SRE
  if (
    t.includes('software') ||
    t.includes('full stack') ||
    t.includes('fullstack') ||
    t.includes('frontend') ||
    t.includes('backend') ||
    t.includes('developer') ||
    t.includes('engineer') ||
    t.includes('architect') ||
    t.includes('devops') ||
    t.includes('sre') ||
    t.includes('cloud') ||
    t.includes('infrastructure') ||
    t.includes('kubernetes')
  ) {
    return 'Software Engineering';
  }

  // 6. Sales
  if (
    t.includes('sales') ||
    t.includes('account executive') ||
    t.includes('business development') ||
    t.includes('bdr') ||
    t.includes('sdr')
  ) {
    return 'Sales';
  }

  // 7. Marketing
  if (
    t.includes('marketing') ||
    t.includes('growth') ||
    t.includes('seo') ||
    t.includes('content') ||
    t.includes('social media') ||
    t.includes('copywriter')
  ) {
    return 'Marketing';
  }

  // 8. Operations
  if (
    t.includes('operations') ||
    t.includes('expansion') ||
    t.includes('people') ||
    t.includes('recruiting') ||
    t.includes('recruiter') ||
    t.includes('human resources')
  ) {
    return 'Operations';
  }

  // 9. Finance
  if (
    t.includes('finance') ||
    t.includes('financial') ||
    t.includes('accounting') ||
    t.includes('accountant') ||
    t.includes('tax') ||
    t.includes('billing')
  ) {
    return 'Finance';
  }

  // Secondary Category-based fallback
  if (c.includes('customer support')) return 'Customer Support';
  if (c.includes('design')) return 'Design';
  if (c === 'product') return 'Product';
  if (c.includes('data') || c.includes('ai')) return 'Data';
  if (c.includes('software') || c.includes('engineering') || c.includes('devops')) return 'Software Engineering';
  if (c.includes('sales')) return 'Sales';
  if (c.includes('marketing')) return 'Marketing';
  if (c.includes('operations')) return 'Operations';
  if (c.includes('finance')) return 'Finance';

  return 'Other';
}

/**
 * Checks whether a job's verification timestamp is older than the allowed window (14 days).
 */
export function isRoleStale(roleVerifiedAt?: string | null, windowDays = ROLE_STALE_WINDOW_DAYS): boolean {
  if (!roleVerifiedAt) return false;
  const verifiedTime = new Date(roleVerifiedAt).getTime();
  if (isNaN(verifiedTime) || verifiedTime <= 0) return false;

  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return Date.now() - verifiedTime > windowMs;
}
