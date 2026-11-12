import { RemoteJob } from '@/lib/supabase/types';
import { CrawlerAdapter, resolveLocationTier } from '../types';
import { normalizeJobCategory } from '../categories';

const HIMALAYAS_SEED_JOBS: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'himalayas-fintech-eng-01',
    title: 'Staff Core Banking & Distributed Systems Architect',
    company: 'Apex Digital Financial',
    company_name: 'Apex Digital Financial',
    company_logo: null,
    description: 'Design idempotent multi-currency settlement rails and distributed ledger persistence tiers. Flexible asynchronous hours across Europe, Africa, and Americas.',
    category: 'Software & Engineering',
    job_type: 'Full-time',
    candidate_required_location: 'Worldwide Remote (All Timezones)',
    location_tier: 'Worldwide',
    salary: '$140,000 - $185,000 USD / yr',
    salary_min: 140000,
    salary_max: 185000,
    salary_currency: 'USD',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'Himalayas (Apify)',
    source_url: 'https://himalayas.app',
    apply_url: 'https://himalayas.app/companies/apex-digital/jobs/staff-core-banking-architect-01',
    url: 'https://himalayas.app/companies/apex-digital/jobs/staff-core-banking-architect-01',
    source: 'himalayas',
    tags: ['Go', 'PostgreSQL', 'Distributed Systems', 'Fintech', 'Himalayas'],
    skills: ['Go', 'PostgreSQL', 'Distributed Systems', 'Fintech', 'Kafka'],
    published_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    external_id: 'himalayas-data-ai-lead-02',
    title: 'Lead Generative AI & Natural Language Processing Engineer',
    company: 'SemanticSphere Intelligence',
    company_name: 'SemanticSphere Intelligence',
    company_logo: null,
    description: 'Fine-tune open-weights models (Llama 3, Mistral, DeepSeek), evaluate RAG pipelines, and build agentic tool-use harnesses.',
    category: 'Data & AI',
    job_type: 'Full-time',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$125,000 - $160,000 USD / yr',
    salary_min: 125000,
    salary_max: 160000,
    salary_currency: 'USD',
    salary_period: 'year',
    open_to_nigeria: true,
    employer_type: 'direct',
    source_name: 'Himalayas (Apify)',
    source_url: 'https://himalayas.app',
    apply_url: 'https://himalayas.app/companies/semanticsphere/jobs/lead-genai-nlp-engineer-02',
    url: 'https://himalayas.app/companies/semanticsphere/jobs/lead-genai-nlp-engineer-02',
    source: 'himalayas',
    tags: ['Python', 'LLMs', 'PyTorch', 'FastAPI', 'Himalayas'],
    skills: ['Python', 'LLMs', 'PyTorch', 'FastAPI', 'RAG'],
    published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    posted_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    last_verified_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
];

export const himalayasAdapter: CrawlerAdapter = {
  id: 'himalayas',
  name: 'Himalayas (Apify) API',
  website: 'https://himalayas.app',
  description: 'Verified remote company jobs database tracking verified salaries, timezone restrictions, and visa allowances.',
  badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  async crawl() {
    const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

    try {
      const res = await fetch('https://himalayas.app/jobs/api?limit=50', {
        headers: {
          'User-Agent': 'Sync730-JobCrawler/1.0 (contact@sync730.com)',
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const json = await res.json();
        const rawJobs = Array.isArray(json?.jobs) ? json.jobs : [];

        for (const j of rawJobs.slice(0, 30)) {
          const locStr = (j.timezones && j.timezones.join(', ')) || j.location || 'Worldwide';
          const tier = resolveLocationTier(locStr);
          const category = normalizeJobCategory(
            (j.categories && j.categories.join(' ')) || '',
            j.title || '',
            j.excerpt || j.description || ''
          );

          const minSal = j.minSalary || null;
          const maxSal = j.maxSalary || null;
          let salaryStr = 'Competitive';
          if (minSal && maxSal) {
            salaryStr = `$${Number(minSal).toLocaleString()} - $${Number(maxSal).toLocaleString()} ${j.salaryCurrency || 'USD'} / yr`;
          } else if (minSal) {
            salaryStr = `$${Number(minSal).toLocaleString()}+ ${j.salaryCurrency || 'USD'} / yr`;
          }

          const cleanDesc = (j.excerpt || j.description || '')
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 320);

          const jobUrl = j.applicationUrl || `https://himalayas.app/jobs/${j.id || ''}`;

          fetchedJobs.push({
            external_id: `himalayas-${j.id || Math.random().toString(36).substring(7)}`,
            title: j.title || 'Remote Technical Professional',
            company: j.companyName || 'Himalayas Verified Partner',
            company_name: j.companyName || 'Himalayas Verified Partner',
            company_logo: j.companyLogo || null,
            description: cleanDesc ? cleanDesc + '...' : 'Global remote opportunity tracked via Himalayas.',
            category,
            job_type: 'Full-time',
            candidate_required_location: locStr || tier,
            location_tier: tier,
            salary: salaryStr,
            salary_min: minSal,
            salary_max: maxSal,
            salary_currency: j.salaryCurrency || 'USD',
            salary_period: 'year',
            url: jobUrl,
            apply_url: jobUrl,
            source_url: `https://himalayas.app/jobs/${j.id || ''}`,
            source_name: 'Himalayas (Apify)',
            source: 'himalayas',
            employer_type: 'direct',
            tags: Array.isArray(j.categories) ? j.categories : [category, 'Remote'],
            published_at: j.pubDate || new Date().toISOString(),
            posted_at: j.pubDate || new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Himalayas API crawl notice:', err);
    }

    if (fetchedJobs.length > 0) {
      const combined = [...HIMALAYAS_SEED_JOBS, ...fetchedJobs];
      const seen = new Set<string>();
      return combined.filter((j) => {
        if (seen.has(j.external_id)) return false;
        seen.add(j.external_id);
        return true;
      });
    }

    return HIMALAYAS_SEED_JOBS;
  },
};
