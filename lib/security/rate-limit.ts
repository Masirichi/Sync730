// lib/security/rate-limit.ts
// In-memory sliding-window rate limiter for sensitive authentication and recruiter endpoints.

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage for rate limiting
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 3600000); // 1 hour window
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  totalLimit: number;
}

/**
 * Checks whether a request should be allowed under a sliding-window rate limit.
 *
 * @param key Unique identifier (e.g., `login:${ip}`, `invite:${workspaceId}`)
 * @param limit Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds (e.g., 900000 for 15 minutes, 3600000 for 1 hour)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the window
  record.timestamps = record.timestamps.filter((ts: number) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTimeMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: Math.max(0, resetTimeMs),
      totalLimit: limit,
    };
  }

  // Record this attempt
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetTimeMs: windowMs,
    totalLimit: limit,
  };
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}
