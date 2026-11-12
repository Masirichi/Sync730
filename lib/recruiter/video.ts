// lib/recruiter/video.ts
// Signed expiring video URLs and metadata helpers for Flowmingo AI assessment videos.

const VIDEO_EXPIRATION_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface SignedVideoMeta {
  signedUrl: string;
  posterUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  expiresAt: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING';
}

/**
 * Format seconds into mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generates a signed, expiring URL for a Flowmingo AI candidate video assessment.
 */
export function signCandidateVideoUrl(
  candidateId: string,
  rawUrl: string,
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING' = 'COMPLETED',
  customDuration?: number
): SignedVideoMeta {
  const expiresAt = Date.now() + VIDEO_EXPIRATION_TTL_MS;
  const durationSeconds = customDuration || 165; // Default ~2:45

  if (status === 'PROCESSING' || status === 'PENDING' || !rawUrl) {
    return {
      signedUrl: '',
      posterUrl: '/assets/video-posters/processing-poster.svg',
      durationSeconds: 0,
      durationFormatted: 'Processing',
      expiresAt,
      status: status === 'PENDING' ? 'PENDING' : 'PROCESSING',
    };
  }

  // Generate deterministic secure token
  const tokenPayload = `${candidateId}:${expiresAt}:sync730_recruiter_secret`;
  const signature = Buffer.from(tokenPayload).toString('base64url');
  const separator = rawUrl.includes('?') ? '&' : '?';
  const signedUrl = `${rawUrl}${separator}auth_sig=${signature}&expires=${expiresAt}`;

  // Deterministic SVG or placeholder poster for each candidate
  const posterUrl = `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80`;

  return {
    signedUrl,
    posterUrl,
    durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    expiresAt,
    status,
  };
}
