import { NextRequest, NextResponse } from 'next/server';
import { getLocalAssessments } from '@/lib/recruiter/store';
import { signCandidateVideoUrl } from '@/lib/recruiter/video';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get('candidate_id');
    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'candidate_id is required' },
        { status: 400 }
      );
    }

    const assessments = getLocalAssessments();
    const cand = assessments.find(
      (c) => c.candidate_id === candidateId || c.id === candidateId
    );

    if (!cand) {
      return NextResponse.json(
        { success: false, error: 'Candidate assessment not found' },
        { status: 404 }
      );
    }

    const videoMeta = signCandidateVideoUrl(
      cand.candidate_id,
      cand.secure_video_url,
      cand.status,
      cand.duration_seconds
    );

    return NextResponse.json({
      success: true,
      candidate_id: cand.candidate_id,
      video_meta: videoMeta,
      status: cand.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate signed video URL' },
      { status: 500 }
    );
  }
}
