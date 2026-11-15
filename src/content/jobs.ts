// src/content/jobs.ts
// Structured content file for public jobs and find-work pages

export const JOBS_PAGE_COPY = {
  hiringDesk: 'Live hiring desk',
  formatUpdated: (relativeTime: string) => `Updated ${relativeTime}`,
  title: 'Active Remote and Onsite jobs, with Fit for You.',
  subline: 'Real, open roles eligible for people living in Africa.',
  searchPlaceholder: 'Search role, tech stack, keyword…',
  searchButton: 'Search roles',
  missingSalaryText: 'Salary not disclosed',
  allRolesLabel: 'All roles',
  remoteLabel: 'Remote',
  hybridLabel: 'Hybrid',
  onsiteLabel: 'Onsite',
  employerBand: {
    heading: 'Are you a tech founder or hiring manager?',
    subline: 'Post open roles on Sync730. Reach verified candidates across Africa who hire on ability, not address.',
    postRoleCta: 'Post a role',
    guideCta: 'Employer guide',
  },
} as const;

export const BENEFIT_STRIP_CONTENT = [
  {
    id: 'roles_verified',
    number: '01',
    title: 'Roles verified',
    description: 'We verify that every role is real, open, and eligible for people in Africa.',
  },
  {
    id: 'pay_upfront',
    number: '02',
    title: 'Pay shown up front',
    description: 'Pay ranges displayed clearly with ₦ and $ views whenever disclosed.',
  },
  {
    id: 'syncflow_tracker',
    number: '03',
    title: 'One place for your job hunt',
    description: 'Save roles and track your applications in your private SyncFlow board.',
  },
] as const;

export const ROLE_VERIFICATION_TOOLTIPS = {
  role_verified: {
    label: 'Role verified',
    tooltip: 'Verified as a real, open role eligible for candidates living in Africa.',
  },
  agency_listing: {
    label: 'Agency listing',
    tooltip: 'Listed by a recruiting agency on behalf of the client company.',
  },
} as const;
