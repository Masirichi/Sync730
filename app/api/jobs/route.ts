import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerJobs } from '@/lib/admin/server-store';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { RemoteJob } from '@/lib/supabase/types';
import { normalizeJobCategory } from '@/lib/crawler/categories';
import { normalizeJobRecord, deduplicateJobs } from '@/lib/crawler/job-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let remoteJobs: any[] = [];

    // 1. Fetch from Supabase (using created_at ordering supported by PostgreSQL)
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('remote_jobs')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        remoteJobs = data;
      }
    } catch (dbErr) {
      // Fallback to server store
    }

    // 2. Fetch admin curated jobs from server persistent store
    const adminJobs = getServerJobs();

    // 3. Combine in a map
    const jobMap = new Map<string, RemoteJob>();

    // Baseline seed jobs
    SEED_REMOTE_JOBS.forEach((sj, idx) => {
      const id = `seed-job-${idx + 1}`;
      const normalized = normalizeJobRecord({
        ...sj,
        id,
        category: normalizeJobCategory(sj.category || '', sj.title, sj.description || ''),
        is_active: true,
        is_featured: false,
        source_type: 'CRAWLER',
      });
      jobMap.set(id, normalized);
    });

    // Supabase jobs (mapping column names)
    remoteJobs.forEach((rj: any) => {
      const id = rj.id || rj.external_id;
      const title = rj.job_title || rj.title || 'Verified Role';
      const company = rj.company_name || rj.company || 'Partner Employer';
      const url = rj.career_url || rj.url || '#';
      const location_tier = rj.region_allowance || rj.location_tier || 'Worldwide';
      const salary = rj.salary_range || rj.salary || undefined;
      const description = rj.job_description || rj.description || '';

      const normalized = normalizeJobRecord({
        ...rj,
        id,
        title,
        company,
        company_name: company,
        url,
        apply_url: url,
        location_tier,
        candidate_required_location: rj.candidate_required_location || location_tier,
        salary,
        description,
        source: rj.source || 'company_direct',
        source_name: 'Platform Curated',
        source_type: rj.source_type || 'ADMIN_CURATED',
        employer_type: rj.employer_type || 'direct',
        is_active: rj.is_active !== false,
        is_featured: Boolean(rj.is_featured),
        created_at: rj.created_at || new Date().toISOString(),
        published_at: rj.published_at || rj.created_at || new Date().toISOString(),
        posted_at: rj.posted_at || rj.created_at || new Date().toISOString(),
        category: normalizeJobCategory(rj.category || '', title, description),
      });
      jobMap.set(id, normalized);
    });

    // Admin curated jobs (latest edits take priority)
    adminJobs.forEach((aj) => {
      const normalized = normalizeJobRecord({
        id: aj.id,
        external_id: aj.external_id || aj.id,
        title: aj.title,
        company: aj.company,
        company_name: aj.company_name || aj.company,
        company_logo: aj.company_logo,
        description: aj.description,
        category: normalizeJobCategory(aj.category || '', aj.title, aj.description || ''),
        job_type: aj.job_type || 'Full-time',
        candidate_required_location: aj.candidate_required_location || aj.location_tier,
        location_tier: aj.location_tier,
        salary: aj.salary || undefined,
        url: aj.career_url || aj.url || undefined,
        apply_url: aj.apply_url || aj.career_url || aj.url || undefined,
        source: aj.source || 'company_direct',
        source_name: 'Platform Curated',
        source_type: aj.source_type || 'ADMIN_CURATED',
        employer_type: 'direct',
        tags: aj.tags,
        published_at: aj.published_at,
        created_at: aj.created_at,
        posted_at: aj.posted_at || aj.published_at || aj.created_at,
        last_verified_at: new Date().toISOString(),
        is_active: aj.is_active !== false,
        is_featured: Boolean(aj.is_featured),
      });
      jobMap.set(aj.id, normalized);
    });

    // Filter out inactive / taken down jobs
    const activeJobs = Array.from(jobMap.values()).filter((j) => j.is_active !== false);

    // Deduplicate by title + company + apply_url, keeping the most recent
    const deduplicated = deduplicateJobs(activeJobs);

    // Sort: Featured first (is_featured DESC), then newest first
    deduplicated.sort((a, b) => {
      if (Boolean(b.is_featured) !== Boolean(a.is_featured)) {
        return b.is_featured ? 1 : -1;
      }
      const timeB = new Date(b.created_at || b.published_at || b.posted_at || 0).getTime();
      const timeA = new Date(a.created_at || a.published_at || a.posted_at || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      jobs: deduplicated,
      total: deduplicated.length,
    });
  } catch (err: any) {
    console.error('Error in /api/jobs GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load remote jobs' },
      { status: 500 }
    );
  }
}
