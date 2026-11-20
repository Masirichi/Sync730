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
  products?: {
    label: string;
    h2: string;
    sub: string;
    items: Array<{
      id: string;
      title: string;
      badge: string;
      tagline: string;
      description: string;
      bullets: string[];
      href: string;
    }>;
  };
  solutions?: {
    label: string;
    h2: string;
    sub: string;
    items: Array<{
      id: string;
      audience: string;
      title: string;
      description: string;
      impact: string;
      points: string[];
      href: string;
    }>;
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
    address: string;
    tagline: string;
    columns: {
      explore: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
      products?: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
      solutions?: {
        title: string;
        links: Array<{ label: string; href: string }>;
      };
      hiring?: {
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
    title: 'Sync730 — AI Recruitment Solutions for High-Growth Teams',
    description:
      "Autonomous AI recruitment platform for modern engineering teams. Source, screen with calibrated AI video interviews, and hire Africa's top 2% technical talent in 72 hours. Headquartered in Abuja, Nigeria.",
    canonical: 'https://sync730.com/',
    siteName: 'Sync730',
    ogImage: '/og-sync730.png',
  },
  hero: {
    eyebrow: 'AI RECRUITMENT SOLUTIONS FOR GLOBAL TEAMS',
    h1: 'Autonomous AI recruitment for modern engineering teams.',
    sub: "Sync730 replaces manual resume screening and endless first rounds with calibrated AI video interviews, real-world code evaluations, and instant shortlists of Africa's top 2% technical talent.",
    ctaPrimary: 'Start Hiring with AI',
    ctaPrimaryHref: '/hiring',
    ctaSecondary: 'Explore Products',
    ctaSecondaryHref: '/products',
    proofLine:
      '72h avg. time-to-hire · Calibrated STAR rubrics · Humans make every final hiring decision',
    proofItems: [
      '72h avg. time-to-hire',
      'Calibrated STAR scoring rubrics',
      'Humans make every final hiring decision',
    ],
    sampleBadge: 'AI Match Dossier',
  },
  products: {
    label: 'OUR SUITE OF AI TOOLS',
    h2: 'Full-cycle AI recruitment architecture.',
    sub: 'From automated sourcing to live video evaluation and pipeline management, Sync730 gives technical teams high-signal hiring with zero friction.',
    items: [
      {
        id: 'sourcing',
        title: 'AI Autonomous Sourcing & Matchmaker',
        badge: 'Smart Sourcing',
        tagline: 'Deep semantic matching from live engineering profiles',
        description:
          'Our AI engine evaluates real GitHub commits, production stack depth, and regional Africa eligibility to surface candidate matches with 94%+ relevance.',
        bullets: [
          'Direct semantic matching against role specs',
          'Pre-cleared African remote eligibility',
          'Zero keyword manipulation or resume fluff',
        ],
        href: '/products#sourcing',
      },
      {
        id: 'interview',
        title: 'AI Video & Technical Interviewer',
        badge: 'Automated Screening',
        tagline: '20-minute adaptive technical and STAR interviews',
        description:
          'Eliminate 80+ hours of repetitive screening. Our conversational AI conducts structured technical interviews and provides rubric-calibrated scoring.',
        bullets: [
          'Calibrated STAR behavioral & technical rubrics',
          'Live code problem-solving & architecture review',
          'Transparent evidence-backed scorecards',
        ],
        href: '/products#interview',
      },
      {
        id: 'syncflow',
        title: 'SyncFlow ATS & Talent CRM',
        badge: 'Pipeline CRM',
        tagline: 'Collaborative pipeline built for technical speed',
        description:
          'Track candidates from Sourced to Offer. Multi-user review, private notes, stage automation, and one-click candidate progression.',
        bullets: [
          'Drag-and-drop collaborative Kanban board',
          'Multi-stakeholder evaluation notes',
          'Automated candidate updates and stage triggers',
        ],
        href: '/products#syncflow',
      },
      {
        id: 'chat',
        title: 'Direct Recruiter Messaging & Dossiers',
        badge: 'Instant Connect',
        tagline: 'Direct, unhindered access to vetted technical talent',
        description:
          'Message candidates directly from your recruiter console. View full video recordings, verified GitHub repos, and unredacted contact dossiers.',
        bullets: [
          'Real-time in-app recruiter-candidate chat',
          'Complete candidate dossiers and video playbacks',
          'Zero middleman delays or staffing agency markups',
        ],
        href: '/products#chat',
      },
    ],
  },
  solutions: {
    label: 'TAILORED RECRUITMENT SOLUTIONS',
    h2: 'Engineered for how top engineering teams hire.',
    sub: 'Whether you are an early-stage startup or a global remote enterprise, Sync730 reduces your cost and time-to-hire by over 70%.',
    items: [
      {
        id: 'startups',
        audience: 'For High-Growth Startups',
        title: 'Hire Senior Engineers in 72 Hours without Agency Fees',
        description:
          'Avoid spending $25,000 per hire on traditional staffing agencies. Access pre-vetted engineers ready to ship on day one with zero upfront search fees.',
        impact: '72 Hours avg. time-to-hire vs 45 days industry average',
        points: [
          'Pre-vetted senior backend, frontend, full-stack, and mobile engineers',
          'Transparent pay-per-unlock or subscription tokens',
          'Instant candidate interview replays and code rubrics',
        ],
        href: '/solutions#startups',
      },
      {
        id: 'global-teams',
        audience: 'For Global Remote Enterprises',
        title: 'Access Africa’s Fastest-Growing Technical Hubs Compliantly',
        description:
          'Tap into elite software talent across Nigeria, Kenya, Ghana, and South Africa with guaranteed timezone alignment (WAT/CAT/EAT) and verified credentials.',
        impact: 'Over 10,000+ vetted technical professionals across Africa',
        points: [
          'Pre-screened remote eligibility and proof-of-work validation',
          'Overlapping working hours with UK, EU, and US East Coast',
          'Comprehensive NDPA & GDPR compliant data processing',
        ],
        href: '/solutions#global-teams',
      },
      {
        id: 'engineering',
        audience: 'For CTOs & Engineering Leaders',
        title: 'Zero Low-Signal Screening Calls for Your Engineers',
        description:
          'Protect your engineering team’s focus time. Review verified code portfolios, system architecture scores, and recorded technical screens before scheduling final rounds.',
        impact: '94.6% Final round candidate interview pass rate',
        points: [
          'Objective scoring on technical depth and architecture',
          'Calibrated STAR rubrics for systems design and problem-solving',
          'Human-in-the-loop: your team makes 100% of final hiring choices',
        ],
        href: '/solutions#engineering',
      },
    ],
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
    linkLabel: 'Browse open roles on Sync730',
    linkHref: '/find-work',
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
    linkText: 'Explore open roles on Sync730 →',
    linkHref: '/find-work',
    items: [
      {
        question: 'Is Sync730 free?',
        answer:
          'Yes, for candidates. Creating a profile, browsing roles and using SyncFlow cost nothing.',
      },
      {
        question: 'How does Sync730 verify roles?',
        answer:
          "Every role is confirmed real, open, and accepting applicants from Africa before it is listed on the platform. Pay and hiring decisions are the employer's.",
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
      { label: 'Products', href: '/products' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Hiring', href: '/hiring' },
    ],
    syncFlowLabel: 'SyncFlow',
    signInLabel: 'Sign in',
    signInHref: '/login',
    createProfileLabel: 'Start Hiring',
    createProfileHref: '/hiring',
  },
  footer: {
    address: 'Abuja, Nigeria',
    tagline:
      'Autonomous AI recruitment solutions for high-growth engineering teams. Sourcing, vetting, and matching top technical talent.',
    columns: {
      explore: {
        title: 'Platform',
        links: [
          { label: 'Find Work', href: '/find-work' },
          { label: 'Products', href: '/products' },
          { label: 'Solutions', href: '/solutions' },
          { label: 'Hiring', href: '/hiring' },
        ],
      },
      products: {
        title: 'Products',
        links: [
          { label: 'AI Sourcing Engine', href: '/products#sourcing' },
          { label: 'AI Video Interviewer', href: '/products#interview' },
          { label: 'SyncFlow ATS', href: '/products#syncflow' },
          { label: 'Direct Talent Chat', href: '/products#chat' },
          { label: 'Resume Studio', href: '/dashboard/resume' },
        ],
      },
      solutions: {
        title: 'Solutions',
        links: [
          { label: 'For Startups', href: '/solutions#startups' },
          { label: 'For Global Teams', href: '/solutions#global-teams' },
          { label: 'Technical Hiring', href: '/solutions#engineering' },
          { label: 'African Tech Talent', href: '/solutions#africa' },
        ],
      },
      hiring: {
        title: 'Hiring',
        links: [
          { label: 'Post a Role', href: '/hiring' },
          { label: 'Vetted Talent Pool', href: '/console/talent' },
          { label: 'Recruiter Console', href: '/console' },
          { label: 'Pricing & Plans', href: '/hiring#pricing' },
        ],
      },
      company: {
        title: 'Company',
        links: [
          { label: 'About Us', href: '/why-we-built-this' },
          { label: 'Contact', href: '/contact' },
          { label: 'Employer Guide', href: '/employer-guide' },
        ],
      },
      legal: {
        title: 'Legal & Compliance',
        links: [
          { label: 'Privacy (NDPA)', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
          { label: 'AI Scoring Transparency', href: '/scoring-methodology' },
          { label: 'Data Processing', href: '/data-processing' },
        ],
      },
    },
    smallPrint:
      'AI-assisted technical evaluations with human-in-the-loop decision autonomy.',
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
