// lib/admin/constants.ts
// Platform constants shared across server routes and client UI.

/**
 * Upper limit for single administrative token adjustments.
 * Configurable in this single source of truth constant.
 */
export const MAX_TOKEN_ADJUSTMENT = 100;

/**
 * Number of days after which an unverified or unmodified role is considered stale
 * and excluded from public listings.
 * Single source of truth constant for Phase 4 verification and visibility.
 */
export const ROLE_STALENESS_DAYS = 14;
