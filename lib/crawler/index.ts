import { JobSource, LocationTier, RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter } from './types';
import { scaleArmyAdapter } from './adapters/scalearmy';
import { bruntworkAdapter } from './adapters/bruntwork';
import { jobbermanAdapter } from './adapters/jobberman';
import { freehireAdapter } from './adapters/freehire';
import { companyDirectAdapter } from './adapters/company-direct';
import { remotiveAdapter } from './adapters/remotive';
import { arbeitnowAdapter } from './adapters/arbeitnow';

export * from './types';
export {
  scaleArmyAdapter,
  bruntworkAdapter,
  jobbermanAdapter,
  freehireAdapter,
  companyDirectAdapter,
  remotiveAdapter,
  arbeitnowAdapter,
};

export const CRAWLER_ADAPTERS: CrawlerAdapter[] = [
  scaleArmyAdapter,
  bruntworkAdapter,
  jobbermanAdapter,
  freehireAdapter,
  companyDirectAdapter,
  remotiveAdapter,
  arbeitnowAdapter,
];

export const ADAPTERS_MAP: Record<JobSource, CrawlerAdapter> = {
  scalearmy: scaleArmyAdapter,
  bruntwork: bruntworkAdapter,
  jobberman: jobbermanAdapter,
  freehire: freehireAdapter,
  company_direct: companyDirectAdapter,
  remotive: remotiveAdapter,
  arbeitnow: arbeitnowAdapter,
};

export interface CrawlResult {
  jobs: Omit<RemoteJob, 'id'>[];
  sourceCounts: Record<JobSource, number>;
  locationStats: Record<LocationTier, number>;
  crawledAt: string;
}

export async function crawlSources(options?: {
  source?: JobSource | 'all';
}): Promise<CrawlResult> {
  const targetAdapters =
    options?.source && options.source !== 'all'
      ? [ADAPTERS_MAP[options.source]].filter(Boolean)
      : CRAWLER_ADAPTERS;

  const results = await Promise.allSettled(
    targetAdapters.map(async (adapter) => {
      try {
        const jobs = await adapter.crawl();
        return { source: adapter.id, jobs };
      } catch (err) {
        console.error(`Adapter ${adapter.id} encountered an error:`, err);
        return { source: adapter.id, jobs: [] };
      }
    })
  );

  const allJobs: Omit<RemoteJob, 'id'>[] = [];
  const sourceCounts: Record<JobSource, number> = {
    scalearmy: 0,
    bruntwork: 0,
    jobberman: 0,
    freehire: 0,
    company_direct: 0,
    remotive: 0,
    arbeitnow: 0,
  };

  const locationStats: Record<LocationTier, number> = {
    'Africa Only': 0,
    'EMEA': 0,
    'Worldwide': 0,
  };

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { source, jobs } = r.value;
      sourceCounts[source] = jobs.length;
      allJobs.push(...jobs);
    }
  }

  // Deduplicate by external_id
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    if (seen.has(job.external_id)) return false;
    seen.add(job.external_id);
    return true;
  });

  for (const job of uniqueJobs) {
    if (locationStats[job.location_tier] !== undefined) {
      locationStats[job.location_tier]++;
    }
  }

  return {
    jobs: uniqueJobs,
    sourceCounts,
    locationStats,
    crawledAt: new Date().toISOString(),
  };
}
