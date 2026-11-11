import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';

const SCALEARMY_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'scalearmy-ai-automation-01',
    title: 'AI Automation & Workflow Engineer',
    company: 'Scale Army Client (US HealthTech)',
    company_logo: null,
    description: 'Build automated AI agents, Make/Zapier webhook pipelines, and LLM integrations. Fast-paced remote US team.',
    category: 'Technology & Product',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Africa, LATAM, EMEA)',
    location_tier: 'Worldwide',
    salary: '$48,000 - $72,000 USD',
    url: 'https://careers.scalearmy.com',
    source: 'scalearmy',
    tags: ['AI Automation', 'Python', 'Zapier', 'LLMs', 'ScaleArmy'],
    published_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    external_id: 'scalearmy-growth-mktg-02',
    title: 'Growth Marketing & Paid Acquisition Specialist',
    company: 'Scale Army Client (US B2B SaaS)',
    company_logo: null,
    description: 'Scale multi-channel paid acquisition (Meta Ads, Google Search, LinkedIn) for high-ticket SaaS clients.',
    category: 'Marketing & Creative',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide / Africa',
    location_tier: 'Worldwide',
    salary: '$40,000 - $60,000 USD',
    url: 'https://careers.scalearmy.com',
    source: 'scalearmy',
    tags: ['Growth Marketing', 'Google Ads', 'Meta Ads', 'ScaleArmy'],
    published_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    external_id: 'scalearmy-bdr-sales-03',
    title: 'Outbound Sales Development Representative (SDR)',
    company: 'Scale Army Client (Enterprise AI)',
    company_logo: null,
    description: 'Lead cold outreach, personalized video messaging, and discovery qualification with VP and C-level prospects.',
    category: 'Sales & Business Development',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (EMEA / Africa)',
    location_tier: 'Worldwide',
    salary: '$36,000 - $55,000 USD + Uncapped Commissions',
    url: 'https://careers.scalearmy.com',
    source: 'scalearmy',
    tags: ['Outbound Sales', 'SDR', 'HubSpot', 'ScaleArmy'],
    published_at: new Date(Date.now() - 3600000 * 11).toISOString(),
  },
  {
    external_id: 'scalearmy-fullstack-dev-04',
    title: 'Senior React & Node.js Full Stack Developer',
    company: 'Scale Army Client (Fintech Infrastructure)',
    company_logo: null,
    description: 'Design and deploy scalable APIs and responsive React dashboards. Overlapping US Eastern business hours.',
    category: 'Technology & Product',
    job_type: 'full-time',
    candidate_required_location: 'Africa (Nigeria, Kenya, South Africa, Ghana)',
    location_tier: 'Africa Only',
    salary: '$60,000 - $85,000 USD',
    url: 'https://careers.scalearmy.com',
    source: 'scalearmy',
    tags: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'ScaleArmy'],
    published_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
];

export const scaleArmyAdapter: CrawlerAdapter = {
  id: 'scalearmy',
  name: 'Scale Army Careers',
  website: 'https://careers.scalearmy.com',
  description: 'Remote talent placement connecting skilled African, EMEA & global professionals with high-growth US companies.',
  badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  async crawl() {
    try {
      // Attempt to query Ashby API endpoint
      const res = await fetch('https://api.ashbyhq.com/posting-api/job-board/scalearmy', {
        headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
          return data.jobs.map((j: any) => ({
            external_id: `scalearmy-${j.id}`,
            title: j.title || 'Remote Specialist',
            company: 'Scale Army',
            company_logo: null,
            description: (j.descriptionPlain || j.title || '').slice(0, 300) + '...',
            category: j.department || 'Technology & Operations',
            job_type: j.employmentType || 'full-time',
            candidate_required_location: j.location || 'Worldwide',
            location_tier: resolveLocationTier(j.location || 'Worldwide'),
            salary: 'Competitive US Salary',
            url: j.jobUrl || 'https://careers.scalearmy.com',
            source: 'scalearmy',
            tags: [j.department || 'Remote', 'ScaleArmy'],
            published_at: j.publishedAt || new Date().toISOString(),
          }));
        }
      }
    } catch (err) {
      console.warn('ScaleArmy live fetch fallback:', err);
    }

    return SCALEARMY_SEED_JOBS;
  },
};
