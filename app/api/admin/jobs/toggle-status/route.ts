import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toggleServerJobActive, saveServerAuditLog } from '@/lib/admin/server-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, is_employer_job, is_active } = body;

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Missing job_id' },
        { status: 400 }
      );
    }

    if (is_employer_job) {
      // Toggle employer job status
      const nextStatus = is_active ? 'closed' : 'active';
      try {
        const supabase = await createServerClient();
        await supabase
          .from('employer_jobs')
          .update({
            status: nextStatus,
            is_active: !is_active,
          })
          .eq('id', job_id);
      } catch (e) {
        console.warn('Employer job DB update notice:', e);
      }

      saveServerAuditLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
        admin_id: 'usr-admin-001',
        action_type: 'JOB_STATUS_CHANGE',
        target_id: job_id,
        notes: `Admin changed employer job ${job_id} status to ${!is_active ? 'ACTIVE' : 'TAKEN_DOWN'}`,
      });

      return NextResponse.json({
        success: true,
        is_active: !is_active,
      });
    }

    // Toggle Remote Job in server persistent store
    const res = toggleServerJobActive(job_id, is_active);

    // Try DB update as well
    try {
      const supabase = await createServerClient();
      await supabase
        .from('remote_jobs')
        .update({ is_active: res.is_active })
        .eq('id', job_id);
    } catch (e) {
      console.warn('Remote job DB update notice:', e);
    }

    return NextResponse.json({
      success: true,
      is_active: res.is_active,
    });
  } catch (err: any) {
    console.error('Error in toggle-status route:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
