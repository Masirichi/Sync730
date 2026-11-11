import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { saveAdminAuditLog } from '@/lib/admin/store';
import { getLocalAssessments, saveLocalAssessment } from '@/lib/recruiter/store';
import { AdminAuditLog } from '@/lib/admin/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessment_id, decision, notes } = body;

    if (!assessment_id) {
      return NextResponse.json({ success: false, error: 'assessment_id is required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED', 'FLAGGED'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'decision must be APPROVED, REJECTED, or FLAGGED' },
        { status: 400 }
      );
    }

    // 1. Update in Supabase
    try {
      const supabase = await createServerClient();
      await supabase
        .from('video_assessments')
        .update({
          moderation_status: decision,
          status: decision === 'REJECTED' ? 'FLAGGED' : 'COMPLETED',
        })
        .or(`id.eq.${assessment_id},candidate_id.eq.${assessment_id}`);
    } catch {}

    // 2. Update in Local Recruiter Store
    const all = getLocalAssessments();
    const target = all.find((a) => a.id === assessment_id || a.candidate_id === assessment_id);
    if (target) {
      const updated = {
        ...target,
        moderation_status: decision,
        status: decision === 'REJECTED' ? 'FLAGGED' : 'COMPLETED',
      };
      saveLocalAssessment(updated as any);
    }

    // 3. Write to Admin Audit Log
    const auditRecord: AdminAuditLog = {
      id: `log-vet-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      admin_id: 'usr-platform-admin',
      action_type: `VIDEO_VETTING_${decision}`,
      target_id: assessment_id,
      notes: `Video assessment marked as ${decision}. ${notes ? `Notes: ${notes}` : ''}`,
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('admin_audit_logs').insert({
        id: auditRecord.id,
        created_at: auditRecord.created_at,
        admin_id: auditRecord.admin_id,
        action_type: auditRecord.action_type,
        target_id: auditRecord.target_id,
        notes: auditRecord.notes,
      });
    } catch {}
    saveAdminAuditLog(auditRecord);

    return NextResponse.json({
      success: true,
      message: `Assessment successfully marked as ${decision}.`,
      moderation_status: decision,
      audit_log: auditRecord,
    });
  } catch (error: any) {
    console.error('Video moderation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to moderate assessment' },
      { status: 500 }
    );
  }
}
