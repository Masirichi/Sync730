import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { EmployerJob } from '@/lib/recruiter/types';
import { getLocalJobs, saveLocalJobs } from '@/lib/recruiter/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspace_id,
      job_title,
      department,
      location,
      job_type,
      salary_range,
      description,
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

    const newJob: EmployerJob = {
      id: `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: workspace_id || 'ws-sync730-demo',
      job_title: title,
      flowmingo_project_id: flowmingoProjectId,
      status: 'active',
      department: department || 'Engineering',
      location: location || '100% Remote (Global)',
      job_type: job_type || 'Full-time',
      salary_range: salary_range || 'Competitive Remote Salary',
      description: description || 'High-impact remote role with asynchronous collaboration and continuous ownership.',
      created_at: new Date().toISOString(),
    };

    // 2. Persist to Supabase employer_jobs
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
