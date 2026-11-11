import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { VideoAssessment } from '@/lib/recruiter/types';
import { saveLocalAssessment } from '@/lib/recruiter/store';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.event || payload.type || 'assessment.completed';
    const data = payload.data || payload;

    const candidateId = data.candidate_id || `cand-${Date.now().toString(36)}`;
    const targetRole = data.target_role || 'Senior Full Stack Engineer';
    const overallMatchScore = Number(data.overall_match_score || data.match_score || 90);
    const technicalDepthScore = Number(data.technical_depth_score || data.technical_score || 92);
    const communicationScore = Number(data.communication_score || 88);
    const aiSummary = data.ai_summary || data.summary || 'Candidate demonstrated verified engineering ownership and structured communication during assessment.';
    const secureVideoUrl = data.secure_video_url || data.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const proctoringFlags = Array.isArray(data.proctoring_flags) ? data.proctoring_flags : [];
    const status = data.status || 'COMPLETED';

    const assessment: VideoAssessment & { real_name?: string; real_email?: string } = {
      id: `va-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      candidate_id: candidateId,
      target_role: targetRole,
      overall_match_score: overallMatchScore,
      technical_depth_score: technicalDepthScore,
      communication_score: communicationScore,
      ai_summary: aiSummary,
      secure_video_url: secureVideoUrl,
      proctoring_flags: proctoringFlags,
      status: status as 'COMPLETED',
      created_at: new Date().toISOString(),
      real_name: data.candidate_name || data.name || 'Jane Doe',
      real_email: data.candidate_email || data.email || 'candidate@sync730.com',
    };

    // 1. Try updating Supabase
    try {
      const supabase = await createServerClient();
      const { data: dbData, error } = await supabase
        .from('video_assessments')
        .insert({
          candidate_id: assessment.candidate_id,
          target_role: assessment.target_role,
          overall_match_score: assessment.overall_match_score,
          technical_depth_score: assessment.technical_depth_score,
          communication_score: assessment.communication_score,
          ai_summary: assessment.ai_summary,
          secure_video_url: assessment.secure_video_url,
          proctoring_flags: assessment.proctoring_flags,
          status: assessment.status,
        })
        .select()
        .single();

      if (!error && dbData) {
        assessment.id = dbData.id;
      }
    } catch (dbErr) {
      console.warn('Notice: Supabase video_assessments insert fallback:', dbErr);
    }

    // 2. Save in store
    saveLocalAssessment(assessment);

    return NextResponse.json({
      success: true,
      event,
      assessment_id: assessment.id,
      candidate_id: assessment.candidate_id,
      message: 'Video vetting assessment recorded successfully.',
    });
  } catch (error: any) {
    console.error('Video vetting webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
