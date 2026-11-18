import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { toggleServerJobFeatured, saveServerAuditLog, getServerJobs } from '@/lib/admin/server-store';
import { assertServerPermission } from '@/lib/admin/permissions';
import { recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';

export async function POST(request: NextRequest) {
  try {
    // Permission check: Super admin & Moderator
    const permission = await assertServerPermission(request, 'roles:edit');
    if (!permission.authorized) {
      return permission.response;
    }

    const body = await request.json();
    const { job_id, is_employer_job, is_featured } = body;

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Missing job_id' },
        { status: 400 }
      );
    }

    // Phase 9 Compliance: Featured roles capped at maximum of 3
    if (!is_featured) {
      const allJobs = getServerJobs();
      const currentFeatured = allJobs.filter(
        (j) => j.is_featured && j.id !== job_id && j.external_id !== job_id
      ).length;
      if (currentFeatured >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: 'Featured roles are capped at a maximum of 3. Please unfeature an existing role before pinning another.',
            code: 'FEATURED_CAP_REACHED',
          },
          { status: 400 }
        );
      }
    }

    if (is_employer_job) {
      try {
        const supabase = await createServerClient();
        await supabase
          .from('employer_jobs')
          .update({ is_featured: !is_featured })
          .eq('id', job_id);
      } catch (e) {
        console.warn('Employer job featured DB update notice:', e);
      }

      saveServerAuditLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
        admin_id: 'usr-admin-001',
        action_type: 'JOB_STATUS_CHANGE',
        target_id: job_id,
        notes: `Admin changed employer job ${job_id} featured state to ${!is_featured ? 'FEATURED' : 'UNFEATURED'}`,
      });

      return NextResponse.json({
        success: true,
        is_featured: !is_featured,
      });
    }

    // Toggle Remote Job featured status in server persistent store
    const res = toggleServerJobFeatured(job_id, is_featured);

    // Try DB update as well
    try {
      const supabase = await createServerClient();
      await supabase
        .from('remote_jobs')
        .update({ is_featured: res.is_featured })
        .eq('id', job_id);
    } catch (e) {
      console.warn('Remote job featured DB update notice:', e);
    }

    return NextResponse.json({
      success: true,
      is_featured: res.is_featured,
    });
  } catch (err: any) {
    console.error('Error in toggle-featured route:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
