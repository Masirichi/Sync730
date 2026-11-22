import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';
import { extractCleanSkills } from '../job-utils';

const JOBICY_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [];

export const jobicyAdapter: CrawlerAdapter = {
  id: 'jobicy',
  name: 'Jobicy Remote API',
  website: 'https://jobicy.com',
  description: 'Global remote job board with live compensation metrics, geo-filters, and tech opportunities.',
  badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
        headers: {
          'User-Agent': 'Sync730-JobCrawler/1.0 (contact@sync730.com)',
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          for (const j of data.jobs.slice(0, 35)) {
            const locGeo = (j.jobGeo || 'Worldwide').trim();
            const tier = resolveLocationTier(locGeo);

            const lowerGeo = locGeo.toLowerCase();
            const isOpenToNigeria =
              lowerGeo.includes('worldwide') ||
              lowerGeo.includes('anywhere') ||
              lowerGeo.includes('global') ||
              lowerGeo.includes('africa') ||
              lowerGeo.includes('nigeria') ||
              lowerGeo.includes('emea') ||
              lowerGeo === '';

            const industries = Array.isArray(j.jobIndustry)
              ? j.jobIndustry.join(' ')
              : String(j.jobIndustry || '');
            const category = normalizeJobCategory(
              industries,
              j.jobTitle || '',
              j.jobExcerpt || ''
            );

            // Determine salary period
            let salaryPeriod: 'hour' | 'month' | 'year' = 'year';
            const periodStr = String(j.salaryPeriod || '').toLowerCase();
            if (periodStr.includes('hour')) {
              salaryPeriod = 'hour';
            } else if (periodStr.includes('month')) {
              salaryPeriod = 'month';
            }

            const minSal = typeof j.salaryMin === 'number' && j.salaryMin > 0 ? j.salaryMin : null;
            const maxSal = typeof j.salaryMax === 'number' && j.salaryMax > 0 ? j.salaryMax : null;
            const currency = j.salaryCurrency || 'USD';

            let salaryStr = 'Competitive';
            if (minSal && maxSal) {
              salaryStr = `$${minSal.toLocaleString()} – $${maxSal.toLocaleString()} / ${salaryPeriod}`;
            } else if (minSal) {
              salaryStr = `$${minSal.toLocaleString()}+ / ${salaryPeriod}`;
            }

            const cleanExcerpt = (j.jobExcerpt || j.jobDescription || '')
              .replace(/<[^>]*>?/gm, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 320);

            const jobType = Array.isArray(j.jobType)
              ? j.jobType[0]
              : (j.jobType || 'Full-time');

            // Extract tags and skills
            const rawTags: string[] = [];
            if (Array.isArray(j.jobIndustry)) rawTags.push(...j.jobIndustry);
            if (j.jobLevel && j.jobLevel !== 'Any') rawTags.push(j.jobLevel);
            if (locGeo) rawTags.push(locGeo);

            const cleanSkills = extractCleanSkills(
              rawTags,
              j.companyName || 'Company',
              'Jobicy'
            );

            const jobUrl = j.url || `https://jobicy.com/jobs/${j.id}`;

            fetchedJobs.push({
              external_id: `jobicy-${j.id || Math.random().toString(36).substring(7)}`,
              title: j.jobTitle || 'Remote Specialist',
              company: j.companyName || 'Global Employer',
              company_name: j.companyName || 'Global Employer',
              company_logo: j.companyLogo || null,
              description: cleanExcerpt ? cleanExcerpt + '...' : 'Remote opportunity sourced via Jobicy.',
              category,
              job_type: jobType,
              candidate_required_location: locGeo || tier,
              location_tier: tier,
              location_rule: lowerGeo.includes('africa') || lowerGeo.includes('nigeria')
                ? 'africa_only'
                : lowerGeo.includes('emea') || lowerGeo.includes('europe')
                ? 'emea'
                : 'worldwide',
              eligible_countries: isOpenToNigeria
                ? ['Worldwide', 'Nigeria', 'Remote']
                : [locGeo || 'Selected Countries'],
              open_to_nigeria: isOpenToNigeria,
              salary: salaryStr,
              salary_min: minSal,
              salary_max: maxSal,
              salary_currency: currency,
              salary_period: salaryPeriod,
              employer_type: 'direct',
              source_name: 'Jobicy',
              source_url: 'https://jobicy.com',
              apply_url: jobUrl,
              url: jobUrl,
              source: 'jobicy',
              tags: rawTags.length > 0 ? rawTags : [category, 'Remote'],
              skills: cleanSkills.length > 0 ? cleanSkills : [category],
              published_at: j.pubDate || new Date().toISOString(),
              posted_at: j.pubDate || new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Jobicy crawl notice:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...JOBICY_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return JOBICY_SEED_JOBS;
  },
};
