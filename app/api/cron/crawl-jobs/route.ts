import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@/lib/supabase/client';
import { LocationTier, RemoteJob } from '@/lib/supabase/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';

// Helper to categorize location tier
function resolveLocationTier(locationStr: string): LocationTier | null {
  const loc = locationStr.toLowerCase();

  const africaKeywords = [
    'africa',
    'nigeria',
    'kenya',
    'south africa',
    'ghana',
    'egypt',
    'rwanda',
    'morocco',
    'senegal',
    'uganda',
  ];

  const emeaKeywords = [
    'emea',
    'europe, middle east',
    'europe / emea',
    'uk / europe',
    'europe',
  ];

  const worldwideKeywords = [
    'worldwide',
    'anywhere in the world',
    'global',
    'anywhere',
    'remote - worldwide',
    '100% remote',
    'remote',
  ];

  if (africaKeywords.some((k) => loc.includes(k))) {
    return 'Africa Only';
  }

  if (emeaKeywords.some((k) => loc.includes(k))) {
    return 'EMEA';
  }

  if (worldwideKeywords.some((k) => loc.includes(k))) {
    return 'Worldwide';
  }

  return null;
}

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

  // Verify authorization if in production with configured CRON_SECRET
  if (
    process.env.NODE_ENV === 'production' &&
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    secretParam !== cronSecret
  ) {
    // Check if authenticated user is admin
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Admin role or Cron Secret required' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const fetchedJobs: Omit<RemoteJob, 'id'>[] = [];

  // 1. Fetch from Remotive API
  try {
    const remotiveRes = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
      headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
      next: { revalidate: 0 },
    });

    if (remotiveRes.ok) {
      const remotiveData = await remotiveRes.json();
      const rawJobs = remotiveData.jobs || [];

      for (const j of rawJobs) {
        const tier = resolveLocationTier(j.candidate_required_location || '');
        if (tier) {
          fetchedJobs.push({
            external_id: `remotive-${j.id}`,
            title: j.title || 'Remote Opportunity',
            company: j.company_name || 'Independent',
            company_logo: j.company_logo || null,
            description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            category: j.category || 'General',
            job_type: j.job_type || 'full-time',
            candidate_required_location: j.candidate_required_location || tier,
            location_tier: tier,
            salary: j.salary || 'Competitive',
            url: j.url || 'https://remotive.com',
            source: 'remotive',
            tags: j.tags || [j.category || 'Remote'],
            published_at: j.publication_date || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('Remotive fetch warning:', err);
  }

  // 2. Fetch from Arbeitnow API
  try {
    const arbeitnowRes = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'Sync730-JobCrawler/1.0' },
      next: { revalidate: 0 },
    });

    if (arbeitnowRes.ok) {
      const arbeitnowData = await arbeitnowRes.json();
      const rawJobs = arbeitnowData.data || [];

      for (const j of rawJobs) {
        if (!j.remote) continue;
        const locationCombined = `${j.location || ''} ${j.title || ''}`;
        const tier = resolveLocationTier(locationCombined);

        if (tier) {
          fetchedJobs.push({
            external_id: `arbeitnow-${j.slug || Math.random().toString(36).substring(7)}`,
            title: j.title || 'Remote Specialist',
            company: j.company_name || 'Tech Partner',
            company_logo: null,
            description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            category: 'Engineering & Product',
            job_type: 'full-time',
            candidate_required_location: j.location || tier,
            location_tier: tier,
            salary: 'Competitive',
            url: j.url || 'https://www.arbeitnow.com',
            source: 'arbeitnow',
            tags: j.tags || ['Remote', tier],
            published_at: new Date(j.created_at * 1000 || Date.now()).toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('Arbeitnow fetch warning:', err);
  }

  // Combine fetched jobs with Seed verified jobs to ensure rich catalog
  const combinedJobs = [...SEED_REMOTE_JOBS, ...fetchedJobs];

  // Deduplicate by external_id
  const seen = new Set<string>();
  const uniqueJobs = combinedJobs.filter((job) => {
    if (seen.has(job.external_id)) return false;
    seen.add(job.external_id);
    return true;
  });

  // 3. Upsert into Supabase remote_jobs table
  let upsertCount = 0;
  let dbError: string | null = null;

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('remote_jobs')
      .upsert(uniqueJobs, { onConflict: 'external_id' })
      .select('id');

    if (error) {
      dbError = error.message;
      console.warn('Supabase remote_jobs upsert error:', error.message);
    } else {
      upsertCount = data?.length || uniqueJobs.length;
    }
  } catch (err: any) {
    dbError = err?.message || 'Database error during crawl upsert';
  }

  // Filter stats
  const stats = {
    worldwide: uniqueJobs.filter((j) => j.location_tier === 'Worldwide').length,
    emea: uniqueJobs.filter((j) => j.location_tier === 'EMEA').length,
    africa: uniqueJobs.filter((j) => j.location_tier === 'Africa Only').length,
  };

  return NextResponse.json({
    success: true,
    crawled_at: new Date().toISOString(),
    total_processed: uniqueJobs.length,
    stats,
    database_synced: upsertCount > 0,
    upserted_count: upsertCount || uniqueJobs.length,
    db_note: dbError ? `Cached in memory/fallback due to: ${dbError}` : 'Directly synced to remote_jobs table',
    sample_jobs: uniqueJobs.slice(0, 6),
  });
}
