import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const FREEHIRE_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

export const freehireAdapter: CrawlerAdapter = {
  id: 'freehire',
  name: 'Freehire',
  website: 'https://freehire.me',
  description: 'Open remote marketplace eliminating recruiter fees to connect global and African tech professionals directly with contract and full-time teams.',
  badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  async crawl() {
    return FREEHIRE_SEED_JOBS.map((j) => ({
      ...j,
      category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
    }));
  },
};
