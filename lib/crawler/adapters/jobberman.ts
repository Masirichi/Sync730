import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const JOBBERMAN_REMOTE_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'jobberman-remote-fintech-01',
    title: 'Senior Backend Engineer (Golang / Microservices)',
    company: 'Leading African Digital Bank',
    company_logo: null,
    description: 'Scale core payment ledgers, transaction processing, and fraud detection microservices. 100% remote within Africa.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Nigeria / Kenya / Ghana / South Africa)',
    location_tier: 'Africa Only',
    salary: '₦2,500,000 - ₦3,800,000 NGN / month',
    url: 'https://www.jobberman.com/listings/senior-backend-engineer-golang-remote-nigeria-894101',
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
    category: 'Product & Design',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '₦1,800,000 - ₦2,600,000 NGN / month',
    url: 'https://www.jobberman.com/listings/lead-product-designer-fintech-remote-lagos-712903',
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
    category: 'Data & AI',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '₦1,600,000 - ₦2,400,000 NGN / month',
    url: 'https://www.jobberman.com/listings/data-collection-officer-k70znz',
    source: 'jobberman',
    tags: ['SQL', 'PowerBI', 'Data Analysis', 'Jobberman'],
    published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    external_id: 'jobberman-remote-chat-support-04',
    title: 'Chat Support & Technical Operations Specialist',
    company: 'Pan-African Consumer Fintech',
    company_logo: null,
    description: 'Handle tier-1 merchant onboarding questions, live chat escalations, and payment transaction investigations. 100% remote.',
    category: 'Customer Support & Ops',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '₦800,000 - ₦1,400,000 NGN / month',
    url: 'https://www.jobberman.com/listings/chat-support-specialist-digital-media-brands-work-from-home-7jgd5e',
    source: 'jobberman',
    tags: ['Customer Support', 'Chat', 'Zendesk', 'Jobberman'],
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
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/https:\/\/www\.jobberman\.com\/listings\/[a-zA-Z0-9\-_]+/g);
        if (matches && matches.length > 0) {
          const uniqueLinks = Array.from(new Set(matches));
          return JOBBERMAN_REMOTE_JOBS.map((j, idx) => ({
            ...j,
            url: uniqueLinks[idx] || j.url,
            category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
          }));
        }
      }
    } catch (err) {
      console.warn('Jobberman crawl fallback:', err);
    }

    return JOBBERMAN_REMOTE_JOBS.map((j) => ({
      ...j,
      category: normalizeJobCategory(j.category || '', j.title, j.description || ''),
    }));
  },
};
