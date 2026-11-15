// src/content/positioning.ts
// Master source of truth for Sync730 positioning, belief, audience, voice, and claim flags.

export const POSITIONING_CONFIG = {
  // Unconfirmed claims flag: lines marked [CONFIRM] render only if true (default false)
  showUnconfirmedClaims: false,
} as const;

export const showUnconfirmedClaims = POSITIONING_CONFIG.showUnconfirmedClaims;

export const SYNC730_BELIEF = {
  core: "Where you live shouldn't decide what you can become. Talent is everywhere. Real opportunity should be too.",
  mission: "Real, open roles eligible for people living in Africa.",
} as const;

export const SYNC730_AUDIENCE = {
  primary: "African professionals tired of ghost jobs and 'worldwide remote' that means 'US only'.",
  enemy: "False hope.",
  secondary: "Recruiters and companies who hire on ability, not address.",
} as const;

export const SYNC730_ROLE_SCOPE = {
  description: "Roles span customer support, software engineering and other tech roles, plus non-tech roles listed by recruiters and companies.",
  verificationRule: "Sync730 verifies that a role is real, open, and eligible for people living in Africa.",
  noCompanyVerificationDisclaimer: "Sync730 does not verify companies (no CAC/TIN) and does not guarantee payment, contracts, pay levels or hiring outcomes.",
} as const;

export const BANNED_VOICE_WORDS = [
  'empowering',
  'age of ai',
  'signal',
  'seamless',
  'cutting-edge',
  'unlock',
] as const;
