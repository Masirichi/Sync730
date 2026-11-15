// lib/flags.ts
// Feature flags and claim confirmation helpers for Sync730.

/**
 * Set to true only after every [CONFIRM] claim is true.
 */
export const showUnconfirmedClaims = false;

/**
 * Returns the text or null based on flag.
 * Used for every [CONFIRM] string.
 */
export function confirmed(text: string, flag: boolean = showUnconfirmedClaims): string | null {
  return flag ? text : null;
}
