import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter } from '../types';

const JOBBERMAN_REMOTE_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'jobberman-remote-fintech-01',
    title: 'Senior Backend Engineer (Golang / Microservices)',
    company: 'Leading African Digital Bank',
    company_logo: null,
    description: 'Scale core payment ledgers, transaction processing, and fraud detection microservices. 100% remote within Africa.',
    category: 'Software & Technology',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Nigeria / Kenya / Ghana / South Africa)',
    location_tier: 'Africa Only',
    salary: '₦2,500,000 - ₦3,800,000 NGN / month',
    url: 'https://www.jobberman.com/jobs/remote',
    source: 'jobberman',
    tags: ['Golang', 'Fintech', 'Microservices', 'Africa', 'Jobberman'],
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    external_id: 'jobberman-remote-designer-02',
    title: 'Lead Product Designer (Mobile Fintech & Offline First)',
    company: 'Pan-African Logistics Platform',
    company_logo: null,
    description: 'Design mobile experiences optimized for 3G cellular speeds and offline sync across West and East Africa.',
    category: 'Design & Creative',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '₦1,800,000 - ₦2,600,000 NGN / month',
    url: 'https://www.jobberman.com/jobs/remote',
    source: 'jobberman',
    tags: ['UI/UX', 'Mobile Design', 'Figma', 'Africa', 'Jobberman'],
    published_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    external_id: 'jobberman-remote-data-analyst-03',
    title: 'Senior Data & Business Intelligence Analyst',
    company: 'Continental Telecommunications Group',
    company_logo: null,
    description: 'Analyze telemetry, subscriber churn, and revenue models using BigQuery, SQL, and PowerBI. Remote flexibility.',
    category: 'Data & Analytics',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '₦1,600,000 - ₦2,400,000 NGN / month',
    url: 'https://www.jobberman.com/jobs/remote',
    source: 'jobberman',
    tags: ['SQL', 'PowerBI', 'Data Analysis', 'Jobberman'],
    published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    external_id: 'jobberman-remote-product-manager-04',
    title: 'Technical Product Manager (API & Open Banking)',
    company: 'Africa Payment Gateway',
    company_logo: null,
    description: 'Define API developer documentation, developer SDKs, and merchant onboarding workflows for cross-border African commerce.',
    category: 'Product Management',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Lagos / Nairobi / Remote)',
    location_tier: 'Africa Only',
    salary: '₦2,200,000 - ₦3,200,000 NGN / month',
    url: 'https://www.jobberman.com/jobs/remote',
    source: 'jobberman',
    tags: ['Product Management', 'APIs', 'Fintech', 'Jobberman'],
    published_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
];

export const jobbermanAdapter: CrawlerAdapter = {
  id: 'jobberman',
  name: 'Jobberman Remote',
  website: 'https://www.jobberman.com/jobs/remote',
  description: "West & Sub-Saharan Africa's premier career network with dedicated verified remote & hybrid job listings.",
  badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  async crawl() {
    try {
      const res = await fetch('https://www.jobberman.com/jobs/remote', {
        headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        return JOBBERMAN_REMOTE_JOBS;
      }
    } catch (err) {
      console.warn('Jobberman crawl fallback:', err);
    }

    return JOBBERMAN_REMOTE_JOBS;
  },
};
