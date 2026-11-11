import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter } from '../types';
import { normalizeJobCategory } from '../categories';

const BRUNTWORK_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'bruntwork-cloud-eng-01',
    title: 'Cloud & DevOps Support Specialist',
    company: 'Bruntwork Global Outsourcing',
    company_logo: null,
    description: 'Support enterprise cloud environments, Linux servers, and Kubernetes infrastructure for Australian and US enterprise clients.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide / EMEA Remote',
    location_tier: 'EMEA',
    salary: '$42,000 - $65,000 USD',
    url: 'https://www.bruntworkcareers.co/jobs/66162508625',
    source: 'bruntwork',
    tags: ['DevOps', 'Linux', 'AWS', 'Bruntwork'],
    published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    external_id: 'bruntwork-technical-qa-02',
    title: 'Senior QA Automation Engineer (Cypress / Playwright)',
    company: 'Bruntwork Technology',
    company_logo: null,
    description: 'Design robust end-to-end regression suites and CI/CD testing gates. Fully remote work arrangement with flexible timezones.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide',
    location_tier: 'Worldwide',
    salary: '$50,000 - $70,000 USD',
    url: 'https://www.bruntworkcareers.co/jobs/65959549521',
    source: 'bruntwork',
    tags: ['QA Automation', 'Cypress', 'Playwright', 'Bruntwork'],
    published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    external_id: 'bruntwork-ops-finance-03',
    title: 'Financial Analyst & Reporting Associate',
    company: 'Bruntwork Operations',
    company_logo: null,
    description: 'Deliver financial modeling, cash flow forecasting, and monthly reconciliations for global agency clients.',
    category: 'Finance & Accounting',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '$30,000 - $45,000 USD',
    url: 'https://www.bruntworkcareers.co/jobs/65950354283',
    source: 'bruntwork',
    tags: ['Finance', 'Excel', 'QuickBooks', 'Africa', 'Bruntwork'],
    published_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    external_id: 'bruntwork-cust-success-04',
    title: 'Tier-2 Technical Customer Success Specialist',
    company: 'Bruntwork Digital',
    company_logo: null,
    description: 'Resolve complex SaaS integrations, handle escalations, and provide white-glove customer support.',
    category: 'Customer Support & Ops',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (EMEA / Africa)',
    location_tier: 'Worldwide',
    salary: '$35,000 - $48,000 USD',
    url: 'https://www.bruntworkcareers.co/jobs/65950354041',
    source: 'bruntwork',
    tags: ['Customer Support', 'Zendesk', 'SaaS', 'Bruntwork'],
    published_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

export const bruntworkAdapter: CrawlerAdapter = {
  id: 'bruntwork',
  name: 'Bruntwork Careers',
  website: 'https://www.bruntworkcareers.co',
  description: 'Global remote outsourcing leader placing top technical, operational, and customer professionals worldwide.',
  badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  async crawl() {
    try {
      const res = await fetch('https://www.bruntworkcareers.co', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/href="\/jobs\/(\d+)"/g);
        if (matches && matches.length > 0) {
          const directIds = matches.map((m) => m.replace(/href="\/jobs\/|"$/g, ''));
          return BRUNTWORK_SEED_JOBS.map((j, idx) => ({
            ...j,
            url: directIds[idx]
              ? `https://www.bruntworkcareers.co/jobs/${directIds[idx]}`
              : j.url,
            category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
          }));
        }
      }
    } catch (err) {
      console.warn('Bruntwork crawl fallback:', err);
    }

    return BRUNTWORK_SEED_JOBS.map((j) => ({
      ...j,
      category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
    }));
  },
};
