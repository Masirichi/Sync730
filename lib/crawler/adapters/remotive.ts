import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';

export const remotiveAdapter: CrawlerAdapter = {
  id: 'remotive',
  name: 'Remotive API',
  website: 'https://remotive.com',
  description: 'Hand-screened active remote positions across top software engineering, DevOps, design, and product organizations.',
  badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
        headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const data = await res.json();
        const rawJobs = data.jobs || [];

        for (const j of rawJobs) {
          const reqLoc = j.candidate_required_location || '';
          const tier = resolveLocationTier(reqLoc);
          const category = normalizeJobCategory(j.category || '', j.title || '', j.description || '');

          fetchedJobs.push({
            external_id: `remotive-${j.id}`,
            title: j.title || 'Remote Opportunity',
            company: j.company_name || 'Independent',
            company_logo: j.company_logo || null,
            description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            category,
            job_type: j.job_type || 'full-time',
            candidate_required_location: reqLoc || tier,
            location_tier: tier,
            salary: j.salary || 'Competitive',
            url: j.url || 'https://remotive.com',
            source: 'remotive',
            tags: j.tags || [category, 'Remote'],
            published_at: j.publication_date || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Remotive crawl fallback:', err);
    }

    if (fetchedJobs.length > 0) {
      const remotiveSeeds = SEED_REMOTE_JOBS.filter((j) => j.source === 'remotive');
      const combined = [...remotiveSeeds, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return SEED_REMOTE_JOBS.filter((j) => j.source === 'remotive');
  },
};
