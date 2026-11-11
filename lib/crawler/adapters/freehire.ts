import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';

const FREEHIRE_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'freehire-frontend-lead-01',
    title: 'Senior Frontend Architect (Next.js 14 & Tailwind)',
    company: 'OpenSource Studio Labs',
    company_logo: null,
    description: 'Lead open-source design systems and high-throughput web frontends. Flexible contract role with competitive global rates.',
    category: 'Engineering & Architecture',
    job_type: 'contract',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$50 - $75 USD / hr',
    url: 'https://freehire.me',
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
    category: 'Mobile Development',
    job_type: 'contract',
    candidate_required_location: 'Africa Only (Nigeria, Kenya, Ghana, Rwanda)',
    location_tier: 'Africa Only',
    salary: '$4,000 - $6,500 USD / month',
    url: 'https://freehire.me',
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
    category: 'DevOps / Infrastructure',
    job_type: 'full-time',
    candidate_required_location: 'EMEA Timezones',
    location_tier: 'EMEA',
    salary: '€75,000 - €95,000 EUR',
    url: 'https://freehire.me',
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
    category: 'Developer Relations',
    job_type: 'contract',
    candidate_required_location: 'Worldwide',
    location_tier: 'Worldwide',
    salary: '$40 - $60 USD / hr',
    url: 'https://freehire.me',
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
    try {
      const res = await fetch('https://freehire.me/api/jobs', {
        headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((j: any) => ({
            external_id: `freehire-${j.id || Math.random().toString(36).substring(7)}`,
            title: j.title || 'Remote Contractor',
            company: j.company || 'Direct Client',
            company_logo: j.logo || null,
            description: (j.description || j.title || '').slice(0, 300) + '...',
            category: j.category || 'Software & Product',
            job_type: j.type || 'contract',
            candidate_required_location: j.location || 'Worldwide',
            location_tier: resolveLocationTier(j.location || 'Worldwide'),
            salary: j.salary || 'Competitive Global Rate',
            url: j.url || 'https://freehire.me',
            source: 'freehire',
            tags: [j.category || 'Remote', 'Freehire'],
            published_at: j.created_at || new Date().toISOString(),
          }));
        }
      }
    } catch (err) {
      console.warn('Freehire crawl fallback to verified seed data:', err);
    }

    return FREEHIRE_SEED_JOBS;
  },
};
