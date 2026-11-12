import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession, enforceRecruiterRole } from '@/lib/recruiter/auth';
import { saveLocalCandidateContactLog, getLocalCandidateContactLogs } from '@/lib/recruiter/store';
import { CandidateContactLog } from '@/lib/recruiter/types';

/**
 * POST /api/recruiter/talent/contact
 * Logs an official outreach / contact attempt to an unlocked candidate (email or WhatsApp).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const {
      workspace_id,
      candidate_id,
      contact_type = 'EMAIL',
      recipient,
      subject,
      message_template,
    } = body;

    const targetWsId = workspace_id || session?.workspaceId || 'ws-sync730-demo';

    // RBAC: Only OWNER and ADMIN can contact candidates
    const roleError = enforceRecruiterRole(session, ['OWNER', 'ADMIN'], targetWsId);
    if (roleError) {
      return roleError;
    }

    if (!candidate_id || !recipient) {
      return NextResponse.json(
        { success: false, error: 'candidate_id and recipient are required' },
        { status: 400 }
      );
    }

    const logEntry: CandidateContactLog = {
      id: `cnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: targetWsId,
      candidate_id,
      contact_type: contact_type === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL',
      recipient,
      subject: subject || 'Interview Invitation from Sync730 Partner',
      message_template: message_template || 'Outreach initiated via recruiter console',
      logged_at: new Date().toISOString(),
      logged_by: session?.email || 'recruiter@company.com',
    };

    saveLocalCandidateContactLog(logEntry);

    return NextResponse.json({
      success: true,
      message: 'Contact attempt logged successfully.',
      log: logEntry,
      contact_log: logEntry,
    });
  } catch (error: any) {
    console.error('Contact log error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log contact attempt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/talent/contact?workspace_id=...&candidate_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace_id') || session?.workspaceId || 'ws-sync730-demo';
    const candidateId = searchParams.get('candidate_id');

    let logs = getLocalCandidateContactLogs(workspaceId);
    if (candidateId) {
      logs = logs.filter((l) => l.candidate_id === candidateId);
    }

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contact logs' },
      { status: 500 }
    );
  }
}
