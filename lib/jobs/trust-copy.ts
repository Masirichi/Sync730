// lib/jobs/trust-copy.ts
// Single source of truth for all trust, verification, and benefit copy across /jobs and /jobs/[slug].
// Every claim is strictly tagged with the data flag that makes it true.
// A claim renders ONLY if its corresponding flag is true for that record.

import { POSITIONING_CONFIG } from '@/src/content/positioning';

export const showUnconfirmedClaims = POSITIONING_CONFIG.showUnconfirmedClaims;

export interface TrustClaim {
  id: string;
  flag: string;
  label: string;
  tooltip?: string;
  description?: string;
}

export const VERIFICATION_CLAIMS = {
  // Employer verified: Unconfirmed claim - only rendered if showUnconfirmedClaims is true
  employer_verified: {
    id: 'employer_verified',
    flag: 'employer_verified',
    label: 'Employer verified',
    getTooltip: (verifiedAt?: string | null) =>
      verifiedAt
        ? `Company identity reviewed by Sync730 review desk on ${new Date(verifiedAt).toLocaleDateString()}.`
        : 'Company identity reviewed by Sync730 review desk.',
  },

  // Role verified: Sync730 core verification (Source of truth)
  role_verified: {
    id: 'role_verified',
    flag: 'role_verified',
    label: 'Role verified',
    getTooltip: (verifiedAt?: string | null) =>
      verifiedAt
        ? `Verified as a real, open role eligible for people living in Africa on ${new Date(verifiedAt).toLocaleDateString()}.`
        : 'Verified as a real, open role eligible for people living in Africa.',
  },

  // Agency or staffing tag (never carries "direct" wording)
  agency_listing: {
    id: 'agency_listing',
    flag: 'is_agency',
    label: 'Agency listing',
    tooltip: 'Posted by a recruitment agency on behalf of the client company.',
  },

  // Sponsored tag for paid placements
  sponsored: {
    id: 'sponsored',
    flag: 'is_sponsored',
    label: 'Sponsored',
    tooltip: 'Promoted role placement.',
  },

  // Featured badge
  featured: {
    id: 'featured',
    flag: 'is_featured',
    label: 'Featured',
    tooltip: 'Curated role recommended by our talent team.',
  },
} as const;

export const BENEFIT_STRIP_ITEMS = [
  {
    id: 'employers_reviewed',
    flag: 'employer_verification_live',
    title: 'Employers reviewed',
    description: 'We review each employer and role before it goes live.',
  },
  {
    id: 'pay_upfront',
    flag: 'always_true',
    title: 'Pay shown up front',
    description: 'Pay ranges on every role, with ₦ and $ views.',
  },
  {
    id: 'tracker',
    flag: 'always_true',
    title: 'One place for your job hunt',
    description: 'Save roles and track every application in your private tracker.',
  },
] as const;

/**
 * Hiring line text above H1
 */
export const HIRING_LINE_COPY = {
  desk: 'Live hiring desk',
  formatUpdated: (relativeTime: string) => `Updated ${relativeTime}`,
  rightEmployers: 'Employers reviewed by our team',
  rightPay: 'Pay ranges shown up front',
} as const;

/**
 * Subline under H1: "[activeRoles] active roles · [activeEmployers] employers hiring now"
 * Hide a figure if its value is 0.
 */
export function formatH1Subline(params: {
  activeRoles: number;
  activeEmployers: number;
  hasVerifiedEmployers?: boolean;
}): string {
  const parts: string[] = [];

  if (params.activeRoles > 0) {
    parts.push(`${params.activeRoles.toLocaleString()} active roles`);
  }

  if (params.activeEmployers > 0) {
    const employerLabel = 'employers hiring now';
    parts.push(`${params.activeEmployers.toLocaleString()} ${employerLabel}`);
  }

  return parts.join(' · ');
}

/**
 * Candidate Interview Expectation Copy (Confirmation dialog and detail page)
 * Strictly plain text without promises about employer response times or outcomes.
 */
export const INTERVIEW_EXPECTATION_COPY =
  'After you apply, you’ll take an AI-moderated video interview within 48 hours.';

/**
 * Three steps shown in "What happens after you apply" on /jobs/[slug]
 */
export const WHAT_HAPPENS_STEPS = [
  {
    number: '01',
    title: 'Apply with a complete profile',
    description: 'Submit your apply-ready profile and optional cover note directly to the employer.',
  },
  {
    number: '02',
    title: 'Take an AI-moderated interview within 48 hours',
    description: 'Complete a brief structured video and technical evaluation tailored to the role rubric.',
  },
  {
    number: '03',
    title: 'The employer reviews ranked, evidence-backed results',
    description: 'Hiring teams evaluate verified candidate scores, response recordings, and skill depth.',
  },
] as const;

/**
 * Banned phrases that must NEVER appear on /jobs or /jobs/[slug].
 * Enforced by automated test suite.
 */
export const BANNED_PHRASES = [
  'pay on time',
  'that pay on time',
  'placement',
  'guarantee',
  'nda',
  'never detects',
  '100%',
  'top verified',
  'exact pay',
  'zero ambiguous ranges',
  'confirmed hiring budgets',
  'audited, vetted pan-african engineers',
  'every employer verified',
] as const;
