import { JobSource, LocationTier, RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter } from './types';
import { scaleArmyAdapter } from './adapters/scalearmy';
import { bruntworkAdapter } from './adapters/bruntwork';
import { jobbermanAdapter } from './adapters/jobberman';
import { freehireAdapter } from './adapters/freehire';
import { companyDirectAdapter } from './adapters/company-direct';
import { remotiveAdapter } from './adapters/remotive';
import { arbeitnowAdapter } from './adapters/arbeitnow';
import { remoteOkAdapter } from './adapters/remoteok';
import { devGlobalJobsAdapter } from './adapters/devglobaljobs';
import { himalayasAdapter } from './adapters/himalayas';
import { jobicyAdapter } from './adapters/jobicy';
import { JobCategory, JOB_CATEGORIES, normalizeJobCategory } from './categories';
import { normalizeJobRecord, deduplicateJobs } from './job-utils';

export * from './types';
export * from './categories';
export * from './job-utils';
export {
  scaleArmyAdapter,
  bruntworkAdapter,
  jobbermanAdapter,
  freehireAdapter,
  companyDirectAdapter,
  remotiveAdapter,
  arbeitnowAdapter,
  remoteOkAdapter,
  devGlobalJobsAdapter,
  himalayasAdapter,
  jobicyAdapter,
};

export const CRAWLER_ADAPTERS: CrawlerAdapter[] = [
  scaleArmyAdapter,
  bruntworkAdapter,
  jobbermanAdapter,
  freehireAdapter,
  companyDirectAdapter,
  remotiveAdapter,
  arbeitnowAdapter,
  remoteOkAdapter,
  devGlobalJobsAdapter,
  himalayasAdapter,
  jobicyAdapter,
];

export const ADAPTERS_MAP: Record<JobSource, CrawlerAdapter> = {
  scalearmy: scaleArmyAdapter,
  bruntwork: bruntworkAdapter,
  jobberman: jobbermanAdapter,
  freehire: freehireAdapter,
  company_direct: companyDirectAdapter,
  remotive: remotiveAdapter,
  arbeitnow: arbeitnowAdapter,
  remoteok: remoteOkAdapter,
  devglobaljobs: devGlobalJobsAdapter,
  himalayas: himalayasAdapter,
  jobicy: jobicyAdapter,
};

export interface CrawlResult {
  jobs: Omit<RemoteJob, 'id'>[];
  sourceCounts: Record<JobSource, number>;
  categoryCounts: Record<JobCategory, number>;
  locationStats: Record<LocationTier, number>;
  crawledAt: string;
}

export async function crawlSources(options?: {
  source?: JobSource | 'all';
  category?: JobCategory | 'all';
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
    remoteok: 0,
    devglobaljobs: 0,
    himalayas: 0,
    jobicy: 0,
  };

  const categoryCounts: Record<JobCategory, number> = {
    'Software & Engineering': 0,
    'Product & Design': 0,
    'Data & AI': 0,
    'DevOps & Cloud': 0,
    'Sales & Marketing': 0,
    'Customer Support & Ops': 0,
    'Finance & Accounting': 0,
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

  // Deduplicate and normalize jobs using title + company + apply_url hash (keeping most recent)
  const normalizedList = allJobs.map((raw) => normalizeJobRecord(raw as Partial<RemoteJob>));
  const deduplicated = deduplicateJobs(normalizedList);
  const normalizedJobs: Omit<RemoteJob, 'id'>[] = [];

  for (const job of deduplicated) {
    const canonicalCategory = job.category || 'Software & Engineering';

    if (categoryCounts[canonicalCategory as JobCategory] !== undefined) {
      categoryCounts[canonicalCategory as JobCategory]++;
    }

    if (locationStats[job.location_tier] !== undefined) {
      locationStats[job.location_tier]++;
    }

    // Filter by category if explicitly requested
    if (!options?.category || options.category === 'all' || job.category === options.category) {
      normalizedJobs.push(job);
    }
  }

  return {
    jobs: normalizedJobs,
    sourceCounts,
    categoryCounts,
    locationStats,
    crawledAt: new Date().toISOString(),
  };
}
