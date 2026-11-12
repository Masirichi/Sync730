import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@/lib/supabase/client';
import { JobSource } from '@/lib/supabase/types';
import { crawlSources, CRAWLER_ADAPTERS, JobCategory, JOB_CATEGORIES } from '@/lib/crawler';

export async function GET(request: NextRequest) {
  return handleJobCrawl(request);
}

export async function POST(request: NextRequest) {
  return handleJobCrawl(request);
}

async function handleJobCrawl(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const sourceParam = (url.searchParams.get('source') as JobSource | 'all') || 'all';
  const categoryParam = (url.searchParams.get('category') as JobCategory | 'all') || 'all';

  // Verify authorization if in production with configured CRON_SECRET
  if (
    process.env.NODE_ENV === 'production' &&
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    secretParam !== cronSecret
  ) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin role or Cron Secret required' },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Execute multi-source crawler with category normalization
  const { jobs, sourceCounts, categoryCounts, locationStats, crawledAt } =
    await crawlSources({
      source: sourceParam,
      category: categoryParam,
    });

  // Upsert into Supabase remote_jobs table
  let upsertCount = 0;
  let dbError: string | null = null;

  try {
    const supabase = createBrowserClient();
    const supabasePayload = jobs.map((j: any) => ({
      external_id: j.external_id,
      job_title: j.title,
      company_name: j.company || j.company_name,
      career_url: j.apply_url || j.url || j.source_url || '#',
      region_allowance: j.location_tier || 'Worldwide',
      salary_range: j.salary || null,
      job_description: j.description || '',
      source_type: 'CRAWLER',
      is_active: true,
      is_featured: false,
    }));

    const { data, error } = await supabase
      .from('remote_jobs')
      .upsert(supabasePayload, { onConflict: 'external_id' })
      .select('id');

    if (error) {
      dbError = error.message;
      console.warn('Supabase remote_jobs upsert notice:', error.message);
    } else {
      upsertCount = data?.length || jobs.length;
    }
  } catch (err: any) {
    dbError = err?.message || 'Database error during crawl upsert';
  }

  return NextResponse.json({
    success: true,
    crawled_at: crawledAt,
    target_category: categoryParam,
    target_source: sourceParam,
    total_processed: jobs.length,
    categories_summary: categoryCounts,
    sources_summary: sourceCounts,
    location_stats: locationStats,
    database_synced: upsertCount > 0,
    upserted_count: upsertCount || jobs.length,
    db_note: dbError
      ? `Retained in active memory feed (${dbError})`
      : 'Synced to Supabase remote_jobs table',
    available_categories: JOB_CATEGORIES,
    sample_jobs: jobs.slice(0, 15).map((j) => ({
      title: j.title,
      company: j.company,
      category: j.category,
      location_tier: j.location_tier,
      candidate_required_location: j.candidate_required_location,
      salary: j.salary,
      direct_apply_url: j.url,
      source: j.source,
    })),
  });
}
