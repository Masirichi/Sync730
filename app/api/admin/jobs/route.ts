import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerJobs, saveServerJob } from '@/lib/admin/server-store';
import { AdminRemoteJob } from '@/lib/admin/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // 1. Fetch remote_jobs from Supabase
    let remoteJobs: any[] = [];
    try {
      const { data, error } = await supabase
        .from('remote_jobs')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        remoteJobs = data;
      }
    } catch {
      // Fallback
    }

    // 2. Fetch employer_jobs from Supabase
    let employerJobs: any[] = [];
    try {
      const { data, error } = await supabase
        .from('employer_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        employerJobs = data;
      }
    } catch {
      // Fallback
    }

    // 3. Merge with admin persistent store curated jobs
    const adminJobs = getServerJobs();
    
    // Combine and deduplicate
    const combinedRemote: AdminRemoteJob[] = [...adminJobs];
    const seenIds = new Set(adminJobs.map((j) => j.id));

    // Add Supabase jobs if not in admin store
    remoteJobs.forEach((rj: any) => {
      const id = rj.id || rj.external_id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        combinedRemote.push({
          id,
          external_id: rj.external_id || id,
          title: rj.title,
          company: rj.company,
          career_url: rj.url || '#',
          url: rj.url || '#',
          location_tier: rj.location_tier || 'Worldwide',
          candidate_required_location: rj.candidate_required_location || 'Remote',
          salary: rj.salary || null,
          description: rj.description || '',
          category: rj.category || 'Software & Engineering',
          job_type: rj.job_type || 'Full-time',
          tags: rj.tags || [],
          source: rj.source || 'remotive',
          source_type: rj.source_type || 'CRAWLER',
          is_active: rj.is_active !== undefined ? rj.is_active : true,
          is_featured: rj.is_featured !== undefined ? rj.is_featured : false,
          published_at: rj.published_at || new Date().toISOString(),
          created_at: rj.created_at || new Date().toISOString(),
        });
      }
    });

    // Also include initial seed jobs if DB is completely empty
    if (combinedRemote.length <= adminJobs.length) {
      SEED_REMOTE_JOBS.slice(0, 10).forEach((sj, idx) => {
        const id = `seed-job-${idx + 1}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          combinedRemote.push({
            id,
            external_id: sj.external_id || id,
            title: sj.title,
            company: sj.company,
            career_url: sj.url || '#',
            url: sj.url || '#',
            location_tier: sj.location_tier || 'Worldwide',
            candidate_required_location: sj.candidate_required_location || 'Remote',
            salary: sj.salary || null,
            description: sj.description || '',
            category: sj.category || 'Software & Engineering',
            job_type: sj.job_type || 'Full-time',
            tags: sj.tags || [],
            source: sj.source || 'remotive',
            source_type: 'CRAWLER',
            is_active: true,
            is_featured: false,
            published_at: sj.published_at || new Date().toISOString(),
            created_at: sj.published_at || new Date().toISOString(),
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      remote_jobs: combinedRemote,
      employer_jobs: employerJobs,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/jobs GET:', err);
    return NextResponse.json(
      { success: false, error: err.message, remote_jobs: getServerJobs(), employer_jobs: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_name,
      job_title,
      career_url,
      region_allowance,
      salary_range,
      job_description,
      is_featured,
    } = body;

    if (!company_name || !job_title || !career_url || !region_allowance) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory job fields.' },
        { status: 400 }
      );
    }

    const newId = `admin-job-${Date.now()}`;
    const externalId = `ext-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newJob: AdminRemoteJob = {
      id: newId,
      external_id: externalId,
      title: job_title.trim(),
      company: company_name.trim(),
      career_url: career_url.trim(),
      url: career_url.trim(),
      location_tier: region_allowance as 'Worldwide' | 'EMEA' | 'Africa Only',
      candidate_required_location:
        region_allowance === 'Africa Only'
          ? 'Africa Only (Remote)'
          : region_allowance === 'EMEA'
          ? 'EMEA Remote'
          : 'Worldwide Remote',
      salary: salary_range?.trim() || null,
      description: job_description?.trim() || 'Verified remote role posted directly by Platform Admin.',
      category: 'Software & Engineering',
      job_type: 'Full-time',
      tags: ['Verified Partner', 'Platform Curated', region_allowance],
      source: 'company_direct',
      source_type: 'ADMIN_CURATED',
      is_active: true,
      is_featured: Boolean(is_featured),
      published_at: nowIso,
      created_at: nowIso,
    };

    // 1. Save in server persistent store
    const savedJob = saveServerJob(newJob);

    // 2. Try persisting to Supabase if connected
    try {
      const supabase = await createServerClient();
      await supabase.from('remote_jobs').insert({
        id: newJob.id,
        external_id: newJob.external_id,
        title: newJob.title,
        company: newJob.company,
        location_tier: newJob.location_tier,
        candidate_required_location: newJob.candidate_required_location,
        salary: newJob.salary,
        url: newJob.url,
        source: 'company_direct',
        source_type: 'ADMIN_CURATED',
        is_active: true,
        is_featured: newJob.is_featured,
        description: newJob.description,
        tags: newJob.tags,
        category: newJob.category,
        job_type: newJob.job_type,
        published_at: nowIso,
        created_at: nowIso,
      });
    } catch (dbErr) {
      console.warn('Notice: Remote jobs DB insert fallback:', dbErr);
    }

    return NextResponse.json({
      success: true,
      job: savedJob,
      message: 'Verified job successfully published to candidate board.',
    });
  } catch (err: any) {
    console.error('Error in /api/admin/jobs POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to publish job' },
      { status: 500 }
    );
  }
}
