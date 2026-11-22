import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const SCALEARMY_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

export const scaleArmyAdapter: CrawlerAdapter = {
  id: 'scalearmy',
  name: 'Scale Army Careers',
  website: 'https://careers.scalearmy.com',
  description: 'Remote talent placement connecting skilled African, EMEA & global professionals with high-growth US companies.',
  badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  async crawl() {
    try {
      const res = await fetch('https://careers.scalearmy.com', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/href="(https:\/\/apply\.scalearmycareers\.com\/applications\/[a-zA-Z0-9\-_]+)"/);
        if (matches && matches[1]) {
          return SCALEARMY_SEED_JOBS.map((j, idx) => ({
            ...j,
            url: idx === 0 ? matches[1] : j.url,
          }));
        }
      }
    } catch (err) {
      console.warn('ScaleArmy live fetch fallback:', err);
    }

    return SCALEARMY_SEED_JOBS;
  },
};
