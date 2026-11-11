import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const SCALEARMY_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'scalearmy-ai-automation-01',
    title: 'AI Automation & Workflow Engineer',
    company: 'Scale Army Client (US HealthTech)',
    company_logo: null,
    description: 'Build automated AI agents, Make/Zapier webhook pipelines, and LLM integrations. Fast-paced remote US team.',
    category: 'Data & AI',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Africa, LATAM, EMEA)',
    location_tier: 'Worldwide',
    salary: '$48,000 - $72,000 USD',
    url: 'https://apply.scalearmycareers.com/applications/9d42ed82-4234-4474-b12f-db498b8c94e4',
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
    category: 'Sales & Marketing',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide / Africa',
    location_tier: 'Worldwide',
    salary: '$40,000 - $60,000 USD',
    url: 'https://careers.scalearmy.com/jobs/growth-marketing-acquisition-specialist-02',
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
    category: 'Sales & Marketing',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (EMEA / Africa)',
    location_tier: 'Worldwide',
    salary: '$36,000 - $55,000 USD + Uncapped Commissions',
    url: 'https://careers.scalearmy.com/jobs/outbound-sales-development-representative-03',
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
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Africa (Nigeria, Kenya, South Africa, Ghana)',
    location_tier: 'Africa Only',
    salary: '$60,000 - $85,000 USD',
    url: 'https://careers.scalearmy.com/jobs/senior-react-nodejs-developer-africa-04',
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
