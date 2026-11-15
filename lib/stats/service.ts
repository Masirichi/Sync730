// lib/stats/service.ts
// Service layer for querying live platform activity metrics
// Returns single source of truth: { rolesLive, rolesLast24h, talents, partners, updatedAt }
// Guarantees rolesLast24h <= rolesLive across all views.

import { computeLivePlatformMetrics, LivePlatformMetrics } from './live-metrics';

export type PublicStats = LivePlatformMetrics;
export type { LivePlatformMetrics };

export async function getLivePublicStats(): Promise<PublicStats> {
  return computeLivePlatformMetrics();
}
