// src/content/home.ts
// Structured marketing copy for the Sync730 homepage
// Voice: direct, warm, short sentences. Never use "empowering", "age of AI", "signal", "seamless", "cutting-edge", "unlock".

export const HOME_CONTENT = {
  hero: {
    eyebrow: 'BUILT FOR HOW AFRICA HIRES',
    titleLine1: 'Real opportunity for',
    titleLine2Italic: 'African talent.',
    subtitle: 'Where you live shouldn’t decide what you can become. We verify that every role is real, open, and eligible for people living in Africa.',
    ctaPrimary: 'Explore roles',
    ctaSecondary: 'Find Work',
    reassuranceItems: [
      'Free for candidates',
      'Verified open roles',
      'No ghost jobs',
    ],
  },
  statsBand: {
    eyebrow: 'Live platform activity',
    streamLabel: 'Real-time hiring & review stream',
    linkText: 'Find Work & Active Roles',
  },
  difference: {
    eyebrow: 'The Sync730 difference',
    title: 'Less noise. Real opportunity.',
    items: [
      {
        number: '01',
        title: 'Roles verified for Africa',
        description: 'No ghost jobs. No worldwide remote that actually means US only.',
      },
      {
        number: '02',
        title: 'Direct employer postings',
        description: 'Connect directly with hiring managers who value skill over location.',
      },
      {
        number: '03',
        title: 'Clear next steps',
        description: 'Review expectations upfront and track applications in SyncFlow.',
      },
    ],
  },
  forCandidates: {
    eyebrow: 'For candidates',
    title: 'Find roles open to you. Apply with confidence.',
    features: [
      {
        number: '01',
        title: 'Verified eligibility',
        description: 'Every role is confirmed open to candidates living across Africa.',
      },
      {
        number: '02',
        title: 'SyncFlow application board',
        description: 'Track your progress through Saved, Applied, Interviewing, and Offer.',
      },
      {
        number: '03',
        title: 'Clear interview process',
        description: 'Structured evaluations help you demonstrate your real ability.',
      },
    ],
  },
  faq: {
    eyebrow: 'Common questions',
    title: 'Questions & Answers',
  },
  finalCta: {
    title: 'Ready for real opportunity?',
    subtitle: 'Browse open roles or start hiring verified talent today.',
    primaryButton: 'Find Work',
    secondaryButton: 'For recruiters',
  },
} as const;
