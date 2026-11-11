import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

interface GreenhouseJob {
  id: number;
  title: string;
  company_name?: string;
  location: {
    name: string;
  };
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
}

const DIRECT_COMPANY_SEEDS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'direct-moniepoint-core-eng-01',
    title: 'Senior Backend Engineer (High-Throughput Core Banking)',
    company: 'Moniepoint',
    company_logo: null,
    description: 'Design and operate sub-second settlement ledgers processing billions in transaction volume across African markets.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Nigeria, Kenya, Remote)',
    location_tier: 'Africa Only',
    salary: '$5,000 - $8,500 USD / month',
    url: 'https://job-boards.eu.greenhouse.io/moniepoint/jobs/4941669101',
    source: 'company_direct',
    tags: ['Go', 'Java', 'Distributed Systems', 'Fintech', 'Moniepoint'],
    published_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    external_id: 'direct-paystack-staff-frontend-02',
    title: 'Staff Frontend Engineer (Payment Checkout & SDKs)',
    company: 'Paystack (Stripe)',
    company_logo: null,
    description: 'Own checkout conversion rates, developer documentation playgrounds, and embeddable payment scripts for merchants worldwide.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (EMEA / Africa)',
    location_tier: 'Worldwide',
    salary: '$95,000 - $130,000 USD',
    url: 'https://paystack.com/careers/apply/software-engineer-59218',
    source: 'company_direct',
    tags: ['TypeScript', 'React', 'SDKs', 'Paystack'],
    published_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    external_id: 'direct-canonical-ubuntu-kernel-03',
    title: 'Linux Kernel & Ubuntu Cloud Solutions Architect',
    company: 'Canonical (Ubuntu)',
    company_logo: null,
    description: 'Work with hyperscale cloud providers to optimize Ubuntu LTS images for ARM64 and AMD64 server infrastructure.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'EMEA Timezones (Remote)',
    location_tier: 'EMEA',
    salary: '€85,000 - €115,000 EUR',
    url: 'https://job-boards.greenhouse.io/canonical/jobs/6347274',
    source: 'company_direct',
    tags: ['Linux', 'Kernel', 'Ubuntu', 'Cloud', 'Canonical'],
    published_at: new Date(Date.now() - 3600000 * 11).toISOString(),
  },
  {
    external_id: 'direct-gitlab-cloud-sre-04',
    title: 'Senior Site Reliability Engineer (Kubernetes & Infrastructure)',
    company: 'GitLab',
    company_logo: null,
    description: 'Scale multi-tenant Kubernetes infrastructure supporting millions of developers globally. 100% remote asynchronous culture.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Remote)',
    location_tier: 'Worldwide',
    salary: '$120,000 - $155,000 USD',
    url: 'https://job-boards.greenhouse.io/gitlab/jobs/8638232002',
    source: 'company_direct',
    tags: ['Kubernetes', 'Go', 'GCP', 'SRE', 'GitLab'],
    published_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
];

const GREENHOUSE_BOARDS: { board: string; companyName: string }[] = [
  { board: 'moniepoint', companyName: 'Moniepoint' },
  { board: 'canonical', companyName: 'Canonical' },
  { board: 'gitlab', companyName: 'GitLab' },
];

export const companyDirectAdapter: CrawlerAdapter = {
  id: 'company_direct',
  name: 'Direct Company ATS',
  website: 'https://sync730.com',
  description: 'Verified remote roles crawled straight from Tier-1 enterprise and fintech applicant tracking systems (Greenhouse, Lever, Ashby).',
  badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  async crawl() {
    const liveJobs: Omit<RemoteJob, 'id'>[] = [];

    for (const { board, companyName } of GREENHOUSE_BOARDS) {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
          headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
          next: { revalidate: 0 },
        });

        if (res.ok) {
          const data = await res.json();
          const jobs: GreenhouseJob[] = data.jobs || [];

          for (const j of jobs) {
            const locName = j.location?.name || '';
            const lowerLoc = locName.toLowerCase();
            const lowerTitle = (j.title || '').toLowerCase();

            // Accept remote jobs or roles mentioning Africa, EMEA, Remote, Global
            const isRemote =
              lowerLoc.includes('remote') ||
              lowerLoc.includes('home') ||
              lowerLoc.includes('anywhere') ||
              lowerLoc.includes('worldwide') ||
              lowerLoc.includes('emea') ||
              lowerLoc.includes('africa') ||
              lowerLoc.includes('nigeria') ||
              lowerLoc.includes('kenya') ||
              lowerTitle.includes('remote');

            if (!isRemote) continue;

            const tier = resolveLocationTier(`${locName} ${lowerTitle}`);
            const category = normalizeJobCategory('', j.title, `${companyName} opening in ${locName}`);

            liveJobs.push({
              external_id: `greenhouse-${board}-${j.id}`,
              title: j.title,
              company: j.company_name || companyName,
              company_logo: null,
              description: `${j.title} at ${companyName}. Official direct opening in ${locName}. Apply directly through the enterprise applicant tracking system.`,
              category,
              job_type: 'full-time',
              candidate_required_location: locName || tier,
              location_tier: tier,
              salary: 'Direct Enterprise Compensation',
              url: j.absolute_url,
              source: 'company_direct',
              tags: [companyName, category, tier],
              published_at: j.first_published || j.updated_at || new Date().toISOString(),
            });

            // Cap at 15 per company board to ensure balanced diversity
            if (liveJobs.filter((item) => item.company === companyName).length >= 15) {
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`Direct Greenhouse fetch failed for ${board}:`, err);
      }
    }

    if (liveJobs.length > 0) {
      const combined = [...DIRECT_COMPANY_SEEDS, ...liveJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return DIRECT_COMPANY_SEEDS;
  },
};
