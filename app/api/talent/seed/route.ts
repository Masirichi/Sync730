import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  SEED_VIDEO_ASSESSMENTS,
  saveLocalAssessment,
} from '@/lib/recruiter/store';

export async function POST(req: NextRequest) {
  // Production Security Check: Seed routes must return 404 in production environments
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.ENVIRONMENT === 'production';

  if (isProduction) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  try {
    const supabase = await createServerClient();
    let seededToSupabase = 0;

    for (const item of SEED_VIDEO_ASSESSMENTS) {
      saveLocalAssessment(item);

      try {
        const { error } = await supabase.from('video_assessments').insert({
          candidate_id: item.candidate_id,
          target_role: item.target_role,
          overall_match_score: item.overall_match_score,
          technical_depth_score: item.technical_depth_score,
          communication_score: item.communication_score,
          ai_summary: item.ai_summary,
          secure_video_url: item.secure_video_url,
          proctoring_flags: item.proctoring_flags,
          status: item.status,
        });
        if (!error) seededToSupabase++;
      } catch (err) {
        // fallback
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded 3 realistic mock candidate video assessments in development mode.',
      seeded_count: SEED_VIDEO_ASSESSMENTS.length,
      seeded_to_supabase: seededToSupabase,
      candidates: SEED_VIDEO_ASSESSMENTS.map((s) => ({
        id: s.candidate_id,
        role: s.target_role,
        score: s.overall_match_score,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed candidate talent pool' },
      { status: 500 }
    );
  }
}
