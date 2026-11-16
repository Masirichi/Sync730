// content/home.ts
// Master typed copy for Sync730 homepage.
// Voice: direct, warm, short sentences. Never use "empowering", "age of AI", "signal", "seamless", "cutting-edge", "unlock".

import { confirmed } from '@/lib/flags';

export interface HomeCopy {
  meta: {
    title: string;
    description: string;
    canonical: string;
    siteName: string;
    ogImage: string;
  };
  hero: {
    eyebrow: string;
    h1: string;
    sub: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
    proofLine: string;
    proofItems: string[];
    sampleBadge: string;
  };
  stats: {
    label: string;
    eyebrow: string;
    headline: string;
    subheading: string;
    rolesLiveNowLabel: string;
    countriesOpenLabel: string;
    employersHiringLabel: string;
    rolesSuffix: string;
    talentsSuffix: string;
    partnersSuffix: string;
    screeningTime: string;
    screeningTimeLabel: string;
    responseTime: string;
    responseTimeLabel: string;
    rolesLiveLabel: string;
    applicationsTrackedLabel: string;
    linkText: string;
    linkHref: string;
  };
  belief: {
    label: string;
    h2: string;
    paragraphs: string[];
    linkLabel: string;
    linkHref: string;
  };
  band: {
    label: string;
    sublabel: string;
    linkText: string;
    linkHref: string;
    ariaLabel: string;
  };
  candidates: {
    eyebrow: string;
    h2: string;
    body: string;
    points: Array<{
      title: string;
      line: string;
    }>;
    reassurancePrefix: string;
    reassurance: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
    sampleCard: {
      header: string;
      badge: string;
      roleLabel: string;
      roleValue: string;
      strengthsLabel: string;
      strengths: string[];
      locationLabel: string;
      locationValue: string;
      applyReadyLabel: string;
      applyReadySteps: string;
    };
  };
  howItWorks: {
    label: string;
    h2: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
    }>;
  };
  latestRoles: {
    eyebrow: string;
    h2: string;
    body: string;
    metaSuffix: string;
    buttonText: string;
    buttonHref: string;
  };
  differentiators: {
    label: string;
    h2: string;
    items: Array<{
      number: string;
      title: string;
      body: string;
    }>;
    mutedLine: string;
  };
  employers: {
    id: string;
    eyebrow: string;
    h2: string;
    body: string;
    points: Array<{
      number: string;
      title: string;
      body: string;
    }>;
    sampleReport: {
      header: string;
      badge: string;
      role: string;
      candidateId: string;
      techDepth: string;
      techDepthScore: string;
      techDepthValue: number;
      communication: string;
      communicationScore: string;
      communicationValue: number;
      quote: string;
      integrity: string;
      advisory: string;
    };
    ctaPrimary: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
  };
  socialProof: {
    label: string;
    h2: string;
    partnersLabel: string;
    items: Array<{
      id: string;
      name: string;
      role: string;
      companyOrCity: string;
      quote: string;
    }>;
  };
  faq: {
    label: string;
    h2: string;
    linkText: string;
    linkHref: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  closing: {
    h2: string;
    bodyPrefix: string;
    bodySuffix: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
    microcopy: string;
  };
  nav: {
    links: Array<{
      label: string;
      href: string;
    }>;
    syncFlowLabel: string;
    signInLabel: string;
    signInHref: string;
    createProfileLabel: string;
    createProfileHref: string;
  };
  footer: {
    tagline: string;
    columns: {
      explore: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
      company: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
      legal: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
    };
    smallPrint: string;
  };
}

export const homeCopy: HomeCopy = {
  meta: {
    title: 'Sync730: Smarter recruitment with AI solutions for everyday businesses',
    description:
      'Meet the people who fit, not the pile. Sync730 interviews every applicant, scores them on your criteria, and hands you a ranked shortlist. You decide.',
    canonical: 'https://sync730.com/',
    siteName: 'Sync730',
    ogImage: '/og-sync730.png',
  },
  hero: {
    eyebrow: 'WE BELIEVE TALENT IS EVERYWHERE',
    h1: 'Talent is everywhere. Real opportunity should be too.',
    sub: 'Sync730 checks that every role is live and open to Africa, so you can stop applying into the void. For employers, we interview every applicant and hand you a shortlist, so you can stop sorting the pile.',
    ctaPrimary: "I'm looking for work",
    ctaPrimaryHref: '/find-work',
    ctaSecondary: "I'm hiring in Africa",
    ctaSecondaryHref: '/for-employers',
    proofLine:
      'Free for candidates · People make every hiring decision · Built for how Africa hires',
    proofItems: [
      'Free for candidates',
      'People make every hiring decision',
      'Built for how Africa hires',
    ],
    sampleBadge: 'Sample',
  },
  stats: {
    label: 'LIVE ON SYNC730',
    eyebrow: 'VERIFIED METRICS',
    headline: 'Sync730 by the numbers',
    subheading: 'Updated in real time from live platform activity.',
    rolesLiveNowLabel: 'Roles live now',
    countriesOpenLabel: 'Countries roles are open to',
    employersHiringLabel: 'Employers hiring',
    rolesSuffix:
      'new roles in the last 24 hours, each checked before you saw it',
    talentsSuffix:
      'professionals already tracking their search in SyncFlow',
    partnersSuffix:
      'companies hiring from Africa right now',
    screeningTime: '~15 min',
    screeningTimeLabel: 'Screening time',
    responseTime: '<48 hrs',
    responseTimeLabel: 'Avg. response time',
    rolesLiveLabel: 'Verified roles live',
    applicationsTrackedLabel: 'Applications tracked',
    linkText: 'Find Work & Active Roles',
    linkHref: '/find-work',
  },
  belief: {
    label: 'WHY WE EXIST',
    h2: "Where you live shouldn't decide what you can become.",
    paragraphs: [
      'African professionals are among the most capable, hardworking and resourceful in the world. Yet too many spend weeks chasing jobs that were never real, or never open to them.',
      'A listing that says "remote" but means "US residents only." A role that closed months ago and is still online. An application that vanishes without a reply.',
      "That is not a talent problem. It's an information problem.",
      'So we fixed the information. On Sync730, every role is confirmed to be real and open before you see it, and we tell you up front which African countries can apply.',
      'No false hope. Just a fair shot.',
    ],
    linkLabel: 'Read how we verify roles',
    linkHref: '/how-we-verify',
  },
  band: {
    label: 'LIVE ON SYNC730',
    sublabel: 'Real-time hiring & review stream',
    linkText: 'Find Work & Active Roles',
    linkHref: '/find-work',
    ariaLabel: 'Live platform activity',
  },
  candidates: {
    eyebrow: "FOR THE ONES WHO'VE BEEN GHOSTED",
    h2: 'Stop applying into the void.',
    body: "You've done the work. You deserve a fair shot. Create one profile and we'll bring you roles that are real, open to Africa and a genuine fit. Then track every application in SyncFlow, so nothing slips.",
    points: [
      {
        title: 'Real, not ghost',
        line: 'Every role is confirmed to exist and be open before it reaches you.',
      },
      {
        title: 'Open to you, said upfront',
        line: 'See exactly which countries can apply before you spend an hour on an application.',
      },
      {
        title: 'One home for your search',
        line: 'Save roles, track applications and move them from Saved to Offer in SyncFlow, your private pipeline.',
      },
    ],
    reassurancePrefix: 'Interview guarantee: ',
    reassurance:
      'Video interviews are short and work on your phone. Only the hiring team sees your recording.',
    ctaPrimary: 'Create your free profile',
    ctaPrimaryHref: '/register',
    ctaSecondary: 'See roles open to Africa',
    ctaSecondaryHref: '/find-work',
    sampleCard: {
      header: 'Example profile',
      badge: 'Sample',
      roleLabel: 'ROLE',
      roleValue: 'Frontend developer',
      strengthsLabel: 'STRENGTHS',
      strengths: ['React', 'Accessibility', 'Testing', 'Next.js'],
      locationLabel: 'LOCATION & ELIGIBILITY',
      locationValue: 'Lagos, Nigeria · Open to Africa Remote & Hybrid',
      applyReadyLabel: 'Apply-ready',
      applyReadySteps: '6 of 7 steps',
    },
  },
  howItWorks: {
    label: 'HOW IT WORKS',
    h2: 'From "is this real?" to "I\'m hired" in four steps.',
    steps: [
      {
        number: '01',
        title: 'Create your profile',
        description:
          "Tell us your role and strengths once. It's free, and it's yours.",
      },
      {
        number: '02',
        title: 'See roles that are real',
        description:
          'Browse curated remote, hybrid and onsite roles. Each one is checked and shows who can apply.',
      },
      {
        number: '03',
        title: 'Apply with confidence',
        description:
          'Apply, take the video interview within 48 hours, and get in front of the team.',
      },
      {
        number: '04',
        title: 'Track it in SyncFlow',
        description:
          'Every application, from Saved to Interviewing to Offer, in one calm place.',
      },
    ],
  },
  latestRoles: {
    eyebrow: 'HIRING NOW · LIVE FEED',
    h2: 'Roles you can actually apply for.',
    body: 'Curated remote, hybrid and onsite roles in Lagos, Abuja and across Africa, from customer support and engineering to sales, operations and more. Each one is confirmed real, and open to Africa, before it reaches you.',
    metaSuffix: 'live roles · Remote, hybrid & onsite · One profile, every application',
    buttonText: 'Find Work',
    buttonHref: '/find-work',
  },
  differentiators: {
    label: 'THE SYNC730 DIFFERENCE',
    h2: 'No false hope. Just real roles.',
    items: [
      {
        number: '01',
        title: 'Real, not ghost',
        body: "We confirm a role exists and is open before you see it. Roles that can't be confirmed don't make it onto the page.",
      },
      {
        number: '02',
        title: 'Open to you, upfront',
        body: '"Remote" isn\'t enough. We show the exact countries that can apply.',
      },
      {
        number: '03',
        title: 'Seen for who you are',
        body: 'A video interview shows your ability, not just your CV.',
      },
      {
        number: '04',
        title: 'Humans decide',
        body: 'AI scores the interview. People make the hiring call. Always.',
      },
    ],
    mutedLine:
      'Sync730 verifies that roles are real and open to Africa. Hiring decisions are made by the employer.',
  },
  employers: {
    id: 'for-recruiters',
    eyebrow: 'WE BELIEVE IN HIRING THE PERSON, NOT THE ADDRESS',
    h2: 'Meet the person behind the résumé.',
    body: "Africa has the talent. A CV can't always show it. Every applicant takes the same AI-moderated video interview within 48 hours, so you compare like with like. You review a ranked, evidence-backed shortlist, and your team makes the call.",
    points: [
      {
        number: '01',
        title: 'Everyone gets a fair shot.',
        body: 'Each applicant takes the same interview within 48 hours, so you compare like with like.',
      },
      {
        number: '02',
        title: 'Evidence, not guesswork.',
        body: 'Every score points to what the candidate actually said.',
      },
      {
        number: '03',
        title: 'You decide. Together.',
        body: 'Reviewers watch interviews and leave notes in one place, from screen to signed.',
      },
    ],
    sampleReport: {
      header: 'SAMPLE INTERVIEW REPORT',
      badge: 'Sample',
      role: 'Senior Backend Engineer',
      candidateId: 'Candidate #A7F2',
      techDepth: 'Technical depth',
      techDepthScore: '91 / 100',
      techDepthValue: 91,
      communication: 'Communication',
      communicationScore: '88 / 100',
      communicationValue: 88,
      quote: 'Strong on retries and reconciliation. Gap: distributed tracing.',
      integrity: 'Identity verified, 0 integrity flags',
      advisory: 'Evaluation advisory: humans decide.',
    },
    ctaPrimary: 'Book a demo',
    ctaSecondary: 'See a sample report',
    ctaSecondaryHref: '#sample-report',
  },
  socialProof: {
    label: 'FROM THE PEOPLE USING IT',
    h2: 'Real roles. Real people.',
    partnersLabel: confirmed('Verified Hiring Partners') || 'Verified Hiring Partners',
    items: [],
  },
  faq: {
    label: 'QUESTIONS WE HEAR OFTEN',
    h2: 'Questions',
    linkText: 'Read how we verify roles →',
    linkHref: '/how-we-verify',
    items: [
      {
        question: 'Is Sync730 free?',
        answer:
          'Yes, for candidates. Creating a profile, browsing roles and using SyncFlow cost nothing.',
      },
      {
        question: 'What does "Role verified" mean?',
        answer:
          "We've confirmed the role exists, is open, and accepts applicants from the countries shown. Pay and hiring decisions are the employer's.",
      },
      {
        question: 'Do you guarantee I\'ll get a job?',
        answer:
          "No, and no honest platform can. We guarantee that the roles you see are real and open to you, so your effort goes where it counts.",
      },
      {
        question: 'What is SyncFlow?',
        answer:
          'Your private job pipeline. Save roles and move them through Saved, Applied, Interviewing and Offer.',
      },
      {
        question: 'Will AI decide whether I get hired?',
        answer:
          'No. AI scores the interview and shows its evidence. A person makes every hiring decision.',
      },
      {
        question: 'What if I find a role that isn\'t real or isn\'t open to Africa?',
        answer:
          'Tap "Report this job". We review reports and remove roles that don\'t hold up.',
      },
    ],
  },
  closing: {
    h2: "You've waited long enough for a fair shot.",
    bodyPrefix: 'Join ',
    bodySuffix: '+ professionals searching smarter, and the companies hiring them.',
    ctaPrimary: 'Create your free profile',
    ctaPrimaryHref: '/register',
    ctaSecondary: "I'm hiring in Africa",
    ctaSecondaryHref: '/for-employers',
    microcopy: 'Free for candidates. No credit card. Takes about 3 minutes.',
  },
  nav: {
    links: [
      { label: 'Find Work', href: '/find-work' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'For candidates', href: '/#for-candidates' },
      { label: 'For recruiters', href: '/#for-recruiters' },
    ],
    syncFlowLabel: 'SyncFlow',
    signInLabel: 'Sign in',
    signInHref: '/auth/login',
    createProfileLabel: 'Create your free profile',
    createProfileHref: '/auth/register',
  },
  footer: {
    tagline: 'Talent is everywhere. Real opportunity should be too.',
    columns: {
      explore: {
        title: 'Explore',
        links: [
          { label: 'Find Work', href: '/find-work' },
          { label: 'How it works', href: '/#how-it-works' },
          { label: 'For candidates', href: '/#for-candidates' },
          { label: 'For recruiters', href: '/#for-recruiters' },
        ],
      },
      company: {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'How we verify roles', href: '/how-we-verify' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      legal: {
        title: 'Legal & Compliance',
        links: [
          { label: 'Privacy (NDPA)', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
          { label: 'AI transparency', href: '/scoring-methodology' },
        ],
      },
    },
    smallPrint:
      'Sync730 verifies that roles are real and open to Africa. Hiring decisions are made by employers.',
  },
};

// Backward-compatible alias for existing imports
export const HOME_CONTENT = {
  ...homeCopy,
  liveStats: {
    ...homeCopy.stats,
    label: 'LIVE ON SYNC730',
  },
  forCandidates: homeCopy.candidates,
  forRecruiters: homeCopy.employers,
  closingCta: homeCopy.closing,
};
