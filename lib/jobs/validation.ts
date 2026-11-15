// lib/jobs/validation.ts
// Strict validation rules for job publishing on Sync730.
// Reject publishing when any of:
// 1. salary <= 0 (or salary_min <= 0 or salary_max <= 0)
// 2. min > max (salary_min > salary_max)
// 3. currency missing (no currency code or symbol detected)
// 4. description under 40 characters
// 5. company name contains "test" (case-insensitive)

import { JobPublishingInput } from './types';
import { MIN_DESCRIPTION_LENGTH } from './config';

export interface JobValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Extracts a numeric value from a salary token string.
 */
function parseSalaryToken(token: string): number | null {
  const clean = token.toLowerCase().replace(/[^0-9.km]/g, '').trim();
  if (!clean) return null;

  if (clean.endsWith('m')) {
    const val = parseFloat(clean.replace('m', ''));
    return isNaN(val) ? null : Math.round(val * 1_000_000);
  }
  if (clean.endsWith('k')) {
    const val = parseFloat(clean.replace('k', ''));
    return isNaN(val) ? null : Math.round(val * 1_000);
  }
  const val = parseFloat(clean);
  return isNaN(val) ? null : Math.round(val);
}

/**
 * Validates a job against Sync730 publishing standards.
 */
export function validateJobPublishing(job: JobPublishingInput): JobValidationResult {
  const errors: string[] = [];

  // 1. Company name validation (Forbidden to contain "test", case-insensitive)
  const company = (job.company || job.company_name || '').trim();
  if (!company) {
    errors.push('Company name is required.');
  } else if (/test/i.test(company)) {
    errors.push('Company name cannot contain "test" (test records are forbidden from publishing).');
  }

  // 2. Description length validation (Must be at least 40 characters)
  const description = (job.description || job.job_description || '').trim();
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    errors.push(
      `Job description must be at least ${MIN_DESCRIPTION_LENGTH} characters (currently ${description.length}).`
    );
  }

  // 3. Salary numeric and range validation
  let min: number | undefined = undefined;
  let max: number | undefined = undefined;

  if (typeof job.salary_min === 'number' && !isNaN(job.salary_min)) {
    min = job.salary_min;
  }
  if (typeof job.salary_max === 'number' && !isNaN(job.salary_max)) {
    max = job.salary_max;
  }

  const rawSalaryStr = (job.salary || job.salary_range || '').trim();

  // If min/max are not explicitly numeric, attempt extraction from raw salary string
  if (min === undefined && rawSalaryStr) {
    const sLower = rawSalaryStr.toLowerCase();
    // Check for explicit $0 or 0
    if (sLower === '$0' || sLower === '0' || sLower === '₦0' || sLower === '€0' || sLower === '£0') {
      min = 0;
      max = 0;
    } else if (rawSalaryStr.includes('-') || rawSalaryStr.includes('–')) {
      const parts = rawSalaryStr.split(/[-–]/);
      if (parts.length >= 2) {
        const parsedMin = parseSalaryToken(parts[0]);
        const parsedMax = parseSalaryToken(parts[1]);
        if (parsedMin !== null) min = parsedMin;
        if (parsedMax !== null) max = parsedMax;
      }
    } else {
      const single = parseSalaryToken(rawSalaryStr);
      if (single !== null) {
        min = single;
      }
    }
  }

  // Rule 3a: Salary must be present and > 0
  if (min === undefined && max === undefined && !rawSalaryStr) {
    errors.push('Salary or salary range is required.');
  } else {
    if (min !== undefined && min <= 0) {
      errors.push('Salary minimum must be greater than zero.');
    }
    if (max !== undefined && max <= 0) {
      errors.push('Salary maximum must be greater than zero.');
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push(`Salary minimum (${min}) cannot be greater than salary maximum (${max}).`);
    }
  }

  // 4. Currency missing validation
  let currency = (job.salary_currency || '').trim().toUpperCase();
  if (!currency && rawSalaryStr) {
    if (rawSalaryStr.includes('₦') || /ngn/i.test(rawSalaryStr)) {
      currency = 'NGN';
    } else if (rawSalaryStr.includes('$') || /usd/i.test(rawSalaryStr)) {
      currency = 'USD';
    } else if (rawSalaryStr.includes('€') || /eur/i.test(rawSalaryStr)) {
      currency = 'EUR';
    } else if (rawSalaryStr.includes('£') || /gbp/i.test(rawSalaryStr)) {
      currency = 'GBP';
    }
  }

  if (!currency) {
    errors.push('Salary currency is missing or unidentified (must specify USD, NGN, EUR, or GBP).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
