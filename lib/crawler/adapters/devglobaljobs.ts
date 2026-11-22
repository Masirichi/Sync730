import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const DEVGLOBAL_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

export const devGlobalJobsAdapter: CrawlerAdapter = {
  id: 'devglobaljobs',
  name: 'DevGlobalJobs API',
  website: 'https://devitjobs.uk',
  description: 'International developer job feed curating transparent tech stacks, remote work rules, and engineering roles.',
  badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://devitjobs.uk/api/jobsLight', {
        headers: {
          'User-Agent': 'Sync730-JobCrawler/1.0 (contact@sync730.com)',
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const jobsList = await res.json();
        if (Array.isArray(jobsList)) {
          const remoteOnly = jobsList.filter(
            (item: any) =>
              item &&
              (item.workplaceType === 'Remote' ||
                (item.location && item.location.toLowerCase().includes('remote')) ||
                item.remote)
          );

          for (const j of remoteOnly.slice(0, 30)) {
            const locStr = j.location || 'Worldwide';
            const tier = resolveLocationTier(locStr);
            const category = normalizeJobCategory(
              (j.technologies && j.technologies.join(' ')) || '',
              j.name || '',
              j.description || ''
            );

            const jobUrl = j.jobUrl || `https://devitjobs.uk/jobs/${j._id}`;
            const cleanDesc = `${j.name || 'Software Engineer'} role at ${j.company || 'Tech Company'}. Required technologies: ${(j.technologies || []).slice(0, 5).join(', ')}.`;

            fetchedJobs.push({
              external_id: `devglobal-${j._id || Math.random().toString(36).substring(7)}`,
              title: j.name || 'Software Engineer',
              company: j.company || 'Tech Partner',
              company_name: j.company || 'Tech Partner',
              company_logo: j.companyLogo || null,
              description: cleanDesc,
              category,
              job_type: 'Full-time',
              candidate_required_location: locStr || tier,
              location_tier: tier,
              salary: j.salary || 'Competitive',
              url: jobUrl,
              apply_url: jobUrl,
              source_url: jobUrl,
              source_name: 'DevGlobalJobs',
              source: 'devglobaljobs',
              employer_type: 'direct',
              tags: Array.isArray(j.technologies) ? j.technologies : [category, 'Remote'],
              published_at: j.actualPublishDate || new Date().toISOString(),
              posted_at: j.actualPublishDate || new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn('DevGlobalJobs crawl notice:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...DEVGLOBAL_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return DEVGLOBAL_SEED_JOBS;
  },
};
