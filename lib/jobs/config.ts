// lib/jobs/config.ts
// Central configuration constants for Sync730 Job Model and Validation

/**
 * Number of days after which an unverified or unmodified role is considered stale
 * and excluded from public listings.
 */
export const ROLE_STALE_WINDOW_DAYS = 14;

/**
 * Stale window duration in milliseconds.
 */
export const ROLE_STALE_WINDOW_MS = ROLE_STALE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Minimum characters required for a job description to be published.
 */
export const MIN_DESCRIPTION_LENGTH = 40;

/**
 * Maximum community reports a role can receive before being automatically hidden pending review.
 */
export const MAX_REPORTS_BEFORE_HIDE = 3;
