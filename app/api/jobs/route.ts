import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerJobs } from '@/lib/admin/server-store';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { RemoteJob } from '@/lib/supabase/types';
import { normalizeJobCategory } from '@/lib/crawler/categories';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let remoteJobs: any[] = [];

    // 1. Fetch from Supabase
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('remote_jobs')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('is_featured', { ascending: false, nullsFirst: false })
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        remoteJobs = data;
      }
    } catch (dbErr) {
      // Fallback
    }

    // 2. Fetch admin curated jobs from server persistent store
    const adminJobs = getServerJobs();

    // 3. Combine in a map
    const jobMap = new Map<string, RemoteJob>();

    // Baseline seed jobs
    SEED_REMOTE_JOBS.forEach((sj, idx) => {
      const id = `seed-job-${idx + 1}`;
      jobMap.set(id, {
        ...sj,
        id,
        category: normalizeJobCategory(sj.category || '', sj.title, sj.description || ''),
        is_active: true,
        is_featured: false,
        source_type: 'CRAWLER',
      } as RemoteJob);
    });

    // Supabase jobs
    remoteJobs.forEach((rj: any) => {
      const id = rj.id || rj.external_id;
      jobMap.set(id, {
        ...rj,
        id,
        category: normalizeJobCategory(rj.category || '', rj.title, rj.description || ''),
      });
    });

    // Admin curated jobs (latest edits take priority)
    adminJobs.forEach((aj) => {
      jobMap.set(aj.id, {
        id: aj.id,
        external_id: aj.external_id || aj.id,
        title: aj.title,
        company: aj.company,
        company_logo: aj.company_logo,
        description: aj.description,
        category: normalizeJobCategory(aj.category || '', aj.title, aj.description || ''),
        job_type: aj.job_type || 'Full-time',
        candidate_required_location: aj.candidate_required_location || aj.location_tier,
        location_tier: aj.location_tier,
        salary: aj.salary,
        url: aj.career_url || aj.url,
        source: aj.source || 'company_direct',
        source_type: aj.source_type,
        tags: aj.tags,
        published_at: aj.published_at,
        created_at: aj.created_at,
        is_active: aj.is_active,
        is_featured: aj.is_featured,
      });
    });

    // Filter out inactive / taken down jobs
    const activeJobs = Array.from(jobMap.values()).filter((j) => j.is_active !== false);

    // Sort: Featured first (is_featured DESC), then newest first
    activeJobs.sort((a, b) => {
      if (Boolean(b.is_featured) !== Boolean(a.is_featured)) {
        return b.is_featured ? 1 : -1;
      }
      const timeB = new Date(b.created_at || b.published_at || 0).getTime();
      const timeA = new Date(a.created_at || a.published_at || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      jobs: activeJobs,
      total: activeJobs.length,
    });
  } catch (err: any) {
    console.error('Error in /api/jobs GET:', err);
    return NextResponse.json(
      { success: false, error: err.message, jobs: [] },
      { status: 500 }
    );
  }
}
