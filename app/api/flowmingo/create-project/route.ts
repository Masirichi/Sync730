import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { EmployerJob, JobStatus } from '@/lib/recruiter/types';
import { getLocalJobs, saveLocalJobs } from '@/lib/recruiter/store';
import { formatSalaryDisplay } from '@/lib/salary/formatSalary';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspace_id,
      job_title,
      department,
      seniority,
      location,
      location_country,
      location_state,
      location_city,
      job_type,
      employment_type,
      work_arrangement,
      eligible_regions,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      salary_range,
      skills,
      description,
      requirements,
      application_deadline,
      assessment_template,
      custom_questions,
      status = 'active',
    } = body;

    if (!job_title || !job_title.trim()) {
      return NextResponse.json(
        { success: false, error: 'job_title is required' },
        { status: 400 }
      );
    }

    const title = job_title.trim();
    const apiKey = process.env.FLOWMINGO_API_KEY;

    let flowmingoProjectId: string;
    let mode: 'live' | 'mock' = 'mock';

    // 1. Check if real Flowmingo API is configured
    if (apiKey && !apiKey.includes('placeholder') && !apiKey.includes('your_')) {
      try {
        const flowmingoRes = await fetch('https://api.flowmingo.com/v1/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            department: department || 'Engineering',
            template: assessment_template || 'Engineering',
            rubrics: ['technical_depth', 'communication', 'problem_solving'],
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (flowmingoRes.ok) {
          const flowData = await flowmingoRes.json();
          flowmingoProjectId = flowData.project_id || flowData.id;
          mode = 'live';
        } else {
          throw new Error('Flowmingo API error status: ' + flowmingoRes.status);
        }
      } catch (err) {
        console.warn('Flowmingo live API call failed, using graceful mock fallback:', err);
        flowmingoProjectId = `mock_flowmingo_proj_${Math.random().toString(36).substring(2, 6)}`;
      }
    } else {
      // Mock mode fallback as requested
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      flowmingoProjectId = `mock_flowmingo_proj_${randHex}`;
    }

    const effectiveArrangement = work_arrangement || (location?.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid');
    let effectiveLocation = location;
    if (!effectiveLocation) {
      if (effectiveArrangement === 'Remote') {
        effectiveLocation = '100% Remote (Worldwide)';
      } else if (location_city || location_country) {
        effectiveLocation = [location_city, location_state, location_country].filter(Boolean).join(', ');
      } else {
        effectiveLocation = 'Lagos, Nigeria (Hybrid)';
      }
    }

    const formattedSalary = formatSalaryDisplay({
      salary_min,
      salary_max,
      salary_currency: salary_currency || 'USD',
      salary_period: salary_period || 'year',
      salary_range,
    });

    const newJob: EmployerJob = {
      id: `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: workspace_id || 'ws-sync730-demo',
      job_title: title,
      flowmingo_project_id: flowmingoProjectId,
      status: (status as JobStatus) || 'active',
      department: department || 'Engineering',
      seniority: seniority || 'Senior',
      job_type: job_type || employment_type || 'Full-time',
      employment_type: employment_type || 'Full-time',
      work_arrangement: effectiveArrangement,
      location: effectiveLocation,
      location_country,
      location_state,
      location_city,
      eligible_regions: Array.isArray(eligible_regions) ? eligible_regions : ['Nigeria', 'Worldwide'],
      salary_min: typeof salary_min === 'number' ? salary_min : undefined,
      salary_max: typeof salary_max === 'number' ? salary_max : undefined,
      salary_currency: salary_currency || 'USD',
      salary_period: salary_period || 'year',
      salary_range: formattedSalary,
      skills: Array.isArray(skills) ? skills : ['Next.js', 'React', 'TypeScript'],
      description: description || 'High-impact role with asynchronous collaboration and continuous ownership.',
      requirements: requirements || 'Strong relevant engineering or domain background with high autonomy.',
      application_deadline: application_deadline || undefined,
      assessment_template: assessment_template || 'Engineering',
      custom_questions: custom_questions || [],
      invited_count: 0,
      assessed_count: 0,
      shortlisted_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Persist to Supabase employer_jobs if available
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('employer_jobs')
        .insert({
          workspace_id: newJob.workspace_id,
          job_title: newJob.job_title,
          status: newJob.status,
          flowmingo_project_id: newJob.flowmingo_project_id,
        })
        .select()
        .single();

      if (!error && data) {
        newJob.id = data.id;
      }
    } catch (dbErr) {
      console.warn('Notice: Supabase employer_jobs insert fallback:', dbErr);
    }

    // 3. Save to store
    const existingJobs = getLocalJobs();
    saveLocalJobs([newJob, ...existingJobs]);

    return NextResponse.json({
      success: true,
      mode,
      project_id: flowmingoProjectId,
      job: newJob,
      message: `Flowmingo project ${flowmingoProjectId} created and linked to job posting.`,
    });
  } catch (error: any) {
    console.error('Flowmingo create project error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize project' },
      { status: 500 }
    );
  }
}
