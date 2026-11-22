import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const JOBBERMAN_REMOTE_JOBS: Omit<RemoteJob, 'id'>[] = [];

export const jobbermanAdapter: CrawlerAdapter = {
  id: 'jobberman',
  name: 'Jobberman Remote',
  website: 'https://www.jobberman.com/jobs/remote',
  description: "West & Sub-Saharan Africa's premier career network with dedicated verified remote & hybrid job listings.",
  badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  async crawl() {
    try {
      const res = await fetch('https://www.jobberman.com/jobs/remote', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/https:\/\/www\.jobberman\.com\/listings\/[a-zA-Z0-9\-_]+/g);
        if (matches && matches.length > 0) {
          const uniqueLinks = Array.from(new Set(matches));
          return JOBBERMAN_REMOTE_JOBS.map((j, idx) => ({
            ...j,
            url: uniqueLinks[idx] || j.url,
            category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
          }));
        }
      }
    } catch (err) {
      console.warn('Jobberman crawl fallback:', err);
    }

    return JOBBERMAN_REMOTE_JOBS.map((j) => ({
      ...j,
      category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
    }));
  },
};
