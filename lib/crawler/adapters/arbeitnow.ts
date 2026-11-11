import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const ARBEITNOW_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'arbeitnow-eu-fullstack-01',
    title: 'Senior TypeScript & Distributed Systems Architect',
    company: 'TechSphere Europe',
    company_logo: null,
    description: 'Design zero-downtime event streaming services with Node.js, Kafka, and Redis. Flexible European & EMEA remote.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'EMEA (Remote)',
    location_tier: 'EMEA',
    salary: '€85,000 - €110,000 EUR',
    url: 'https://www.arbeitnow.com/jobs/companies/techsphere/senior-typescript-architect-01',
    source: 'arbeitnow',
    tags: ['TypeScript', 'Kafka', 'Redis', 'EMEA', 'Arbeitnow'],
    published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    external_id: 'arbeitnow-devops-cloud-02',
    title: 'Kubernetes Platform Engineer & SRE',
    company: 'CloudNative Solutions',
    company_logo: null,
    description: 'Own GitOps pipelines with ArgoCD, manage multi-tenant Kubernetes clusters, and optimize cloud infrastructure costs.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide',
    location_tier: 'Worldwide',
    salary: '$90,000 - $125,000 USD',
    url: 'https://www.arbeitnow.com/jobs/companies/cloudnative/kubernetes-platform-engineer-02',
    source: 'arbeitnow',
    tags: ['Kubernetes', 'ArgoCD', 'Terraform', 'Arbeitnow'],
    published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

export const arbeitnowAdapter: CrawlerAdapter = {
  id: 'arbeitnow',
  name: 'Arbeitnow Remote API',
  website: 'https://www.arbeitnow.com',
  description: 'Global remote job board focusing on international engineering, remote tech hubs, and visa sponsorship opportunities.',
  badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const data = await res.json();
        const rawJobs = data.data || [];

        for (const j of rawJobs) {
          if (!j.remote) continue;
          const locCombined = `${j.location || ''} ${j.title || ''}`;
          const tier = resolveLocationTier(locCombined);
          const category = normalizeJobCategory(j.category || '', j.title || '', j.description || '');

          fetchedJobs.push({
            external_id: `arbeitnow-${j.slug || Math.random().toString(36).substring(7)}`,
            title: j.title || 'Remote Specialist',
            company: j.company_name || 'Tech Partner',
            company_logo: null,
            description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            category,
            job_type: 'full-time',
            candidate_required_location: j.location || tier,
            location_tier: tier,
            salary: 'Competitive',
            url: j.url || 'https://www.arbeitnow.com',
            source: 'arbeitnow',
            tags: j.tags || [category, 'Remote', tier],
            published_at: new Date(j.created_at * 1000 || Date.now()).toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Arbeitnow crawl fallback:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...ARBEITNOW_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return ARBEITNOW_SEED_JOBS;
  },
};
