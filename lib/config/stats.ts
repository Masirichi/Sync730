// lib/config/stats.ts
// Thresholds and configuration for the Live Platform Activity stats band

export interface StatsConfig {
  minimums: {
    rolesLast24h: number;
    talents: number;
    partners: number;
  };
  refreshIntervalMs: number;
  cacheTtlSeconds: number;
  rateLimitPerMinute: number;
}

export const STATS_CONFIG: StatsConfig = {
  minimums: {
    rolesLast24h: 10,
    talents: 100,
    partners: 3,
  },
  refreshIntervalMs: 60000, // 60 seconds background refresh
  cacheTtlSeconds: 60, // 60s cache at edge
  rateLimitPerMinute: 60,
};
