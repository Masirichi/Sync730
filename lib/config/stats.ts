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
    rolesLast24h: process.env.STATS_MIN_ROLES ? parseInt(process.env.STATS_MIN_ROLES, 10) : 10,
    talents: process.env.STATS_MIN_TALENTS ? parseInt(process.env.STATS_MIN_TALENTS, 10) : 100,
    partners: process.env.STATS_MIN_PARTNERS ? parseInt(process.env.STATS_MIN_PARTNERS, 10) : 3,
  },
  refreshIntervalMs: 60000, // 60 seconds background refresh
  cacheTtlSeconds: 60, // 60s cache at edge
  rateLimitPerMinute: 60,
};
