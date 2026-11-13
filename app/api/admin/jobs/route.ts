import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { getServerJobs, saveServerJob } from '@/lib/admin/server-store';
import { AdminRemoteJob } from '@/lib/admin/types';
import { SEED_REMOTE_JOBS } from '@/lib/seed-jobs';
import { SAMPLE_NIGERIA_ROLES } from '@/lib/admin/store';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // 1. Fetch remote_jobs from Supabase (using created_at ordering supported by PostgreSQL)
    let remoteJobs: any[] = [];
    try {
      const { data, error } = await supabase
        .from('remote_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        remoteJobs = data;
      }
    } catch {
      // Fallback to server store
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

    // Add Supabase jobs if not in admin store (normalize column differences between schemas)
    remoteJobs.forEach((rj: any) => {
      const id = rj.id || rj.external_id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const title = rj.job_title || rj.title || 'Verified Role';
        const company = rj.company_name || rj.company || 'Partner Employer';
        const url = rj.career_url || rj.url || '#';
        const location_tier = rj.region_allowance || rj.location_tier || 'Worldwide';
        const salary = rj.salary_range || rj.salary || null;
        const description = rj.job_description || rj.description || 'Verified platform opportunity.';

        combinedRemote.push({
          id,
          external_id: rj.external_id || id,
          title,
          company,
          company_name: company,
          career_url: url,
          url,
          apply_url: url,
          location_tier,
          candidate_required_location: rj.candidate_required_location || location_tier,
          work_mode: rj.work_mode || (rj.candidate_required_location?.toLowerCase().includes('hybrid') ? 'HYBRID' : rj.candidate_required_location?.toLowerCase().includes('onsite') ? 'ONSITE' : 'REMOTE'),
          city_location: rj.city_location || null,
          salary,
          description,
          category: rj.category || 'Software & Engineering',
          job_type: rj.job_type || 'Full-time',
          tags: Array.isArray(rj.tags) ? rj.tags : ['Verified Partner', 'Platform Curated', location_tier],
          source: rj.source || 'company_direct',
          source_type: rj.source_type || 'ADMIN_CURATED',
          employer_type: rj.employer_type || 'direct',
          is_active: rj.is_active !== undefined ? rj.is_active : true,
          is_featured: rj.is_featured !== undefined ? rj.is_featured : false,
          published_at: rj.published_at || rj.created_at || new Date().toISOString(),
          created_at: rj.created_at || new Date().toISOString(),
          posted_at: rj.posted_at || rj.created_at || new Date().toISOString(),
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
            company_name: sj.company_name || sj.company,
            career_url: sj.url || '#',
            url: sj.url || '#',
            apply_url: sj.apply_url || sj.url || '#',
            location_tier: sj.location_tier || 'Worldwide',
            candidate_required_location: sj.candidate_required_location || 'Remote',
            salary: sj.salary || null,
            description: sj.description || '',
            category: sj.category || 'Software & Engineering',
            job_type: sj.job_type || 'Full-time',
            tags: sj.tags || [],
            source: sj.source || 'company_direct',
            source_type: 'CRAWLER',
            employer_type: sj.employer_type || 'direct',
            is_active: true,
            is_featured: false,
            published_at: sj.published_at || new Date().toISOString(),
            created_at: sj.published_at || new Date().toISOString(),
            posted_at: sj.posted_at || sj.published_at || new Date().toISOString(),
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

    // Dev seed action for Nigerian sample roles
    if (body.action === 'seed_nigeria') {
      const seeded: AdminRemoteJob[] = [];
      for (const role of SAMPLE_NIGERIA_ROLES) {
        const saved = saveServerJob(role);
        seeded.push(saved);
        try {
          const supabase = await createServerClient();
          await supabase.from('remote_jobs').upsert({
            id: role.id,
            job_title: role.title,
            company_name: role.company,
            career_url: role.career_url || role.url,
            region_allowance: role.location_tier,
            salary_range: role.salary,
            job_description: role.description,
            source_type: 'ADMIN_CURATED',
            work_mode: role.work_mode,
            city_location: role.city_location,
            candidate_required_location: role.candidate_required_location,
            is_active: true,
            is_featured: role.is_featured,
            created_at: role.created_at,
          });
        } catch {
          // ignore db fallback
        }
      }
      return NextResponse.json({
        success: true,
        seeded,
        message: 'Successfully seeded Nigerian roles (Lekki, Lagos Hybrid and Maitama, Abuja Onsite).',
      });
    }

    const {
      company_name,
      job_title,
      career_url,
      region_allowance,
      salary_range,
      job_description,
      is_featured,
      work_mode,
      city_location,
    } = body;

    if (!company_name || !job_title || !career_url || !region_allowance) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory job fields.' },
        { status: 400 }
      );
    }

    // Generate valid UUID for database compatibility along with readable external_id
    const jobUuid = crypto.randomUUID();
    const newId = `admin-job-${Date.now()}`;
    const externalId = `ext-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const cleanCompany = company_name.trim();
    const cleanTitle = job_title.trim();
    const cleanUrl = career_url.trim();
    const cleanSalary = salary_range?.trim() || null;
    const cleanDesc = job_description?.trim() || 'Verified role posted directly by Platform Admin.';
    const isFeatured = Boolean(is_featured);
    const cleanWorkMode = (work_mode || 'REMOTE').toUpperCase();
    const cleanCityLocation = city_location?.trim() || null;

    const newJob: AdminRemoteJob = {
      id: jobUuid,
      external_id: externalId,
      title: cleanTitle,
      company: cleanCompany,
      company_name: cleanCompany,
      career_url: cleanUrl,
      url: cleanUrl,
      apply_url: cleanUrl,
      location_tier: region_allowance as 'Worldwide' | 'EMEA' | 'Africa Only',
      candidate_required_location: cleanCityLocation || (
        region_allowance === 'Africa Only'
          ? 'Africa Only (Remote)'
          : region_allowance === 'EMEA'
          ? 'EMEA Remote'
          : 'Worldwide Remote'
      ),
      work_mode: cleanWorkMode,
      city_location: cleanCityLocation,
      salary: cleanSalary,
      description: cleanDesc,
      category: 'Software & Engineering',
      job_type: 'Full-time',
      tags: ['Verified Partner', 'Platform Curated', region_allowance, cleanWorkMode],
      skills: ['Software Architecture', 'Cloud Infrastructure', 'Team Leadership', 'System Design'],
      source: 'company_direct',
      source_name: 'Platform Curated',
      source_type: 'ADMIN_CURATED',
      employer_type: 'direct',
      open_to_nigeria: true,
      is_active: true,
      is_featured: isFeatured,
      published_at: nowIso,
      created_at: nowIso,
      posted_at: nowIso,
      last_verified_at: nowIso,
    };

    // 1. Save in server persistent store (persists across local disk, /tmp, and in-memory cache)
    const savedJob = saveServerJob(newJob);

    // 2. Also attempt persisting to Supabase if connected
    try {
      const supabase = await createServerClient();
      await supabase.from('remote_jobs').insert({
        id: jobUuid,
        job_title: cleanTitle,
        company_name: cleanCompany,
        career_url: cleanUrl,
        region_allowance: region_allowance,
        salary_range: cleanSalary,
        job_description: cleanDesc,
        source_type: 'ADMIN_CURATED',
        work_mode: cleanWorkMode,
        city_location: cleanCityLocation,
        candidate_required_location: cleanCityLocation || region_allowance,
        is_active: true,
        is_featured: isFeatured,
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
