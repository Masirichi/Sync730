import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const FREEHIRE_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'freehire-frontend-lead-01',
    title: 'Senior Frontend Architect (Next.js 14 & Tailwind)',
    company: 'OpenSource Studio Labs',
    company_logo: null,
    description: 'Lead open-source design systems and high-throughput web frontends. Flexible contract role with competitive global rates.',
    category: 'Software & Engineering',
    job_type: 'contract',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$50 - $75 USD / hr',
    url: 'https://freehire.me/jobs/senior-frontend-architect-nextjs-01',
    source: 'freehire',
    tags: ['Next.js', 'React', 'TailwindCSS', 'Freehire'],
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    external_id: 'freehire-flutter-contract-02',
    title: 'Lead Flutter Mobile Developer (Offline-First Banking)',
    company: 'AfroPay Mobility',
    company_logo: null,
    description: 'Architect low-data consumption cross-platform apps using Flutter, SQLite, and Riverpod. 100% remote for African developers.',
    category: 'Software & Engineering',
    job_type: 'contract',
    candidate_required_location: 'Africa Only (Nigeria, Kenya, Ghana, Rwanda)',
    location_tier: 'Africa Only',
    salary: '$4,000 - $6,500 USD / month',
    url: 'https://freehire.me/jobs/lead-flutter-mobile-developer-africa-02',
    source: 'freehire',
    tags: ['Flutter', 'Dart', 'Offline-First', 'Africa', 'Freehire'],
    published_at: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  {
    external_id: 'freehire-devops-sre-03',
    title: 'Site Reliability & Infrastructure Specialist',
    company: 'CloudFlow Distributed Systems',
    company_logo: null,
    description: 'Maintain high availability multi-region Kubernetes clusters, Grafana telemetry, and automated Terraform infrastructure.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'EMEA Timezones',
    location_tier: 'EMEA',
    salary: '€75,000 - €95,000 EUR',
    url: 'https://freehire.me/jobs/site-reliability-cloud-specialist-emea-03',
    source: 'freehire',
    tags: ['Kubernetes', 'Terraform', 'Prometheus', 'Freehire'],
    published_at: new Date(Date.now() - 3600000 * 13).toISOString(),
  },
  {
    external_id: 'freehire-technical-writer-04',
    title: 'Developer Advocate & Technical Content Writer',
    company: 'Global API Platform',
    company_logo: null,
    description: 'Produce high-clarity SDK guides, OpenAPI tutorials, and interactive developer sandboxes. Fast-paced distributed team.',
    category: 'Sales & Marketing',
    job_type: 'contract',
    candidate_required_location: 'Worldwide',
    location_tier: 'Worldwide',
    salary: '$40 - $60 USD / hr',
    url: 'https://freehire.me/jobs/developer-advocate-technical-writer-04',
    source: 'freehire',
    tags: ['DevRel', 'Technical Writing', 'Markdown', 'APIs', 'Freehire'],
    published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

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
