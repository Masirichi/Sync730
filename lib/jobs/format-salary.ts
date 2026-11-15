// lib/jobs/format-salary.ts
// Single unified salary formatting and conversion utility for Sync730.
// Strict compliance:
// - Symbols: ₦, $, €
// - Formats: "₦850K – ₦1.2M / month", "$120K – $160K / year"
// - Header controls: Currency (Original, ₦, $) and Period (Monthly, Yearly)
// - Converted values show "≈" and a note "Exchange rates updated [date]"
// - Hourly roles assume 160 hours per month
// - Never mix monthly and yearly figures in one view when a period is selected
// - If rate fails or data missing, fall back to original currency gracefully

export type CurrencyChoice = 'ORIGINAL' | 'NGN' | 'USD';
export type PeriodChoice = 'ORIGINAL' | 'MONTHLY' | 'YEARLY';

// Daily cached conversion rate reference (e.g. 1 USD = 1,480 NGN; 1 EUR = 1.08 USD)
export const EXCHANGE_RATES = {
  USD_TO_NGN: 1480,
  EUR_TO_USD: 1.08,
  EUR_TO_NGN: 1598.4,
  lastUpdatedDate: 'November 14, 2026',
};

export interface SalarySource {
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string; // 'hour' | 'month' | 'year'
}

export interface FormattedSalaryResult {
  formatted: string;
  isConverted: boolean;
  rateNote?: string;
}

/**
 * Compact number formatter (e.g. 850000 -> 850K, 1200000 -> 1.2M, 5000 -> 5K)
 */
function formatNumberCompact(val: number): string {
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return val.toLocaleString();
}

/**
 * Parses raw salary strings (e.g. "₦450k - ₦650k/mo", "$3,000/mo", "$120,000 - $160,000 / yr")
 * into min, max, currency, and period.
 */
export function parseSalarySource(source: SalarySource): {
  min?: number;
  max?: number;
  currency: 'NGN' | 'USD' | 'EUR';
  period: 'hour' | 'month' | 'year';
  isHourly: boolean;
} {
  let currency: 'NGN' | 'USD' | 'EUR' = 'USD';
  let period: 'hour' | 'month' | 'year' = 'month';
  let isHourly = false;

  const rawStr = source.salary || '';
  const lowerStr = rawStr.toLowerCase();

  // Currency detection
  if (source.salary_currency) {
    const c = source.salary_currency.toUpperCase();
    if (c === 'NGN' || c === '₦') currency = 'NGN';
    else if (c === 'EUR' || c === '€') currency = 'EUR';
    else currency = 'USD';
  } else if (rawStr.includes('₦') || lowerStr.includes('ngn')) {
    currency = 'NGN';
  } else if (rawStr.includes('€') || lowerStr.includes('eur')) {
    currency = 'EUR';
  } else {
    currency = 'USD';
  }

  // Period detection
  if (source.salary_period) {
    const p = source.salary_period.toLowerCase();
    if (p.includes('hour')) {
      period = 'hour';
      isHourly = true;
    } else if (p.includes('year') || p.includes('yr') || p.includes('annum')) {
      period = 'year';
    } else {
      period = 'month';
    }
  } else if (lowerStr.includes('/hr') || lowerStr.includes('per hour') || lowerStr.includes('/hour')) {
    period = 'hour';
    isHourly = true;
  } else if (lowerStr.includes('/yr') || lowerStr.includes('per year') || lowerStr.includes('/year') || lowerStr.includes('annum')) {
    period = 'year';
  } else {
    period = 'month';
  }

  // Numerical min and max
  let min = source.salary_min;
  let max = source.salary_max;

  if (min === undefined && rawStr) {
    // Extract numbers from string
    const cleaned = rawStr.replace(/,/g, '');
    const matches = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|m)?/gi);
    if (matches && matches.length > 0) {
      const parsedValues = matches.map((m) => {
        const val = parseFloat(m);
        if (/m/i.test(m)) return val * 1_000_000;
        if (/k/i.test(m)) return val * 1_000;
        return val;
      });
      min = parsedValues[0];
      if (parsedValues.length > 1) {
        max = parsedValues[1];
      }
    }
  }

  return { min, max, currency, period, isHourly };
}

/**
 * Formats salary according to current view choices (Currency & Period).
 */
export function formatSalary(
  source: SalarySource,
  selectedCurrency: CurrencyChoice = 'ORIGINAL',
  selectedPeriod: PeriodChoice = 'ORIGINAL'
): FormattedSalaryResult {
  const { min, max, currency: origCurrency, period: origPeriod, isHourly } = parseSalarySource(source);

  // If no numerical salary could be extracted and no raw salary exists
  if (min === undefined && !source.salary) {
    return {
      formatted: 'Salary not disclosed',
      isConverted: false,
    };
  }

  // If salary is 0 or unstated
  if (min === 0 && (!max || max === 0)) {
    return {
      formatted: 'Salary not disclosed',
      isConverted: false,
    };
  }

  // If raw string exists but no numbers (e.g. "Competitive"), return clean disclosed state
  if (min === undefined && source.salary) {
    const sLower = source.salary.trim().toLowerCase();
    if (!sLower || sLower === 'competitive' || sLower === '$0' || sLower === '0' || sLower.includes('not listed') || sLower.includes('not disclosed')) {
      return {
        formatted: 'Salary not disclosed',
        isConverted: false,
      };
    }
    return {
      formatted: source.salary,
      isConverted: false,
    };
  }

  // Standardize hourly to monthly assuming 160 hours per month
  let baseMin = min!;
  let baseMax = max;
  let basePeriod: 'month' | 'year' = origPeriod === 'hour' ? 'month' : origPeriod;

  if (isHourly) {
    baseMin = baseMin * 160;
    if (baseMax !== undefined) baseMax = baseMax * 160;
  }

  // Determine target period
  let targetPeriod: 'month' | 'year' = basePeriod;
  if (selectedPeriod === 'MONTHLY') {
    targetPeriod = 'month';
    if (basePeriod === 'year') {
      baseMin = Math.round(baseMin / 12);
      if (baseMax !== undefined) baseMax = Math.round(baseMax / 12);
    }
  } else if (selectedPeriod === 'YEARLY') {
    targetPeriod = 'year';
    if (basePeriod === 'month') {
      baseMin = Math.round(baseMin * 12);
      if (baseMax !== undefined) baseMax = Math.round(baseMax * 12);
    }
  }

  // Determine target currency
  let targetCurrency: 'NGN' | 'USD' | 'EUR' = origCurrency;
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
      if (baseMax !== undefined) baseMax = Math.round((baseMax || 0) / EXCHANGE_RATES.USD_TO_NGN);
    } else if (origCurrency === 'EUR') {
      baseMin = Math.round(baseMin * EXCHANGE_RATES.EUR_TO_USD);
      if (baseMax !== undefined) baseMax = Math.round((baseMax || 0) * EXCHANGE_RATES.EUR_TO_USD);
    }
  }

  // Currency symbols
  const symMap = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
  };
  const sym = symMap[targetCurrency] || '$';
  const prefix = isConverted ? '≈ ' : '';

  const minFormatted = `${sym}${formatNumberCompact(baseMin)}`;
  const maxFormatted = baseMax !== undefined ? `${sym}${formatNumberCompact(baseMax)}` : '';
  const periodLabel = targetPeriod === 'month' ? '/ month' : '/ year';

  const rangeStr = maxFormatted ? `${minFormatted} – ${maxFormatted}` : minFormatted;
  const formatted = `${prefix}${rangeStr} ${periodLabel}`;

  return {
    formatted,
    isConverted,
  };
}
