import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getLocalAssessments,
  getLocalUnlocks,
  formatMaskedCandidate,
  SEED_VIDEO_ASSESSMENTS,
} from '@/lib/recruiter/store';
import { VideoAssessment } from '@/lib/recruiter/types';
import { signCandidateVideoUrl } from '@/lib/recruiter/video';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspace_id') || 'ws-sync730-demo';

    // 1. Fetch unlocks for this workspace
    let unlockedCandidateIds = new Set<string>();

    try {
      const supabase = await createServerClient();
      const { data: unlocksData } = await supabase
        .from('token_unlocks')
        .select('candidate_id')
        .eq('workspace_id', workspaceId);

      if (unlocksData) {
        unlocksData.forEach((u: { candidate_id: string }) => unlockedCandidateIds.add(u.candidate_id));
      }
    } catch (e) {
      // Local fallback
    }

    // Merge with local store unlocks
    const localUnlocks = getLocalUnlocks(workspaceId);
    localUnlocks.forEach((u) => unlockedCandidateIds.add(u.candidate_id));

    // 2. Fetch assessments
    let assessments = getLocalAssessments();

    // Try Supabase video_assessments if available
    try {
      const supabase = await createServerClient();
      const { data: dbAssessments } = await supabase
        .from('video_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbAssessments && dbAssessments.length > 0) {
        // Map db assessments into store
        const existingIds = new Set(assessments.map((a) => a.id));
        const newOnes = dbAssessments.filter((d: any) => !existingIds.has(d.id));
        assessments = [...newOnes, ...assessments];
      }
    } catch (dbErr) {
      // Use local assessments
    }

    // Ensure we always have seed assessments if empty
    if (assessments.length === 0) {
      assessments = [...SEED_VIDEO_ASSESSMENTS];
    }

    // 3. Apply Strict Server-Side Masking & Signed Expiring Video URLs
    const processedCandidates: VideoAssessment[] = assessments.map((cand) => {
      const isUnlocked = unlockedCandidateIds.has(cand.candidate_id);
      const masked = formatMaskedCandidate(cand, isUnlocked);
      const videoMeta = signCandidateVideoUrl(
        cand.candidate_id,
        cand.secure_video_url,
        cand.status,
        cand.duration_seconds
      );

      return {
        ...masked,
        status: cand.status,
        secure_video_url: videoMeta.signedUrl,
        poster_url: cand.poster_url || videoMeta.posterUrl,
        duration_seconds: cand.duration_seconds || videoMeta.durationSeconds,
        expires_at: videoMeta.expiresAt,
      };
    });

    return NextResponse.json({
      success: true,
      candidates: processedCandidates,
      unlocked_count: unlockedCandidateIds.size,
      total_count: processedCandidates.length,
    });
  } catch (error: any) {
    console.error('Talent list API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch talent pool' },
      { status: 500 }
    );
  }
}
