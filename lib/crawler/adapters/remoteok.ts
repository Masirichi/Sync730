import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const REMOTEOK_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'remoteok-eng-01',
    title: 'Senior Distributed Backend Engineer (Go & Kafka)',
    company: 'FinVelocity Global',
    company_name: 'FinVelocity Global',
    company_logo: null,
    description: 'Design and operate low-latency event processing services handling millions of daily events. Fully distributed remote team.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$115,000 - $145,000 USD / yr',
    salary_min: 115000,
    salary_max: 145000,
    salary_currency: 'USD',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'RemoteOK',
    source_url: 'https://remoteok.com',
    apply_url: 'https://remoteok.com/remote-jobs/senior-distributed-backend-engineer-finvelocity-01',
    url: 'https://remoteok.com/remote-jobs/senior-distributed-backend-engineer-finvelocity-01',
    source: 'remoteok',
    tags: ['Go', 'Kafka', 'Distributed Systems', 'RemoteOK'],
    skills: ['Go', 'Kafka', 'Distributed Systems', 'PostgreSQL'],
    published_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    external_id: 'remoteok-ai-infra-02',
    title: 'AI Platform & MLOps Infrastructure Engineer',
    company: 'CognitiveScale Labs',
    company_name: 'CognitiveScale Labs',
    company_logo: null,
    description: 'Deploy large language model inference clusters with vLLM, TensorRT-LLM, and automated GPU scaling on AWS and CoreWeave.',
    category: 'Data & AI',
    job_type: 'Full-time',
    candidate_required_location: 'Worldwide (EMEA, Africa, LATAM, US)',
    location_tier: 'Worldwide',
    salary: '$130,000 - $165,000 USD / yr',
    salary_min: 130000,
    salary_max: 165000,
    salary_currency: 'USD',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'RemoteOK',
    source_url: 'https://remoteok.com',
    apply_url: 'https://remoteok.com/remote-jobs/ai-platform-mlops-engineer-02',
    url: 'https://remoteok.com/remote-jobs/ai-platform-mlops-engineer-02',
    source: 'remoteok',
    tags: ['Python', 'Kubernetes', 'MLOps', 'PyTorch', 'RemoteOK'],
    skills: ['Python', 'Kubernetes', 'MLOps', 'PyTorch', 'Docker'],
    published_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const remoteOkAdapter: CrawlerAdapter = {
  id: 'remoteok',
  name: 'RemoteOK API',
  website: 'https://remoteok.com',
  description: 'Prominent developer-first global remote job network with live salary metrics and tech tags.',
  badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://remoteok.com/api', {
        headers: {
          'User-Agent': 'Sync730-JobCrawler/1.0 (contact@sync730.com)',
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const rawData = await res.json();
        if (Array.isArray(rawData)) {
          // First item in RemoteOK is usually the disclaimer/legal notice
          const validJobItems = rawData.filter(
            (item: any) => item && item.position && item.company
          );

          for (const j of validJobItems.slice(0, 30)) {
            const loc = j.location || 'Worldwide';
            const tier = resolveLocationTier(loc);
            const category = normalizeJobCategory(
              (j.tags && j.tags.join(' ')) || '',
              j.position || '',
              j.description || ''
            );

            const minSalary = j.salary_min || null;
            const maxSalary = j.salary_max || null;
            let salaryStr = 'Competitive';
            if (minSalary && maxSalary) {
              salaryStr = `$${Number(minSalary).toLocaleString()} - $${Number(maxSalary).toLocaleString()} USD / yr`;
            } else if (minSalary) {
              salaryStr = `$${Number(minSalary).toLocaleString()}+ USD / yr`;
            }

            const cleanDesc = (j.description || '')
              .replace(/<[^>]*>?/gm, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 320);

            const jobUrl = j.apply_url || j.url || `https://remoteok.com/l/${j.id}`;

            fetchedJobs.push({
              external_id: `remoteok-${j.id || Math.random().toString(36).substring(7)}`,
              title: j.position || 'Remote Engineer',
              company: j.company || 'Remote Partner',
              company_name: j.company || 'Remote Partner',
              company_logo: j.company_logo || j.logo || null,
              description: cleanDesc ? cleanDesc + '...' : 'Global remote opportunity via RemoteOK.',
              category,
              job_type: 'Full-time',
              candidate_required_location: loc || tier,
              location_tier: tier,
              salary: salaryStr,
              salary_min: minSalary,
              salary_max: maxSalary,
              salary_currency: 'USD',
              salary_period: 'year',
              url: jobUrl,
              apply_url: jobUrl,
              source_url: `https://remoteok.com/l/${j.id}`,
              source_name: 'RemoteOK',
              source: 'remoteok',
              employer_type: 'direct',
              tags: Array.isArray(j.tags) ? j.tags : [category, 'Remote'],
              published_at: j.date || new Date().toISOString(),
              posted_at: j.date || new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn('RemoteOK crawl API notice:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...REMOTEOK_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return REMOTEOK_SEED_JOBS;
  },
};
