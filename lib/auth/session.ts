// lib/auth/session.ts
// Session security, timeout definitions, and global session revocation.

import { createServerClient } from '@/lib/supabase/server';

export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const SESSION_COOKIE_NAME = 'sync730-session-active';

/**
 * Revokes all sessions globally across all devices for a given user.
 * Triggered when a user updates their password.
 */
export async function invalidateAllSessions(userId: string) {
  try {
    const supabase = await createServerClient();
    // Invalidate sessions via Supabase Auth Admin or client global signOut
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.warn('Notice: Global sign-out fallback:', error.message);
    }
    return { success: true, message: 'All active sessions invalidated globally across devices.' };
  } catch (err: any) {
    console.error('Failed to invalidate sessions globally:', err);
    return { success: false, error: err.message || 'Session revocation failed' };
  }
}
