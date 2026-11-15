// src/content/home.ts
// Central source of truth for all Sync730 homepage copy and structured marketing strings.
// Voice: direct, warm, short sentences. Never use "empowering", "age of AI", "signal", "seamless", "cutting-edge", "unlock".

export const HOME_CONTENT = {
  meta: {
    title: 'Sync730: Real remote jobs, open to Africa',
    description:
      "Every role on Sync730 is confirmed real and open to people in Africa. No ghost jobs. No 'US only' surprises. Free for candidates.",
  },
  hero: {
    eyebrow: 'WE BELIEVE TALENT IS EVERYWHERE',
    h1: 'Talent is everywhere. Real opportunity should be too.',
    sub: "You've sent applications into the void. You've found \"worldwide remote\" jobs that weren't. We built Sync730 so every role you see is real, open to you in Africa, and one click from your pipeline.",
    ctaPrimary: "I'm looking for work",
    ctaPrimaryHref: '/find-work',
    ctaSecondary: "I'm hiring in Africa",
    ctaSecondaryHref: '/#for-recruiters',
    proofLine:
      'Free for candidates · Humans make every hiring decision · Built for how Africa hires',
    proofItems: [
      'Free for candidates',
      'Humans make every hiring decision',
      'Built for how Africa hires',
    ],
    sampleBadge: 'Sample',
  },
  liveStats: {
    label: 'LIVE ON SYNC730',
    rolesSuffix:
      'new roles in the last 24 hours, each checked before you saw it',
    talentsSuffix:
      'professionals already tracking their search in SyncFlow',
    partnersSuffix:
      'companies hiring from Africa right now',
    linkText: 'Find Work & Active Roles',
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
  forCandidates: {
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
    reassurance:
      'Video interviews are short and work on your phone. Only the hiring team sees your recording.',
    ctaPrimary: 'Create your free profile',
    ctaPrimaryHref: '/register',
    ctaSecondary: 'See roles open to Africa',
    ctaSecondaryHref: '/find-work',
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
  // Part B sections
  forRecruiters: {
    eyebrow: 'FOR RECRUITERS',
    h2: 'Meet the person behind the résumé.',
    subtitle:
      'Sync730 interviews every candidate on video and gives your team scored, evidence-backed reports, so you see more than a CV.',
    ctaText: 'Book a demo',
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
