// lib/jobs/platform-detector.ts
// Multi-Platform ATS & Career Board Detection, Metadata, and Cross-Platform Link Optimization

export type JobPlatform =
  | 'direct'
  | 'manatal'
  | 'mercor'
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workable'
  | 'bamboohr'
  | 'smartrecruiters'
  | 'other';

export interface JobPlatformInfo {
  id: JobPlatform;
  name: string;
  shortName: string;
  badgeClass: string;
  category: 'direct_ats' | 'talent_network' | 'direct_company' | 'external_board';
  description: string;
  isPopularInAfrica: boolean;
}

export const PLATFORM_REGISTRY: Record<JobPlatform, JobPlatformInfo> = {
  direct: {
    id: 'direct',
    name: 'Direct Company Career Page',
    shortName: 'Direct Career',
    badgeClass: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20',
    category: 'direct_company',
    description: 'Direct company careers portal with zero intermediary fee or screening friction.',
    isPopularInAfrica: true,
  },
  manatal: {
    id: 'manatal',
    name: 'Manatal ATS',
    shortName: 'Manatal',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    category: 'direct_ats',
    description: 'AI-powered recruitment software used widely by African tech enterprises & remote agencies.',
    isPopularInAfrica: true,
  },
  mercor: {
    id: 'mercor',
    name: 'Mercor AI Marketplace',
    shortName: 'Mercor',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    category: 'talent_network',
    description: 'High-compensation AI & software engineering platform open to worldwide and African talents.',
    isPopularInAfrica: true,
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse ATS',
    shortName: 'Greenhouse',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    category: 'direct_ats',
    description: 'Industry standard enterprise ATS used by Moniepoint, Paystack, and Stripe.',
    isPopularInAfrica: true,
  },
  lever: {
    id: 'lever',
    name: 'Lever ATS',
    shortName: 'Lever',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    category: 'direct_ats',
    description: 'High-velocity modern ATS used by Chowdeck, Flutterwave, and global tech teams.',
    isPopularInAfrica: true,
  },
  ashby: {
    id: 'ashby',
    name: 'Ashby ATS',
    shortName: 'Ashby',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    category: 'direct_ats',
    description: 'Next-generation candidate experience ATS used by leading Silicon Valley & African startups.',
    isPopularInAfrica: true,
  },
  workable: {
    id: 'workable',
    name: 'Workable ATS',
    shortName: 'Workable',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    category: 'direct_ats',
    description: 'Global recruiting ATS with dedicated candidate mobile web application pages.',
    isPopularInAfrica: true,
  },
  bamboohr: {
    id: 'bamboohr',
    name: 'BambooHR',
    shortName: 'BambooHR',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    category: 'direct_ats',
    description: 'HR and applicant tracking system powering mid-market corporate career boards.',
    isPopularInAfrica: true,
  },
  smartrecruiters: {
    id: 'smartrecruiters',
    name: 'SmartRecruiters',
    shortName: 'SmartRecruiters',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    category: 'direct_ats',
    description: 'Enterprise talent acquisition platform used by multinational corporations.',
    isPopularInAfrica: false,
  },
  other: {
    id: 'other',
    name: 'External Verified Platform',
    shortName: 'Verified Board',
    badgeClass: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    category: 'external_board',
    description: 'Verified remote vacancy listed on external vetted technical boards.',
    isPopularInAfrica: false,
  },
};

export const ALL_SUPPORTED_PLATFORMS: JobPlatformInfo[] = Object.values(PLATFORM_REGISTRY);

/**
 * Automatically inspects a URL and determines which platform or ATS powers it.
 */
export function detectJobPlatform(rawUrl?: string | null): JobPlatform {
  if (!rawUrl || typeof rawUrl !== 'string') return 'direct';

  const clean = rawUrl.toLowerCase().trim();

  // Manatal ATS
  if (clean.includes('manatal.com') || clean.includes('career.manatal') || clean.includes('/manatal/')) {
    return 'manatal';
  }

  // Mercor AI Platform
  if (clean.includes('mercor.com') || clean.includes('mercor.io') || clean.includes('/mercor')) {
    return 'mercor';
  }

  // Greenhouse ATS
  if (
    clean.includes('boards.greenhouse.io') ||
    clean.includes('greenhouse.io') ||
    clean.includes('gh_jid=') ||
    clean.includes('greenhouse_id')
  ) {
    return 'greenhouse';
  }

  // Lever ATS
  if (clean.includes('jobs.lever.co') || clean.includes('lever.co/')) {
    return 'lever';
  }

  // Ashby ATS
  if (clean.includes('jobs.ashbyhq.com') || clean.includes('ashbyhq.com/')) {
    return 'ashby';
  }

  // Workable ATS
  if (clean.includes('apply.workable.com') || clean.includes('workable.com/')) {
    return 'workable';
  }

  // BambooHR
  if (clean.includes('bamboohr.com') || clean.includes('.bamboohr.')) {
    return 'bamboohr';
  }

  // SmartRecruiters
  if (clean.includes('smartrecruiters.com') || clean.includes('jobs.smartrecruiters.com')) {
    return 'smartrecruiters';
  }

  // If it's a standard web URL, default to direct company career page
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return 'direct';
  }

  return 'other';
}

/**
 * Returns formatted metadata and badge information for any detected or assigned platform.
 */
export function getJobPlatformInfo(platformOrUrl?: string | null): JobPlatformInfo {
  if (!platformOrUrl) return PLATFORM_REGISTRY.direct;

  const resolvedKey = (
    Object.prototype.hasOwnProperty.call(PLATFORM_REGISTRY, platformOrUrl)
      ? platformOrUrl
      : detectJobPlatform(platformOrUrl)
  ) as JobPlatform;

  return PLATFORM_REGISTRY[resolvedKey] || PLATFORM_REGISTRY.direct;
}

/**
 * Optimizes a job URL for cross-platform navigation across Mobile (iOS/Android),
 * Tablets, and Desktop browsers, ensuring proper deep-linking and security protocols.
 */
export function optimizeUrlForPlatform(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let url = rawUrl.trim();
  if (!url) return '';

  // Upgrade insecure http to secure https for cross-platform mobile webview & browser security
  if (url.startsWith('http://')) {
    url = `https://${url.slice(7)}`;
  } else if (!url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    // Auto-clean unnecessary tracking parameters that cause mobile browser redirects to drop
    const paramsToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.startsWith('utm_') &&
        lowerKey !== 'utm_source' // keep standard source
      ) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach((k) => parsed.searchParams.delete(k));

    return parsed.toString();
  } catch {
    return url;
  }
}
