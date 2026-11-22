import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter } from '../types';
import { normalizeJobCategory } from '../categories';

const BRUNTWORK_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

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
