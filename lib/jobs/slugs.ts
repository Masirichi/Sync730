// lib/jobs/slugs.ts
// Utility functions for generating and resolving SEO-friendly job slugs.

/**
 * Generates an SEO-friendly slug for a job.
 * Format: [title]-[company]-[location]-[id-suffix]
 * Example: senior-backend-engineer-acme-lagos-1234
 */
export function generateJobSlug(job: {
  id: string;
  title?: string;
  company?: string;
  company_name?: string;
  location?: string;
  location_tier?: string;
  candidate_required_location?: string;
}): string {
  const cleanPart = (str?: string) =>
    (str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const titlePart = cleanPart(job.title) || 'job-opportunity';
  const companyPart = cleanPart(job.company_name || job.company) || 'sync730';
  const locationPart =
    cleanPart(job.candidate_required_location || job.location_tier || job.location) || 'remote';

  // Suffix is clean last 4-8 chars of job id
  const rawId = job.id || '1000';
  const idSuffix = cleanPart(rawId).slice(-8) || '1000';

  return `${titlePart}-${companyPart}-${locationPart}-${idSuffix}`;
}

/**
 * Checks whether a given string matches or contains the job's slug or ID.
 */
export function matchesJobSlug(
  slugOrId: string,
  job: { id: string; slug?: string; title?: string; company?: string; [key: string]: any }
): boolean {
  if (!slugOrId) return false;
  const target = slugOrId.toLowerCase().trim();

  // Exact ID match
  if (job.id.toLowerCase() === target) return true;

  // Exact slug match
  if (job.slug && job.slug.toLowerCase() === target) return true;

  // Generated slug match
  const generated = generateJobSlug(job);
  if (generated.toLowerCase() === target) return true;

  // Suffix matching (e.g. if slug ends with the job ID)
  if (target.endsWith(job.id.toLowerCase())) return true;
  const cleanId = job.id.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const cleanTarget = target.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (cleanTarget.endsWith(cleanId)) return true;

  return false;
}
