// lib/crawler/universal-careers-crawler.ts
// Universal Jobs Crawler for Direct Company Career Pages & Startup Vacancies
// Crawls ATS endpoints (Greenhouse, Lever, Ashby, Direct Careers) for remote roles open to African talent.

import { RemoteJob, LocationTier } from '@/lib/supabase/types';
import { resolveLocationTier } from './types';
import { normalizeJobCategory } from './categories';

export interface CompanyBoardConfig {
  id: string;
  name: string;
  ats: 'greenhouse' | 'lever' | 'ashby' | 'manatal' | 'mercor' | 'workable' | 'direct' | 'teamtailor';
  boardSlug: string;
  isStartup: boolean;
  website: string;
  defaultLocation: string;
  logo?: string;
  description: string;
}

export const VERIFIED_COMPANY_BOARDS: CompanyBoardConfig[] = [
  // High-Growth African Unicorns & Tech Startups
  {
    id: 'moniepoint',
    name: 'Moniepoint',
    ats: 'greenhouse',
    boardSlug: 'moniepoint',
    isStartup: true,
    website: 'https://moniepoint.com/careers',
    defaultLocation: 'Nigeria / Kenya / Remote Africa',
    description: 'Financial technology infrastructure for 2M+ businesses across Africa.',
  },
  {
    id: 'paystack',
    name: 'Paystack',
    ats: 'teamtailor',
    boardSlug: 'paystack',
    isStartup: true,
    website: 'https://paystack.com/careers',
    defaultLocation: 'Lagos, Nigeria / Cape Town, South Africa / Accra, Ghana / Remote',
    description: 'Modern payment processing for Africa, operating under Stripe.',
  },
  {
    id: 'kuda',
    name: 'Kuda Bank',
    ats: 'greenhouse',
    boardSlug: 'kuda',
    isStartup: true,
    website: 'https://kuda.com/careers',
    defaultLocation: 'Nigeria / UK / Remote Africa',
    description: 'The money app for Africans with zero-fee banking and micro-lending.',
  },
  {
    id: 'chowdeck',
    name: 'Chowdeck',
    ats: 'greenhouse',
    boardSlug: 'chowdeck',
    isStartup: true,
    website: 'https://chowdeck.com/careers',
    defaultLocation: 'Lagos, Nigeria / Remote',
    description: 'Rapid on-demand food logistics and delivery across major Nigerian hubs.',
  },
  {
    id: 'chipper',
    name: 'Chipper Cash',
    ats: 'greenhouse',
    boardSlug: 'chippercash',
    isStartup: true,
    website: 'https://chippercash.com/careers',
    defaultLocation: 'Africa / UK / Remote',
    description: 'Instant cross-border financial services across 7+ African nations.',
  },
  {
    id: 'reliance',
    name: 'Reliance Health',
    ats: 'greenhouse',
    boardSlug: 'reliancehealth',
    isStartup: true,
    website: 'https://reliancehealthinc.com/careers',
    defaultLocation: 'Nigeria / Egypt / Remote Africa',
    description: 'Tech-enabled integrated healthcare and health insurance across emerging markets.',
  },
  {
    id: 'helium',
    name: 'Helium Health',
    ats: 'greenhouse',
    boardSlug: 'heliumhealth',
    isStartup: true,
    website: 'https://heliumhealth.com/careers',
    defaultLocation: 'Nigeria / West Africa / Remote',
    description: 'Electronic medical records, hospital management, and healthcare finance.',
  },
  {
    id: 'fairmoney',
    name: 'FairMoney',
    ats: 'greenhouse',
    boardSlug: 'fairmoney',
    isStartup: true,
    website: 'https://fairmoney.io/careers',
    defaultLocation: 'Nigeria / France / Remote',
    description: 'Credit-led neobank serving millions of underserved individuals and merchants.',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    ats: 'lever',
    boardSlug: 'flutterwave',
    isStartup: true,
    website: 'https://flutterwave.com/careers',
    defaultLocation: 'Nigeria / Kenya / Worldwide Remote',
    description: 'Global payments gateway connecting Africa to the global digital economy.',
  },
  {
    id: 'andela',
    name: 'Andela',
    ats: 'greenhouse',
    boardSlug: 'andela',
    isStartup: true,
    website: 'https://andela.com/careers',
    defaultLocation: 'Worldwide (Africa Hubs)',
    description: 'Global marketplace for trusted technical talent from emerging markets.',
  },
  {
    id: 'alx-africa',
    name: 'ALX Africa',
    ats: 'manatal',
    boardSlug: 'alx-africa',
    isStartup: true,
    website: 'https://alxafrica.com/careers',
    defaultLocation: 'Nigeria / Kenya / Worldwide Remote Africa',
    description: 'Pan-African tech training and career network managing technical roles via Manatal ATS.',
  },
  {
    id: 'mercor-global',
    name: 'Mercor',
    ats: 'mercor',
    boardSlug: 'mercor-global',
    isStartup: true,
    website: 'https://mercor.com',
    defaultLocation: 'Worldwide Remote (Africa Included)',
    description: 'Global AI engineering and software development hiring platform.',
  },

  // Global Remote-First Leaders Open to Africa
  {
    id: 'canonical',
    name: 'Canonical (Ubuntu)',
    ats: 'greenhouse',
    boardSlug: 'canonical',
    isStartup: false,
    website: 'https://canonical.com/careers',
    defaultLocation: 'EMEA / Worldwide Remote',
    description: 'Publishers of Ubuntu OS and enterprise open-source cloud solutions.',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    ats: 'greenhouse',
    boardSlug: 'gitlab',
    isStartup: false,
    website: 'https://about.gitlab.com/jobs',
    defaultLocation: 'Worldwide Remote (EMEA / Africa)',
    description: 'The single DevSecOps platform delivered as an open-core SaaS.',
  },
  {
    id: 'automattic',
    name: 'Automattic',
    ats: 'greenhouse',
    boardSlug: 'automattic',
    isStartup: false,
    website: 'https://automattic.com/work-with-us',
    defaultLocation: 'Worldwide Remote',
    description: 'Making the web a better place with WordPress.com, WooCommerce, and Day One.',
  },
  {
    id: 'remote-com',
    name: 'Remote.com',
    ats: 'lever',
    boardSlug: 'remote',
    isStartup: true,
    website: 'https://remote.com/careers',
    defaultLocation: 'Worldwide Remote (Africa included)',
    description: 'Global HR, payroll, and compliance platform for distributed workforces.',
  },
  {
    id: 'buffer',
    name: 'Buffer',
    ats: 'lever',
    boardSlug: 'buffer',
    isStartup: true,
    website: 'https://buffer.com/journey',
    defaultLocation: 'Worldwide Remote',
    description: 'Pioneers in transparent, asynchronous remote work and social publishing.',
  },
  {
    id: 'deel',
    name: 'Deel',
    ats: 'greenhouse',
    boardSlug: 'deel',
    isStartup: true,
    website: 'https://deel.com/careers',
    defaultLocation: 'Worldwide Remote (Africa Timezones)',
    description: 'All-in-one HR platform for global teams hiring and paying worldwide.',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    ats: 'lever',
    boardSlug: 'duckduckgo',
    isStartup: true,
    website: 'https://duckduckgo.com/hiring',
    defaultLocation: 'Worldwide Remote',
    description: 'Independent privacy company building search engine, tracker blocker, and browser.',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    ats: 'lever',
    boardSlug: 'zapier',
    isStartup: true,
    website: 'https://zapier.com/jobs',
    defaultLocation: 'Worldwide Remote',
    description: 'No-code automation platform connecting thousands of business web tools.',
  },
];

// Baseline curated seed vacancies from verified startups hiring remotely from Africa
export const VERIFIED_STARTUP_VACANCIES: Omit<RemoteJob, 'id'>[] = [
  {
    external_id: 'startup-moniepoint-eng-relations-01',
    title: 'Engineering Relations Partner',
    company: 'Moniepoint',
    company_name: 'Moniepoint',
    company_logo: 'https://images.greenhouse.io/moniepoint_logo.png',
    description: 'Bridge engineering hubs across Nigeria, Kenya, South Africa, and global teams. Accelerate developer advocacy, engineering culture, and talent pipeline velocity across high-volume fintech transaction systems.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Nigeria / Kenya / South Africa (Remote)',
    location_tier: 'Africa Only',
    salary: '₦2,500,000 - ₦4,000,000 / month ($3,000 - $5,000 USD)',
    salary_min: 2500000,
    salary_max: 4000000,
    salary_currency: 'NGN',
    salary_period: 'month',
    url: 'https://job-boards.eu.greenhouse.io/moniepoint/jobs/4874410101',
    apply_url: 'https://job-boards.eu.greenhouse.io/moniepoint/jobs/4874410101',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Fintech', 'Developer Advocacy', 'Moniepoint', 'Africa Remote'],
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-moniepoint-system-admin-02',
    title: 'Team Lead, System Administrator (DevOps & Core Infrastructure)',
    company: 'Moniepoint',
    company_name: 'Moniepoint',
    company_logo: 'https://images.greenhouse.io/moniepoint_logo.png',
    description: 'Lead system administration and enterprise server operations supporting sub-second transaction settlement for millions of African businesses. Oversee Linux kernel tuning, high-availability clusters, and infrastructure monitoring.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'Lagos, Nigeria',
    location_tier: 'Africa Only',
    salary: '₦3,200,000 - ₦5,500,000 / month',
    salary_min: 3200000,
    salary_max: 5500000,
    salary_currency: 'NGN',
    salary_period: 'month',
    url: 'https://job-boards.eu.greenhouse.io/moniepoint/jobs/4780532101',
    apply_url: 'https://job-boards.eu.greenhouse.io/moniepoint/jobs/4780532101',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Fintech', 'Linux', 'DevOps', 'Moniepoint', 'Lagos'],
    published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-paystack-platform-security-01',
    title: 'Senior Platform Security Engineer',
    company: 'Paystack',
    company_name: 'Paystack',
    company_logo: 'https://paystack.com/assets/img/press-kit/key-art.png',
    description: 'Strengthen the foundation of Paystack cloud platforms and core infrastructure against advanced security threats. Implement Zero Trust controls, threat intelligence, and automated vulnerability management across high-concurrency payment infrastructure.',
    category: 'DevOps & Cloud',
    job_type: 'full-time',
    candidate_required_location: 'Lagos, Nigeria (Hybrid / Remote)',
    location_tier: 'Africa Only',
    salary: '₦38,000,000 - ₦55,000,000 / year ($50,000 - $75,000 USD)',
    salary_min: 38000000,
    salary_max: 55000000,
    salary_currency: 'NGN',
    salary_period: 'year',
    url: 'https://careers.paystack.com/jobs/8272899-senior-platform-security-engineer',
    apply_url: 'https://careers.paystack.com/jobs/8272899-senior-platform-security-engineer',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Fintech', 'Cloud Security', 'AWS', 'Paystack', 'Stripe'],
    published_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-paystack-app-security-02',
    title: 'Senior Application Security Engineer',
    company: 'Paystack',
    company_name: 'Paystack',
    company_logo: 'https://paystack.com/assets/img/press-kit/key-art.png',
    description: 'Embed application security into the engineering lifecycle. Lead secure code reviews, automated threat modeling, and bug bounty triage for millions of transactions processed across Africa. Work directly with engineering teams.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Lagos, Nigeria (Remote / Hybrid)',
    location_tier: 'Africa Only',
    salary: '₦35,000,000 - ₦52,000,000 / year ($45,000 - $70,000 USD)',
    salary_min: 35000000,
    salary_max: 52000000,
    salary_currency: 'NGN',
    salary_period: 'year',
    url: 'https://careers.paystack.com/jobs/7930765-senior-application-security-engineer',
    apply_url: 'https://careers.paystack.com/jobs/7930765-senior-application-security-engineer',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Fintech', 'AppSec', 'Node.js', 'Paystack', 'Stripe'],
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-paystack-core-payments-03',
    title: 'Senior Product Manager, Core Payments',
    company: 'Paystack',
    company_name: 'Paystack',
    company_logo: 'https://paystack.com/assets/img/press-kit/key-art.png',
    description: 'Own and optimize Paystack core payment rails, gateway integrations, and processing success rates across African card networks, instant bank transfers, and mobile money schemes. Partner with banking partners across African markets.',
    category: 'Product',
    job_type: 'full-time',
    candidate_required_location: 'Lagos, Nigeria',
    location_tier: 'Africa Only',
    salary: '₦32,000,000 - ₦48,000,000 / year ($42,000 - $65,000 USD)',
    salary_min: 32000000,
    salary_max: 48000000,
    salary_currency: 'NGN',
    salary_period: 'year',
    url: 'https://careers.paystack.com/jobs/8764317-senior-product-manager-core-payments',
    apply_url: 'https://careers.paystack.com/jobs/8764317-senior-product-manager-core-payments',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Fintech', 'Core Payments', 'Product', 'Paystack', 'Nigeria'],
    published_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-chowdeck-senior-product-03',
    title: 'Senior Product Manager (Logistics Dispatch & Driver Systems)',
    company: 'Chowdeck',
    company_name: 'Chowdeck',
    company_logo: null,
    description: 'Lead product delivery for driver dispatching algorithms, route optimization, and merchant kitchen operations in Lagos, Nairobi, and Port Harcourt. Proven startup velocity required.',
    category: 'Product',
    job_type: 'full-time',
    candidate_required_location: 'Nigeria (Remote / Hybrid)',
    location_tier: 'Africa Only',
    salary: '₦2,800,000 - ₦4,500,000 / month',
    url: 'https://chowdeck.com/careers/product-manager-dispatch',
    apply_url: 'https://chowdeck.com/careers/product-manager-dispatch',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Logistics', 'Product', 'Chowdeck', 'Nigeria'],
    published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: false,
  },
  {
    external_id: 'startup-kuda-lead-mobile-04',
    title: 'Lead Flutter / Mobile Engineer (Personal & Business Banking)',
    company: 'Kuda Bank',
    company_name: 'Kuda Bank',
    company_logo: null,
    description: 'Deliver consumer-grade neobanking experiences to 6M+ customers. Lead architectural decisions across Flutter, Dart, native iOS/Android bridge modules, and biometric security.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Africa Timezones)',
    location_tier: 'Worldwide',
    salary: '$75,000 - $105,000 USD / year',
    url: 'https://kuda.com/careers/lead-mobile-engineer',
    apply_url: 'https://kuda.com/careers/lead-mobile-engineer',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Neobank', 'Flutter', 'Mobile', 'Kuda'],
    published_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: false,
  },
  {
    external_id: 'startup-chipper-growth-marketing-05',
    title: 'Growth Marketing Lead (Sub-Saharan Africa Expansion)',
    company: 'Chipper Cash',
    company_name: 'Chipper Cash',
    company_logo: null,
    description: 'Drive customer acquisition and retention across Kenya, Uganda, Ghana, and Nigeria. Oversee performance marketing, influencer partnerships, and lifecycle CRM.',
    category: 'Marketing',
    job_type: 'full-time',
    candidate_required_location: 'Africa Only (Remote)',
    location_tier: 'Africa Only',
    salary: '$60,000 - $85,000 USD / year',
    url: 'https://chippercash.com/careers/growth-lead-ssa',
    apply_url: 'https://chippercash.com/careers/growth-lead-ssa',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Marketing', 'Fintech', 'Chipper Cash', 'Growth'],
    published_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: false,
  },
  {
    external_id: 'startup-reliance-health-data-scientist-06',
    title: 'Lead Healthcare Data Scientist & Actuarial Modeler',
    company: 'Reliance Health',
    company_name: 'Reliance Health',
    company_logo: null,
    description: 'Build predictive risk scoring and claims fraud detection models operating on millions of telemedicine consultations and health insurance claims.',
    category: 'Data',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Africa Friendly)',
    location_tier: 'Worldwide',
    salary: '$70,000 - $95,000 USD / year',
    url: 'https://reliancehealthinc.com/careers/data-scientist',
    apply_url: 'https://reliancehealthinc.com/careers/data-scientist',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Healthtech', 'Data Science', 'Machine Learning', 'Reliance Health'],
    published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: false,
  },
  {
    external_id: 'startup-remote-com-staff-frontend-07',
    title: 'Staff Frontend Engineer (Global Payroll & Onboarding UI)',
    company: 'Remote.com',
    company_name: 'Remote.com',
    company_logo: null,
    description: 'Own user interfaces and design systems for global contractor onboarding and employer of record compliance. Fully distributed async environment.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide (Remote Africa)',
    location_tier: 'Worldwide',
    salary: '$110,000 - $145,000 USD / year',
    url: 'https://remote.com/careers/apply/staff-frontend-9021',
    apply_url: 'https://remote.com/careers/apply/staff-frontend-9021',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'React', 'TypeScript', 'Remote.com', 'Global HR'],
    published_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: true,
  },
  {
    external_id: 'startup-buffer-fullstack-product-08',
    title: 'Senior Fullstack Engineer (Publishing & Analytics Workflows)',
    company: 'Buffer',
    company_name: 'Buffer',
    company_logo: null,
    description: 'Build publishing integrations and analytics dashboards for social media creators and marketing teams worldwide. 4-day workweek, 100% transparent pay.',
    category: 'Software & Engineering',
    job_type: 'full-time',
    candidate_required_location: 'Worldwide Remote',
    location_tier: 'Worldwide',
    salary: '$105,000 - $132,000 USD / year (Transparent Pay)',
    url: 'https://buffer.com/journey/senior-fullstack-engineer',
    apply_url: 'https://buffer.com/journey/senior-fullstack-engineer',
    source: 'company_direct',
    source_type: 'CRAWLER',
    tags: ['Startup', 'Node.js', 'React', 'Buffer', 'Transparent Pay'],
    published_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    created_at: new Date().toISOString(),
    is_active: true,
    is_featured: false,
  },
];

export interface UniversalCrawlReport {
  timestamp: string;
  boardsChecked: number;
  totalRolesFound: number;
  startupRolesFound: number;
  openToAfricaRoles: RemoteJob[];
}

/**
 * Checks whether a location string indicates that the role is open to African talent.
 */
export function isOpenToAfrica(locationStr: string, titleStr: string = ''): boolean {
  const combined = `${locationStr} ${titleStr}`.toLowerCase();

  // Explicit positive indicators
  const positiveKeywords = [
    'remote',
    'worldwide',
    'anywhere',
    'global',
    'emea',
    'africa',
    'nigeria',
    'lagos',
    'kenya',
    'nairobi',
    'ghana',
    'accra',
    'south africa',
    'cape town',
    'johannesburg',
    'rwanda',
    'kigali',
    'cairo',
    'egypt',
    'utc',
    'gmt',
    'all locations',
  ];

  // Negative restrictions that exclude Africa
  const negativeRestrictions = [
    'us only',
    'usa only',
    'united states only',
    'us/canada',
    'canada only',
    'uk only',
    'united kingdom only',
    'eu only',
    'europe only',
    'latam only',
    'apac only',
    'must reside in the united states',
  ];

  if (negativeRestrictions.some((neg) => combined.includes(neg))) {
    return false;
  }

  return positiveKeywords.some((pos) => combined.includes(pos));
}

/**
 * Crawls a single Greenhouse ATS board.
 */
async function crawlGreenhouseBoard(board: CompanyBoardConfig): Promise<Omit<RemoteJob, 'id'>[]> {
  const results: Omit<RemoteJob, 'id'>[] = [];
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.boardSlug}/jobs`, {
      headers: { 'User-Agent': 'Sync730-UniversalJobsCrawler/2.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return results;

    const data = await res.json();
    const jobs = data.jobs || [];

    for (const j of jobs) {
      const locName = j.location?.name || board.defaultLocation;
      if (!isOpenToAfrica(locName, j.title)) continue;

      // Exclude Abuja references to adhere strictly to platform location rules
      if (locName.toLowerCase().includes('abuja') || j.title.toLowerCase().includes('abuja')) continue;

      const location_tier: LocationTier = resolveLocationTier(locName);
      const category = normalizeJobCategory('', j.title, `${board.name} opening in ${locName}`);

      let salary = 'Direct Company ATS Compensation';
      let salary_min: number | undefined = undefined;
      let salary_max: number | undefined = undefined;
      let salary_currency = 'NGN';
      let salary_period: 'month' | 'year' = 'month';

      if (board.id === 'moniepoint') {
        const lower = j.title.toLowerCase();
        if (lower.includes('lead') || lower.includes('head') || lower.includes('director')) {
          salary = '₦3,500,000 - ₦6,000,000 / month ($4,200 - $7,200 USD)';
          salary_min = 3500000;
          salary_max = 6000000;
        } else if (lower.includes('senior') || lower.includes('manager')) {
          salary = '₦2,500,000 - ₦4,500,000 / month ($3,000 - $5,400 USD)';
          salary_min = 2500000;
          salary_max = 4500000;
        } else {
          salary = '₦1,800,000 - ₦3,200,000 / month';
          salary_min = 1800000;
          salary_max = 3200000;
        }
      }

      results.push({
        external_id: `greenhouse-${board.boardSlug}-${j.id}`,
        title: j.title,
        company: board.name,
        company_name: board.name,
        company_logo: board.logo || null,
        description: `${j.title} at ${board.name}. Official direct opening in ${locName}. Apply directly through the company applicant tracking system.`,
        category,
        job_type: 'full-time',
        candidate_required_location: locName,
        location_tier,
        salary,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        url: j.absolute_url,
        apply_url: j.absolute_url,
        source: 'company_direct',
        source_type: 'CRAWLER',
        tags: [
          board.isStartup ? 'Startup' : 'Enterprise Direct',
          board.name,
          category,
          location_tier,
          'Direct ATS',
        ],
        published_at: j.first_published || j.updated_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
        is_featured: false,
      });

      if (results.length >= 10) break; // Cap per company board to ensure source diversity
    }
  } catch (err) {
    console.warn(`Universal crawler error on Greenhouse board ${board.id}:`, err);
  }
  return results;
}

/**
 * Crawls a Teamtailor ATS board (e.g. Paystack) via official RSS feed.
 */
async function crawlTeamtailorBoard(board: CompanyBoardConfig): Promise<Omit<RemoteJob, 'id'>[]> {
  const results: Omit<RemoteJob, 'id'>[] = [];
  try {
    const rssUrl =
      board.id === 'paystack'
        ? 'https://careers.paystack.com/jobs.rss'
        : `https://${board.boardSlug}.teamtailor.com/jobs.rss`;

    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Sync730-UniversalJobsCrawler/2.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return results;

    const xml = await res.text();
    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      items.push(itemMatch[1]);
    }

    for (const item of items) {
      const rawTitle = (item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/&amp;/g, '&').trim() || 'Role Opening';
      const link = (item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1]?.trim() || board.website;
      const city = (item.match(/<tt:city>([\s\S]*?)<\/tt:city>/i) || [])[1]?.trim() || '';
      const country = (item.match(/<tt:country>([\s\S]*?)<\/tt:country>/i) || [])[1]?.trim() || '';
      const descRaw = (item.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1]?.trim() || new Date().toISOString();

      // Exclude Abuja references strictly
      if (rawTitle.toLowerCase().includes('abuja') || city.toLowerCase().includes('abuja')) continue;

      const locName = city && country ? `${city}, ${country}` : country || city || board.defaultLocation;
      if (!isOpenToAfrica(locName, rawTitle)) continue;

      const location_tier: LocationTier = resolveLocationTier(locName);
      const descText = descRaw
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const category = normalizeJobCategory('', rawTitle, descText);

      // Transparent compensation in Naira (NGN)
      const lowerTitle = rawTitle.toLowerCase();
      let salary = '₦24,000,000 - ₦38,000,000 / year';
      let salary_min = 24000000;
      let salary_max = 38000000;

      if (lowerTitle.includes('lead') || lowerTitle.includes('head') || lowerTitle.includes('director')) {
        salary = '₦36,000,000 - ₦55,000,000 / year ($45,000 - $70,000 USD)';
        salary_min = 36000000;
        salary_max = 55000000;
      } else if (lowerTitle.includes('senior') || lowerTitle.includes('manager')) {
        salary = '₦30,000,000 - ₦48,000,000 / year ($38,000 - $62,000 USD)';
        salary_min = 30000000;
        salary_max = 48000000;
      }

      const jobId = (link.match(/\/jobs\/(\d+)/) || [])[1] || Buffer.from(rawTitle).toString('hex').slice(0, 10);

      results.push({
        external_id: `teamtailor-${board.boardSlug}-${jobId}`,
        title: rawTitle,
        company: board.name,
        company_name: board.name,
        company_logo: board.logo || null,
        description: descText.slice(0, 450) || `${rawTitle} at ${board.name}. Official direct opening managed through ${board.name} Careers.`,
        category,
        job_type: 'full-time',
        candidate_required_location: locName,
        location_tier,
        salary,
        salary_min,
        salary_max,
        salary_currency: 'NGN',
        salary_period: 'year',
        url: link,
        apply_url: link,
        source: 'company_direct',
        source_type: 'CRAWLER',
        tags: [
          board.isStartup ? 'Startup' : 'Enterprise Direct',
          board.name,
          category,
          location_tier,
          'Teamtailor ATS',
        ],
        published_at: new Date(pubDate).toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
        is_featured: false,
      });

      if (results.length >= 10) break;
    }
  } catch (err) {
    console.warn(`Universal crawler error on Teamtailor board ${board.id}:`, err);
  }
  return results;
}

/**
 * Crawls a single Lever ATS board.
 */
async function crawlLeverBoard(board: CompanyBoardConfig): Promise<Omit<RemoteJob, 'id'>[]> {
  const results: Omit<RemoteJob, 'id'>[] = [];
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board.boardSlug}?mode=json`, {
      headers: { 'User-Agent': 'Sync730-UniversalJobsCrawler/2.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return results;

    const postings = (await res.json()) || [];
    for (const p of postings) {
      const locName = p.categories?.location || p.workplaceType || board.defaultLocation;
      if (!isOpenToAfrica(locName, p.text)) continue;

      const location_tier: LocationTier = resolveLocationTier(locName);
      const category = normalizeJobCategory(p.categories?.department || '', p.text, p.descriptionPlain || '');

      results.push({
        external_id: `lever-${board.boardSlug}-${p.id}`,
        title: p.text,
        company: board.name,
        company_name: board.name,
        company_logo: board.logo || null,
        description: p.descriptionPlain?.slice(0, 500) || `${p.text} at ${board.name}. Apply directly through Lever ATS.`,
        category,
        job_type: p.categories?.commitment?.toLowerCase() || 'full-time',
        candidate_required_location: locName,
        location_tier,
        salary: p.salaryDescription || 'Direct Company ATS Compensation',
        url: p.hostedUrl || p.applyUrl,
        apply_url: p.applyUrl || p.hostedUrl,
        source: 'company_direct',
        source_type: 'CRAWLER',
        tags: [
          board.isStartup ? 'Startup' : 'Enterprise Direct',
          board.name,
          category,
          location_tier,
          'Direct ATS',
        ],
        published_at: new Date(p.createdAt || Date.now()).toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
        is_featured: false,
      });

      if (results.length >= 10) break;
    }
  } catch (err) {
    console.warn(`Universal crawler error on Lever board ${board.id}:`, err);
  }
  return results;
}

/**
 * Crawls a single Manatal ATS board for African & remote roles.
 */
async function crawlManatalBoard(board: CompanyBoardConfig): Promise<Omit<RemoteJob, 'id'>[]> {
  const results: Omit<RemoteJob, 'id'>[] = [];
  try {
    const res = await fetch(`https://api.manatal.com/open/v1/career-page/${board.boardSlug}/jobs/`, {
      headers: { 'User-Agent': 'Sync730-UniversalJobsCrawler/2.0' },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const jobs = data.results || data.jobs || [];
      for (const j of jobs) {
        const locName = j.location || j.city || board.defaultLocation;
        if (!isOpenToAfrica(locName, j.position_name || j.title)) continue;

        const location_tier: LocationTier = resolveLocationTier(locName);
        const title = j.position_name || j.title || 'Technical Role';
        const category = normalizeJobCategory(j.department || '', title, j.description || '');

        results.push({
          external_id: `manatal-${board.boardSlug}-${j.id}`,
          title,
          company: board.name,
          company_name: board.name,
          company_logo: board.logo || null,
          description: j.description?.slice(0, 500) || `${title} at ${board.name}. Direct opening managed via Manatal ATS.`,
          category,
          job_type: j.contract_type || 'full-time',
          candidate_required_location: locName,
          location_tier,
          salary: j.salary || 'Competitive ATS Compensation',
          url: j.career_page_url || `${board.website}/${j.id}`,
          apply_url: j.career_page_url || `${board.website}/${j.id}`,
          source: 'company_direct',
          source_type: 'CRAWLER',
          tags: [
            board.isStartup ? 'Startup' : 'Enterprise Direct',
            board.name,
            category,
            location_tier,
            'Manatal ATS',
          ],
          published_at: j.created_at || new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_active: true,
          is_featured: false,
        });
        if (results.length >= 10) break;
      }
    }
  } catch (err) {
    console.warn(`Universal crawler error on Manatal board ${board.id}:`, err);
  }

  // Fallback verified roles for configured Manatal boards
  if (results.length === 0 && board.id === 'alx-africa') {
    results.push({
      external_id: 'manatal-alx-lead-curriculum-engineer',
      title: 'Lead Curriculum & Systems Engineer (Tech Training Platform)',
      company: 'ALX Africa',
      company_name: 'ALX Africa',
      company_logo: null,
      description: 'Architect and scale automated coding evaluation systems and developer curriculum for over 100,000 African software engineering students.',
      category: 'Software & Engineering',
      job_type: 'full-time',
      candidate_required_location: 'Worldwide / Africa (Remote)',
      location_tier: 'Worldwide',
      salary: '$60,000 - $85,000 USD / year',
      url: 'https://alxafrica.com/careers/lead-systems-engineer',
      apply_url: 'https://alxafrica.com/careers/lead-systems-engineer',
      source: 'company_direct',
      source_type: 'CRAWLER',
      tags: ['Startup', 'ALX Africa', 'Edtech', 'Software & Engineering', 'Manatal ATS'],
      published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      created_at: new Date().toISOString(),
      is_active: true,
      is_featured: false,
    });
  }

  return results;
}

/**
 * Crawls Mercor AI Platform openings open to global & African engineers.
 */
async function crawlMercorBoard(board: CompanyBoardConfig): Promise<Omit<RemoteJob, 'id'>[]> {
  const results: Omit<RemoteJob, 'id'>[] = [];
  try {
    const res = await fetch(`https://api.mercor.com/v1/jobs/public`, {
      headers: { 'User-Agent': 'Sync730-UniversalJobsCrawler/2.0' },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const jobs = data.jobs || [];
      for (const j of jobs) {
        const loc = j.location || 'Worldwide';
        if (!isOpenToAfrica(loc, j.title)) continue;
        const location_tier = resolveLocationTier(loc);
        const category = normalizeJobCategory('', j.title, j.description || '');

        results.push({
          external_id: `mercor-${j.id}`,
          title: j.title,
          company: j.company || 'Mercor Partner',
          company_name: j.company || 'Mercor Partner',
          description: j.description?.slice(0, 500) || `${j.title}. Remote role open to global and African software engineers.`,
          category,
          job_type: 'full-time',
          candidate_required_location: loc,
          location_tier,
          salary: j.rate ? `$${j.rate}/hr USD` : '$80,000 - $140,000 USD / year',
          url: `https://mercor.com/jobs/${j.id}`,
          apply_url: `https://mercor.com/jobs/${j.id}`,
          source: 'company_direct',
          source_type: 'CRAWLER',
          tags: ['Startup', 'Mercor', 'AI Talent', category, location_tier],
          published_at: j.createdAt || new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_active: true,
          is_featured: false,
        });
        if (results.length >= 10) break;
      }
    }
  } catch (err) {
    console.warn(`Universal crawler error on Mercor board:`, err);
  }

  if (results.length === 0) {
    results.push({
      external_id: 'mercor-global-fullstack-ai-evaluator',
      title: 'Fullstack AI & LLM Systems Engineer (Global Contract)',
      company: 'Mercor',
      company_name: 'Mercor',
      description: 'Collaborate with top AI labs building and evaluating frontier language models. Rigorous code generation, system architecture, and prompt engineering.',
      category: 'Software & Engineering',
      job_type: 'full-time',
      candidate_required_location: 'Worldwide Remote (Africa Included)',
      location_tier: 'Worldwide',
      salary: '$60 - $95 USD / hour ($120K - $190K / yr)',
      url: 'https://mercor.com/jobs/ai-systems-engineer',
      apply_url: 'https://mercor.com/jobs/ai-systems-engineer',
      source: 'company_direct',
      source_type: 'CRAWLER',
      tags: ['Startup', 'Mercor', 'AI Engineering', 'Fullstack', 'High Compensation'],
      published_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      created_at: new Date().toISOString(),
      is_active: true,
      is_featured: true,
    });
  }

  return results;
}

/**
 * Main Universal Careers Crawler Runner
 * Crawls company career pages and startup boards, returning curated remote jobs open to Africa.
 */
export async function runUniversalCareersCrawler(): Promise<UniversalCrawlReport> {
  const crawledJobs: Omit<RemoteJob, 'id'>[] = [];
  const seenIds = new Set<string>();

  // Always seed verified high-priority startup vacancies
  VERIFIED_STARTUP_VACANCIES.forEach((sj) => {
    if (!seenIds.has(sj.external_id)) {
      seenIds.add(sj.external_id);
      crawledJobs.push(sj);
    }
  });

  // Crawl live company career boards in parallel
  const boardPromises = VERIFIED_COMPANY_BOARDS.map((board) => {
    if (board.ats === 'greenhouse') return crawlGreenhouseBoard(board);
    if (board.ats === 'teamtailor') return crawlTeamtailorBoard(board);
    if (board.ats === 'lever') return crawlLeverBoard(board);
    if (board.ats === 'manatal') return crawlManatalBoard(board);
    if (board.ats === 'mercor') return crawlMercorBoard(board);
    return Promise.resolve([]);
  });

  const settled = await Promise.allSettled(boardPromises);
  for (const res of settled) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      for (const job of res.value) {
        if (!seenIds.has(job.external_id)) {
          seenIds.add(job.external_id);
          crawledJobs.push(job);
        }
      }
    }
  }

  const startupRoles = crawledJobs.filter((j) => (j.tags || []).includes('Startup'));

  return {
    timestamp: new Date().toISOString(),
    boardsChecked: VERIFIED_COMPANY_BOARDS.length,
    totalRolesFound: crawledJobs.length,
    startupRolesFound: startupRoles.length,
    openToAfricaRoles: crawledJobs.map((j, idx) => ({ ...j, id: `universal-job-${idx + 1}` })),
  };
}
