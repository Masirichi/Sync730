// lib/salary/formatSalary.ts
// Central utility to format salary ranges with currency conversion and period toggles.

import { getRate } from './rates';
import { parseSalary } from '@/lib/crawler/job-filters';
import type { RemoteJob, Job } from '@/lib/supabase/types';

export type DisplayCurrency = 'original' | 'USD' | 'NGN';
export type DisplayPeriod = 'original' | 'monthly' | 'yearly';

export interface SalaryOptions {
  currency?: DisplayCurrency;
  period?: DisplayPeriod;
}

// Map currency code to standard symbol
export function getCurrencySymbol(code: string): string {
  switch ((code || '').toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'NGN':
      return '₦';
    case 'GBP':
      return '£';
    default:
      return code || '$';
  }
}

// Format numbers: shorthand M for millions, commas for thousands
export function formatSalaryNumber(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const millions = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${millions}M`;
  }
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Period conversion:
 * - 160 hours = 1 month
 * - 12 months = 1 year
 * - 160 * 12 (1920) hours = 1 year
 */
function convertPeriodValues(
  min: number,
  max: number,
  fromPeriod: string,
  toPeriod: DisplayPeriod
): { min: number; max: number; periodLabel: string } {
  if (toPeriod === 'original' || fromPeriod === toPeriod) {
    const label =
      fromPeriod === 'hour'
        ? '/ hour'
        : fromPeriod === 'month'
        ? '/ month'
        : fromPeriod === 'year'
        ? '/ year'
        : fromPeriod
        ? `/ ${fromPeriod}`
        : '';
    return { min, max, periodLabel: label };
  }

  // 1. Annualize
  let annualMin = min;
  let annualMax = max;
  if (fromPeriod === 'hour') {
    annualMin = min * 160 * 12;
    annualMax = max * 160 * 12;
  } else if (fromPeriod === 'month') {
    annualMin = min * 12;
    annualMax = max * 12;
  }

  // 2. Convert to target period
  if (toPeriod === 'monthly') {
    return {
      min: annualMin / 12,
      max: annualMax / 12,
      periodLabel: '/ month',
    };
  }

  if (toPeriod === 'yearly') {
    return {
      min: annualMin,
      max: annualMax,
      periodLabel: '/ year',
    };
  }

  return { min, max, periodLabel: `/ ${fromPeriod}` };
}

/**
 * Formats a salary range for a job with currency and period normalization.
 * Examples:
 *   - "$48,000 – $72,000 / year"
 *   - "₦2.5M – ₦3.8M / month"
 *   - "$50 – $75 / hour"
 *   - "≈ ₦74.4M – ₦111.6M / year"
 *   - "Salary not listed"
 */
export async function formatSalary(
  job: Partial<RemoteJob | Job> | null | undefined,
  opts: SalaryOptions = {}
): Promise<string> {
  if (!job) return 'Salary not listed';

  const targetCurrency = opts.currency || 'original';
  const targetPeriod = opts.period || 'original';

  let baseMin = (job as any).salary_min ?? null;
  let baseMax = (job as any).salary_max ?? null;
  let baseCurrency = (job as any).salary_currency || null;
  let basePeriod = (job as any).salary_period || null;

  // If numeric values are not set directly, parse from salary string
  const rawSalaryStr = (job as any).salary || (job as any).salary_range;
  if ((baseMin === null || baseMax === null) && rawSalaryStr) {
    const parsed = parseSalary(rawSalaryStr);
    if (parsed) {
      baseMin = parsed.min;
      baseMax = parsed.max;
      baseCurrency = baseCurrency || parsed.currency;

      const lowerStr = rawSalaryStr.toLowerCase();
      if (lowerStr.includes('hour') || lowerStr.includes('/hr') || lowerStr.includes('/ hr')) {
        basePeriod = 'hour';
      } else if (lowerStr.includes('month') || lowerStr.includes('/mo') || lowerStr.includes('/ month')) {
        basePeriod = 'month';
      } else {
        basePeriod = 'year';
      }
    }
  }

  // If still no valid salary data, return "Salary not listed"
  if (baseMin === null && baseMax === null) {
    return 'Salary not listed';
  }

  const effectiveMin = baseMin ?? baseMax ?? 0;
  const effectiveMax = baseMax ?? baseMin ?? 0;
  const effectiveCurrency = (baseCurrency || 'USD').toUpperCase();
  const effectivePeriod = (basePeriod || 'year').toLowerCase();

  // 1. Period conversion
  const { min: periodMin, max: periodMax, periodLabel } = convertPeriodValues(
    effectiveMin,
    effectiveMax,
    effectivePeriod,
    targetPeriod
  );

  // 2. Currency conversion
  let displayMin = periodMin;
  let displayMax = periodMax;
  let displayCurrency = effectiveCurrency;
  let isConverted = false;

  if (targetCurrency !== 'original' && targetCurrency.toUpperCase() !== effectiveCurrency) {
    try {
      const rate = await getRate(effectiveCurrency, targetCurrency);
      if (rate && !isNaN(rate) && rate > 0) {
        displayMin = periodMin * rate;
        displayMax = periodMax * rate;
        displayCurrency = targetCurrency.toUpperCase();
        isConverted = true;
      }
    } catch {
      // Fallback to original currency
    }
  }

  // 3. Format numbers
  const symbol = getCurrencySymbol(displayCurrency);
  const formattedMin = formatSalaryNumber(displayMin);
  const formattedMax = formatSalaryNumber(displayMax);

  // 4. Assemble range (no duplicate symbol or trailing currency string)
  const range =
    formattedMin === formattedMax
      ? `${symbol}${formattedMin}`
      : `${symbol}${formattedMin} – ${symbol}${formattedMax}`;

  const prefix = isConverted ? '≈ ' : '';
  const suffix = periodLabel ? ` ${periodLabel}` : '';

  return `${prefix}${range}${suffix}`;
}

export default formatSalary;
