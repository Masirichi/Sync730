import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterSession } from '@/lib/recruiter/auth';
import {
  getLocalPipelineCandidates,
  updateLocalPipelineCandidateStage,
  addScorecardToPipelineCandidate,
  addNoteToPipelineCandidate,
  scheduleInterviewForPipelineCandidate,
} from '@/lib/recruiter/store';
import { PipelineStage, ScorecardEntry, ScheduledInterview } from '@/lib/recruiter/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('job_id') || undefined;
    const candidates = getLocalPipelineCandidates(jobId);

    const stages: PipelineStage[] = [
      'Shortlisted',
      'Contacted',
      'Interviewing',
      'Offer',
      'Hired',
      'Rejected',
    ];

    const counts: Record<string, number> = {};
    stages.forEach((s) => {
      counts[s] = candidates.filter((c) => c.stage === s).length;
    });

    return NextResponse.json({
      success: true,
      candidates,
      stages,
      stage_counts: counts,
      total_count: candidates.length,
    });
  } catch (error: any) {
    console.error('Pipeline GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRecruiterSession(req);
    const body = await req.json();
    const { action, candidate_id } = body;

    if (!candidate_id) {
      return NextResponse.json({ success: false, error: 'candidate_id is required' }, { status: 400 });
    }

    const authorName = session?.email?.split('@')[0] || 'Alex Morgan';
    const authorRole = session?.role || 'OWNER';

    // 1. Move Stage
    if (action === 'move_stage') {
      const { stage, reason } = body;
      const validStages: PipelineStage[] = [
        'Shortlisted',
        'Contacted',
        'Interviewing',
        'Offer',
        'Hired',
        'Rejected',
      ];

      if (!stage || !validStages.includes(stage)) {
        return NextResponse.json({ success: false, error: 'Invalid pipeline stage' }, { status: 400 });
      }

      // STRICT REQUIREMENT: Rejection reason is required when moving to Rejected
      if (stage === 'Rejected') {
        if (!reason || !reason.trim()) {
          return NextResponse.json(
            { success: false, error: 'A specific rejection reason is required when rejecting a candidate.' },
            { status: 400 }
          );
        }
      }

      const updated = updateLocalPipelineCandidateStage(
        candidate_id,
        stage as PipelineStage,
        reason,
        authorName
      );

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Candidate not found in pipeline' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Candidate moved to ${stage}${reason ? ` (Reason: ${reason})` : ''}`,
        candidate: updated,
      });
    }

    // 2. Submit Scorecard
    if (action === 'scorecard') {
      const {
        technical_depth = 5,
        problem_solving = 5,
        culture_values = 5,
        communication = 5,
        notes,
      } = body;

      const avg = Number(
        ((technical_depth + problem_solving + culture_values + communication) / 4).toFixed(1)
      );

      const scorecard: ScorecardEntry = {
        id: `sc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        interviewer_id: session?.userId || 'usr-reviewer',
        interviewer_name: authorName,
        interviewer_role: authorRole,
        technical_depth: Math.min(5, Math.max(1, Number(technical_depth))),
        problem_solving: Math.min(5, Math.max(1, Number(problem_solving))),
        culture_values: Math.min(5, Math.max(1, Number(culture_values))),
        communication: Math.min(5, Math.max(1, Number(communication))),
        overall_rating: avg,
        notes: notes || '',
        submitted_at: new Date().toISOString(),
      };

      const updated = addScorecardToPipelineCandidate(candidate_id, scorecard);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Candidate not found in pipeline' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Scorecard submitted by ${authorName} (${avg}/5.0)`,
        scorecard,
        candidate: updated,
      });
    }

    // 3. Add Internal Note
    if (action === 'note') {
      const { text } = body;
      if (!text || !text.trim()) {
        return NextResponse.json({ success: false, error: 'Note text cannot be empty' }, { status: 400 });
      }

      const updated = addNoteToPipelineCandidate(candidate_id, {
        author_name: authorName,
        author_role: authorRole,
        text: text.trim(),
      });

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Candidate not found in pipeline' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Internal note added to candidate profile',
        candidate: updated,
      });
    }

    // 4. Schedule Interview
    if (action === 'schedule_interview') {
      const {
        scheduled_at,
        duration_minutes = 45,
        interviewer_emails = [],
        candidate_email,
        meeting_link,
        notes,
      } = body;

      if (!scheduled_at) {
        return NextResponse.json(
          { success: false, error: 'scheduled_at date-time is required' },
          { status: 400 }
        );
      }

      const interview: ScheduledInterview = {
        id: `int-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        scheduled_at,
        duration_minutes: Number(duration_minutes) || 45,
        interviewer_emails: Array.isArray(interviewer_emails) ? interviewer_emails : [session?.email || 'interviewer@company.com'],
        candidate_email: candidate_email || 'candidate@sync730.com',
        meeting_link: meeting_link || 'https://meet.google.com/sync-730-int',
        notes: notes || 'Technical Deep-Dive Interview',
        created_at: new Date().toISOString(),
        created_by: authorName,
      };

      const updated = scheduleInterviewForPipelineCandidate(candidate_id, interview);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Candidate not found in pipeline' }, { status: 404 });
      }

      // Generate ICS Calendar content
      const startDate = new Date(scheduled_at);
      const endDate = new Date(startDate.getTime() + interview.duration_minutes * 60000);
      const formatIcsDate = (d: Date) =>
        d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sync730//Interview Scheduler//EN',
        'BEGIN:VEVENT',
        `UID:${interview.id}@sync730.com`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `SUMMARY:Sync730 Interview: ${updated.masked_id} / ${updated.seniority}`,
        `DESCRIPTION:${interview.notes}\\nMeeting Link: ${interview.meeting_link}`,
        `LOCATION:${interview.meeting_link}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      return NextResponse.json({
        success: true,
        message: `Interview scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        interview,
        ics_calendar: icsData,
        candidate: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown pipeline action' }, { status: 400 });
  } catch (error: any) {
    console.error('Pipeline action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Pipeline operation failed' },
      { status: 500 }
    );
  }
}
