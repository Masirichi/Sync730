import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const REMOTEOK_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

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
