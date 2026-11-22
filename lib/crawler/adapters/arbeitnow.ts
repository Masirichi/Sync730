import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const ARBEITNOW_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

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
