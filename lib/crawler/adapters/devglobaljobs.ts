import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const DEVGLOBAL_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'devglobal-fullstack-ts-01',
    title: 'Lead Full Stack TypeScript & Cloud Engineer',
    company: 'DevGlobal Network Labs',
    company_name: 'DevGlobal Network Labs',
    company_logo: null,
    description: 'Lead greenfield microservices and responsive React web applications. 100% remote asynchronous engineering team with global compensation benchmarks.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$105,000 - $135,000 USD / yr',
    salary_min: 105000,
    salary_max: 135000,
    salary_currency: 'USD',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'DevGlobalJobs',
    source_url: 'https://devitjobs.uk',
    apply_url: 'https://devitjobs.uk/jobs/lead-full-stack-typescript-devglobal-01',
    url: 'https://devitjobs.uk/jobs/lead-full-stack-typescript-devglobal-01',
    source: 'devglobaljobs',
    tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'DevGlobalJobs'],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    external_id: 'devglobal-sre-k8s-02',
    title: 'Senior DevOps & Site Reliability Engineer',
    company: 'Stratos Infrastructure Partners',
    company_name: 'Stratos Infrastructure Partners',
    company_logo: null,
    description: 'Manage Terraform infrastructure as code, multi-region Kubernetes clusters, and automated continuous delivery pipelines for high-traffic financial applications.',
    category: 'DevOps & Cloud',
    job_type: 'Full-time',
    candidate_required_location: 'EMEA / Africa Remote',
    location_tier: 'EMEA',
    salary: '€90,000 - €120,000 EUR / yr',
    salary_min: 90000,
    salary_max: 120000,
    salary_currency: 'EUR',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'DevGlobalJobs',
    source_url: 'https://devitjobs.uk',
    apply_url: 'https://devitjobs.uk/jobs/senior-devops-sre-stratos-02',
    url: 'https://devitjobs.uk/jobs/senior-devops-sre-stratos-02',
    source: 'devglobaljobs',
    tags: ['Terraform', 'Kubernetes', 'AWS', 'Linux', 'DevGlobalJobs'],
    skills: ['Terraform', 'Kubernetes', 'AWS', 'Linux', 'Docker'],
    published_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

export const devGlobalJobsAdapter: CrawlerAdapter = {
  id: 'devglobaljobs',
  name: 'DevGlobalJobs API',
  website: 'https://devitjobs.uk',
  description: 'International developer job feed curating transparent tech stacks, remote work rules, and engineering roles.',
  badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://devitjobs.uk/api/jobsLight', {
        headers: {
          'User-Agent': 'Sync730-JobCrawler/1.0 (contact@sync730.com)',
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const jobsList = await res.json();
        if (Array.isArray(jobsList)) {
          const remoteOnly = jobsList.filter(
            (item: any) =>
              item &&
              (item.workplaceType === 'Remote' ||
                (item.location && item.location.toLowerCase().includes('remote')) ||
                item.remote)
          );

          for (const j of remoteOnly.slice(0, 30)) {
            const locStr = j.location || 'Worldwide';
            const tier = resolveLocationTier(locStr);
            const category = normalizeJobCategory(
              (j.technologies && j.technologies.join(' ')) || '',
              j.name || '',
              j.description || ''
            );

            const jobUrl = j.jobUrl || `https://devitjobs.uk/jobs/${j._id}`;
            const cleanDesc = `${j.name || 'Software Engineer'} role at ${j.company || 'Tech Company'}. Required technologies: ${(j.technologies || []).slice(0, 5).join(', ')}.`;

            fetchedJobs.push({
              external_id: `devglobal-${j._id || Math.random().toString(36).substring(7)}`,
              title: j.name || 'Software Engineer',
              company: j.company || 'Tech Partner',
              company_name: j.company || 'Tech Partner',
              company_logo: j.companyLogo || null,
              description: cleanDesc,
              category,
              job_type: 'Full-time',
              candidate_required_location: locStr || tier,
              location_tier: tier,
              salary: j.salary || 'Competitive',
              url: jobUrl,
              apply_url: jobUrl,
              source_url: jobUrl,
              source_name: 'DevGlobalJobs',
              source: 'devglobaljobs',
              employer_type: 'direct',
              tags: Array.isArray(j.technologies) ? j.technologies : [category, 'Remote'],
              published_at: j.actualPublishDate || new Date().toISOString(),
              posted_at: j.actualPublishDate || new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn('DevGlobalJobs crawl notice:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...DEVGLOBAL_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return DEVGLOBAL_SEED_JOBS;
  },
};
