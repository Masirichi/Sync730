// lib/jobs/format-salary.ts
// Unified salary formatting utility for Sync730, integrating the canonical formatSalary helper.

import {
  formatSalary as canonicalFormatSalary,
  formatSalaryNumber,
  parseSalaryData,
  FormattedSalaryResult,
} from './helpers';

export type CurrencyChoice = 'ORIGINAL' | 'NGN' | 'USD';
export type PeriodChoice = 'ORIGINAL' | 'MONTHLY' | 'YEARLY';

export const EXCHANGE_RATES = {
  USD_TO_NGN: 1480,
  EUR_TO_USD: 1.08,
  EUR_TO_NGN: 1598.4,
  lastUpdatedDate: 'November 15, 2026',
};

export interface SalarySource {
  salary?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
}

export { formatSalaryNumber, parseSalaryData };

/**
 * Universal formatSalary function satisfying both the pure prompt specification:
 *   formatSalary(job) -> { formatted: "₦850K – ₦1.2M / mo", isDisclosed: true, text: "..." }
 * and the optional interactive controls:
 *   formatSalary(job, currencyChoice, periodChoice)
 */
export function formatSalary(
  source: SalarySource,
  selectedCurrency: CurrencyChoice = 'ORIGINAL',
  selectedPeriod: PeriodChoice = 'ORIGINAL'
): FormattedSalaryResult {
  if (!source) {
    return {
      text: 'Salary not disclosed',
      formatted: 'Salary not disclosed',
      isDisclosed: false,
      toString() {
        return this.formatted;
      },
    };
  }

  // If no currency/period conversion requested, use the canonical pure formatter
  if (selectedCurrency === 'ORIGINAL' && selectedPeriod === 'ORIGINAL') {
    return canonicalFormatSalary(source);
  }

  const { min, max, currency: origCurrency, period: origPeriod } = parseSalaryData(source);

  if (min === undefined && max === undefined) {
    return {
      text: 'Salary not disclosed',
      formatted: 'Salary not disclosed',
      isDisclosed: false,
      toString() {
        return this.formatted;
      },
    };
  }

  let baseMin = min || 0;
  let baseMax = max;
  let targetPeriod: 'mo' | 'yr' = origPeriod === 'hr' ? 'mo' : origPeriod;

  // Hourly conversion
  if (origPeriod === 'hr') {
    baseMin = baseMin * 160;
    if (baseMax !== undefined) baseMax = baseMax * 160;
  }

  // Period conversion
  if (selectedPeriod === 'MONTHLY') {
    targetPeriod = 'mo';
    if (origPeriod === 'yr') {
      baseMin = Math.round(baseMin / 12);
      if (baseMax !== undefined) baseMax = Math.round(baseMax / 12);
    }
  } else if (selectedPeriod === 'YEARLY') {
    targetPeriod = 'yr';
    if (origPeriod === 'mo') {
      baseMin = Math.round(baseMin * 12);
      if (baseMax !== undefined) baseMax = Math.round(baseMax * 12);
    }
  }

  // Currency conversion
  let targetCurrency: 'NGN' | 'USD' | 'EUR' | 'GBP' = origCurrency;
  let isConverted = false;

  if (selectedCurrency === 'NGN' && origCurrency !== 'NGN') {
    targetCurrency = 'NGN';
    isConverted = true;
    const rate = origCurrency === 'EUR' ? EXCHANGE_RATES.EUR_TO_NGN : EXCHANGE_RATES.USD_TO_NGN;
    baseMin = Math.round(baseMin * rate);
    if (baseMax !== undefined) baseMax = Math.round(baseMax * rate);
  } else if (selectedCurrency === 'USD' && origCurrency !== 'USD') {
    targetCurrency = 'USD';
    isConverted = true;
    if (origCurrency === 'NGN') {
      baseMin = Math.round(baseMin / EXCHANGE_RATES.USD_TO_NGN);
      if (baseMax !== undefined) baseMax = Math.round(baseMax / EXCHANGE_RATES.USD_TO_NGN);
    } else if (origCurrency === 'EUR') {
      baseMin = Math.round(baseMin * EXCHANGE_RATES.EUR_TO_USD);
      if (baseMax !== undefined) baseMax = Math.round(baseMax * EXCHANGE_RATES.EUR_TO_USD);
    }
  }

  const symMap: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const sym = symMap[targetCurrency] || '$';
  const prefix = isConverted ? '≈ ' : '';
  const unitSuffix = ` / ${targetPeriod}`;

  let rangeText = '';
  if (baseMin && baseMax) {
    rangeText = `${prefix}${sym}${formatSalaryNumber(baseMin)} – ${sym}${formatSalaryNumber(baseMax)}${unitSuffix}`;
  } else if (baseMin) {
    rangeText = `${prefix}${sym}${formatSalaryNumber(baseMin)}${unitSuffix}`;
  } else if (baseMax) {
    rangeText = `${prefix}Up to ${sym}${formatSalaryNumber(baseMax)}${unitSuffix}`;
  } else {
    return {
      text: 'Salary not disclosed',
      formatted: 'Salary not disclosed',
      isDisclosed: false,
      toString() {
        return this.formatted;
      },
    };
  }

  return {
    text: rangeText,
    formatted: rangeText,
    isDisclosed: true,
    currency: targetCurrency,
    period: targetPeriod,
    toString() {
      return this.formatted;
    },
  };
}

export default formatSalary;
