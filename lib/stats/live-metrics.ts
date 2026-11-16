// lib/stats/live-metrics.ts
// Single live-numbers helper for platform metrics:
// - "Roles live now" (rolesLiveNow)
// - "Countries roles are open to" (countriesCount)
// - "Employers hiring" (employersCount)
// - "Updated {relative time}" (updatedAt)
// Strictly excludes demo, test, and zero-salary data. No hardcoded baselines.

import { getAllApprovedJobs } from '@/lib/jobs/service';
import { getWaitlistEntries } from '@/lib/waitlist/store';
import { getAllCandidateProfilesServer } from '@/lib/candidate/profile-store';

export interface LivePlatformMetrics {
  rolesLiveNow: number;
  countriesCount: number;
  employersCount: number;
  updatedAt: string;
  // Backward compatibility fields
  rolesLive: number;
  rolesLast24h: number;
  talents: number;
  partners: number;
}

/**
 * Returns the single source of truth for all live platform counters.
 * Excludes demo, test and seed data from the counts (e.g. TEST CORP, ws-sync730-demo, $0 salary, titles with "Test").
 */
export function computeLivePlatformMetrics(): LivePlatformMetrics {
  const allApproved = getAllApprovedJobs();

  // Exclude demo, test and invalid data from counts
  const cleanJobs = allApproved.filter((job) => {
    const company = (job.company_name || job.company || '').trim();
    const title = (job.title || '').trim();
    const workspaceId = (job as any).workspace_id;
    const rawSalary = String(job.salary || '').trim();

    // Exclude demo workspaces (e.g. ws-sync730-demo)
    if (workspaceId === 'ws-sync730-demo') return false;

    // Exclude test companies (e.g. TEST CORP, /test/i)
    if (/test/i.test(company) || company.toUpperCase().includes('TEST CORP')) return false;

    // Exclude test titles
    if (/test/i.test(title)) return false;

    // Exclude $0 salary jobs
    if (rawSalary === '$0' || rawSalary === '0' || rawSalary === '0 USD') return false;
    if (typeof job.salary_min === 'number' && typeof job.salary_max === 'number' && job.salary_max === 0) return false;

    return true;
  });

  const rolesLiveNow = cleanJobs.length;

  // Extract distinct countries
  const countrySet = new Set<string>();
  cleanJobs.forEach((job) => {
    const list = Array.isArray(job.eligible_countries) && job.eligible_countries.length > 0
      ? job.eligible_countries
      : Array.isArray(job.eligibility?.countries)
      ? job.eligibility.countries
      : [];

    list.forEach((c) => {
      const trimmed = (c || '').trim();
      if (
        trimmed &&
        !['worldwide', 'remote', 'global', 'all african countries'].includes(trimmed.toLowerCase())
      ) {
        countrySet.add(trimmed);
      }
    });
  });
  const countriesCount = countrySet.size;

  // Extract distinct employers
  const employerSet = new Set<string>();
  cleanJobs.forEach((job) => {
    const c = (job.company_name || job.company || '').trim();
    if (c) employerSet.add(c.toLowerCase());
  });
  const employersCount = employerSet.size;

  // Real candidate pool (talents) from waitlist and candidate profiles
  let talentsCount = 0;
  try {
    const waitlist = getWaitlistEntries();
    const candidateProfiles = getAllCandidateProfilesServer();

    const emailSet = new Set<string>();
    waitlist.forEach((w) => {
      const email = (w.email || '').toLowerCase();
      if (
        w.consent &&
        !email.includes('@test.') &&
        !email.includes('@example.') &&
        !email.includes('demo') &&
        !email.includes('seed')
      ) {
        emailSet.add(email);
      }
    });

    candidateProfiles.forEach((p) => {
      const email = (p.email || '').toLowerCase();
      if (
        p.email_verified &&
        !email.includes('@test.') &&
        !email.includes('@example.') &&
        !email.includes('demo') &&
        !email.includes('seed')
      ) {
        emailSet.add(email);
      }
    });

    talentsCount = emailSet.size;
  } catch {}

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const recentApproved = cleanJobs.filter((job) => {
    const t = new Date(job.posted_date || job.roleVerifiedAt || 0).getTime();
    return t >= oneDayAgo;
  });
  const rolesLast24h = Math.min(rolesLiveNow, recentApproved.length);

  return {
    rolesLiveNow,
    countriesCount,
    employersCount,
    updatedAt: new Date().toISOString(),
    rolesLive: rolesLiveNow,
    rolesLast24h,
    talents: talentsCount,
    partners: employersCount,
  };
}

export async function getPlatformLiveMetrics(): Promise<LivePlatformMetrics> {
  return computeLivePlatformMetrics();
}
