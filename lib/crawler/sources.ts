import { JobSource } from '@/lib/supabase/types';

export interface SourceMetadata {
  id: JobSource;
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
  website: string;
}

export const JOB_SOURCES_META: Record<JobSource, SourceMetadata> = {
  scalearmy: {
    id: 'scalearmy',
    label: 'Scale Army Careers',
    shortLabel: 'Scale Army',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    description: 'High-growth US companies hiring vetted African, EMEA and global professionals.',
    website: 'https://careers.scalearmy.com',
  },
  bruntwork: {
    id: 'bruntwork',
    label: 'Bruntwork Careers',
    shortLabel: 'Bruntwork',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
    description: 'Global remote outsourcing leader for technical, ops, and finance roles.',
    website: 'https://www.bruntworkcareers.co',
  },
  jobberman: {
    id: 'jobberman',
    label: 'Jobberman Remote',
    shortLabel: 'Jobberman',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    description: 'Sub-Saharan Africa’s premier verified remote & hybrid tech portal.',
    website: 'https://www.jobberman.com/jobs/remote',
  },
  freehire: {
    id: 'freehire',
    label: 'Freehire Open Remote',
    shortLabel: 'Freehire',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
    description: 'Open remote marketplace eliminating agency fees for direct contracts.',
    website: 'https://freehire.me',
  },
  company_direct: {
    id: 'company_direct',
    label: 'Direct Company ATS',
    shortLabel: 'Direct Company',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    description: 'Direct enterprise openings from Moniepoint, Canonical, Paystack & GitLab.',
    website: 'https://sync730.com',
  },
  remotive: {
    id: 'remotive',
    label: 'Remotive Feed',
    shortLabel: 'Remotive',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    description: 'Curated remote tech listings vetted for global and EMEA talent.',
    website: 'https://remotive.com',
  },
  arbeitnow: {
    id: 'arbeitnow',
    label: 'Arbeitnow Remote',
    shortLabel: 'Arbeitnow',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
    description: 'International tech and engineering remote job aggregator.',
    website: 'https://www.arbeitnow.com',
  },
};
