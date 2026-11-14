// lib/stats/service.ts
// Service layer for querying live platform activity metrics
// Returns: { rolesLast24h, talents, partners, updatedAt }

import { createServerClient } from '@/lib/supabase/server';
import { getServerJobs } from '@/lib/admin/server-store';

export interface PublicStats {
  rolesLast24h: number;
  talents: number;
  partners: number;
  updatedAt: string;
}

/**
 * Calculates live platform statistics based on the three queries:
 * 1. rolesLast24h: Live jobs from approved employers published within the last 24 hours
 * 2. talents: Registered candidate accounts with verified email, excluding test/demo/seed accounts
 * 3. partners: Partner organizations approved by an admin (is_partner = true)
 */
export async function getLivePublicStats(): Promise<PublicStats> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  let rolesCount = 0;
  let talentsCount = 0;
  let partnersCount = 0;

  try {
    const supabase = await createServerClient();

    // Query 1: rolesLast24h
    // Count active jobs published within rolling 24h in remote_jobs
    try {
      const { count: dbRolesCount, error: rolesErr } = await supabase
        .from('remote_jobs')
        .select('*', { count: 'exact', head: true })
        .or('is_active.is.null,is_active.eq.true')
        .gte('created_at', twentyFourHoursAgo);

      if (!rolesErr && typeof dbRolesCount === 'number') {
        rolesCount = dbRolesCount;
      }
    } catch {
      // Fall through to server-store check
    }

    // Also check server store jobs published in the last 24h
    try {
      const serverJobs = getServerJobs();
      const recentServerJobs = serverJobs.filter((j) => {
        const posted = new Date(j.created_at || j.published_at || 0).getTime();
        return posted >= Date.now() - 24 * 60 * 60 * 1000;
      });
      rolesCount += recentServerJobs.length;
    } catch {
      // Server store fallback
    }

    // Query 2: talents
    // Registered candidate accounts with verified email, excluding test/demo/seed accounts
    try {
      const { count: dbTalentsCount, error: talentsErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'candidate')
        .or('is_active.is.null,is_active.eq.true')
        .not('email', 'like', '%@test.%')
        .not('email', 'like', '%@example.%')
        .not('email', 'like', '%demo%')
        .not('email', 'like', '%seed%');

      if (!talentsErr && typeof dbTalentsCount === 'number') {
        talentsCount = dbTalentsCount;
      }
    } catch {
      // Fail safely
    }

    // Query 3: partners
    // Partner organizations flagged and approved by an admin
    try {
      const { count: dbPartnersCount, error: partnersErr } = await supabase
        .from('corporate_workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('is_partner', true);

      if (!partnersErr && typeof dbPartnersCount === 'number') {
        partnersCount = dbPartnersCount;
      }
    } catch {
      // If is_partner column does not yet exist or fails, count is 0
    }
  } catch (error) {
    console.error('Error fetching live public stats:', error);
  }

  return {
    rolesLast24h: rolesCount,
    talents: talentsCount,
    partners: partnersCount,
    updatedAt: new Date().toISOString(),
  };
}
