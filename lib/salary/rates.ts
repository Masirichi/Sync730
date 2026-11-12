// lib/salary/rates.ts
// Currency conversion rates with daily caching and graceful fallback.

export interface ExchangeRateData {
  rates: Record<string, number>; // Base: USD
  updatedDate: string;
  timestamp: number;
}

// Resilient fallback rates (Base: USD)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  NGN: 1550.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
  AUD: 1.52,
};

const CACHE_KEY = 'sync730_fx_rates_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let memoryCache: ExchangeRateData | null = null;

export function getFormattedToday(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Fetch and cache exchange rates relative to USD.
 */
export async function getExchangeRates(): Promise<ExchangeRateData> {
  const now = Date.now();

  // 1. Check in-memory cache
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache;
  }

  // 2. Check localStorage (client-side)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed: ExchangeRateData = JSON.parse(stored);
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  // 3. Try to fetch fresh rates from public API with 3s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && json.rates) {
        const data: ExchangeRateData = {
          rates: {
            ...FALLBACK_RATES,
            ...json.rates,
          },
          updatedDate: getFormattedToday(),
          timestamp: now,
        };

        memoryCache = data;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // Storage quota ignore
          }
        }
        return data;
      }
    }
  } catch (err) {
    // Network or abort error: fall back to default
  }

  // 4. Fallback default
  const fallbackData: ExchangeRateData = {
    rates: FALLBACK_RATES,
    updatedDate: getFormattedToday(),
    timestamp: now,
  };
  memoryCache = fallbackData;
  return fallbackData;
}

/**
 * Get conversion multiplier between any two currencies.
 * E.g. getRate('USD', 'NGN') => ~1550
 * E.g. getRate('NGN', 'USD') => ~0.000645
 */
export async function getRate(fromCurrency: string, toCurrency: string): Promise<number> {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();

  if (from === to) return 1.0;

  try {
    const { rates } = await getExchangeRates();
    const usdToFrom = rates[from] || (from === 'USD' ? 1.0 : null);
    const usdToTarget = rates[to] || (to === 'USD' ? 1.0 : null);

    if (usdToFrom && usdToTarget) {
      // 1 from = (1 / usdToFrom) USD = (usdToTarget / usdToFrom) target
      return usdToTarget / usdToFrom;
    }
  } catch {
    // Fall back to 1 if rate lookup fails
  }

  return 1.0;
}

/**
 * Get human-readable date string for "Rates updated [date]"
 */
export function getRatesLastUpdated(): string {
  if (memoryCache?.updatedDate) return memoryCache.updatedDate;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.updatedDate) return parsed.updatedDate;
      }
    } catch {}
  }
  return getFormattedToday();
}
