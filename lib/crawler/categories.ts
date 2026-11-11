export type JobCategory =
  | 'Software & Engineering'
  | 'Product & Design'
  | 'Data & AI'
  | 'DevOps & Cloud'
  | 'Sales & Marketing'
  | 'Customer Support & Ops'
  | 'Finance & Accounting';

export interface CategoryMetadata {
  id: JobCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
}

export const JOB_CATEGORIES: JobCategory[] = [
  'Software & Engineering',
  'Product & Design',
  'Data & AI',
  'DevOps & Cloud',
  'Sales & Marketing',
  'Customer Support & Ops',
  'Finance & Accounting',
];

export const JOB_CATEGORIES_META: Record<JobCategory, CategoryMetadata> = {
  'Software & Engineering': {
    id: 'Software & Engineering',
    label: 'Software & Engineering',
    shortLabel: 'Engineering',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    description: 'Frontend, Backend, Full Stack, Mobile & Systems Architecture',
  },
  'Product & Design': {
    id: 'Product & Design',
    label: 'Product & Design',
    shortLabel: 'Product & Design',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
    description: 'UI/UX Design, Product Management, Design Systems & Research',
  },
  'Data & AI': {
    id: 'Data & AI',
    label: 'Data & AI',
    shortLabel: 'Data & AI',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    description: 'AI Automation, Machine Learning, Data Engineering & Analytics',
  },
  'DevOps & Cloud': {
    id: 'DevOps & Cloud',
    label: 'DevOps & Cloud',
    shortLabel: 'DevOps & Cloud',
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
    description: 'Cloud Infrastructure, Kubernetes, SRE, Linux & Cybersecurity',
  },
  'Sales & Marketing': {
    id: 'Sales & Marketing',
    label: 'Sales & Marketing',
    shortLabel: 'Sales & Marketing',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    description: 'Growth Marketing, SDR/BDR, Enterprise Sales & Partnerships',
  },
  'Customer Support & Ops': {
    id: 'Customer Support & Ops',
    label: 'Customer Support & Ops',
    shortLabel: 'Support & Ops',
    badgeClass: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
    description: 'Technical Customer Success, Virtual Assistance & Operations',
  },
  'Finance & Accounting': {
    id: 'Finance & Accounting',
    label: 'Finance & Accounting',
    shortLabel: 'Finance & Ops',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    description: 'Financial Analysis, Accounting, Payroll, Audit & Compliance',
  },
};

export function normalizeJobCategory(
  rawCategory = '',
  title = '',
  description = ''
): JobCategory {
  const t = title.toLowerCase();
  const c = rawCategory.toLowerCase();
  const d = description.toLowerCase();
  const text = `${c} ${t} ${d}`;

  // 1. DevOps & Cloud / Cybersecurity
  if (
    t.includes('devops') ||
    t.includes('sre') ||
    t.includes('site reliability') ||
    t.includes('kubernetes') ||
    t.includes('infrastructure') ||
    t.includes('sysadmin') ||
    t.includes('linux') ||
    t.includes('security') ||
    t.includes('cloud') ||
    c.includes('devops') ||
    c.includes('sysadmin')
  ) {
    return 'DevOps & Cloud';
  }

  // 2. Data & AI / Analytics
  if (
    t.includes('data ') ||
    t.includes('data analyst') ||
    t.includes('data engineer') ||
    t.includes('data science') ||
    t.includes('machine learning') ||
    t.includes('ai ') ||
    t.includes('ai automation') ||
    t.includes('llm') ||
    t.includes('analytics') ||
    t.includes('bigquery') ||
    t.includes('business intelligence') ||
    t.includes('powerbi') ||
    c.includes('data') ||
    c.includes('ai')
  ) {
    return 'Data & AI';
  }

  // 3. Finance & Accounting
  if (
    t.includes('finance') ||
    t.includes('financial') ||
    t.includes('accounting') ||
    t.includes('accountant') ||
    t.includes('reconciliation') ||
    t.includes('bookkeeper') ||
    t.includes('payroll') ||
    c.includes('finance')
  ) {
    return 'Finance & Accounting';
  }

  // 4. Sales & Marketing
  if (
    t.includes('sales') ||
    t.includes('marketing') ||
    t.includes('growth') ||
    t.includes('sdr') ||
    t.includes('bdr') ||
    t.includes('account executive') ||
    t.includes('outbound') ||
    t.includes('partnerships') ||
    t.includes('copywriter') ||
    t.includes('seo') ||
    t.includes('acquisition') ||
    c.includes('sales') ||
    c.includes('marketing')
  ) {
    return 'Sales & Marketing';
  }

  // 5. Customer Support & Operations
  if (
    t.includes('customer success') ||
    t.includes('customer support') ||
    t.includes('support specialist') ||
    t.includes('virtual assistant') ||
    t.includes('operations') ||
    t.includes('assistant') ||
    t.includes('executive assistant') ||
    t.includes('chat support') ||
    c.includes('customer support')
  ) {
    return 'Customer Support & Ops';
  }

  // 6. Product & Design (Designers, UI/UX, Product Managers)
  if (
    t.includes('designer') ||
    t.includes('ui/ux') ||
    t.includes('ux ') ||
    t.includes('ui ') ||
    t.includes('product manager') ||
    t.includes('product management') ||
    t.includes('product design') ||
    t.includes('product lead') ||
    t.includes('product owner') ||
    t.includes('figma') ||
    c.includes('design') ||
    c.includes('product')
  ) {
    return 'Product & Design';
  }

  // 7. Software & Engineering
  if (
    t.includes('developer') ||
    t.includes('engineer') ||
    t.includes('architect') ||
    t.includes('frontend') ||
    t.includes('backend') ||
    t.includes('full stack') ||
    t.includes('fullstack') ||
    t.includes('software') ||
    t.includes('react') ||
    t.includes('golang') ||
    t.includes('node') ||
    t.includes('mobile') ||
    t.includes('flutter') ||
    t.includes('qa') ||
    c.includes('software') ||
    c.includes('tech')
  ) {
    return 'Software & Engineering';
  }

  return 'Software & Engineering';
}
