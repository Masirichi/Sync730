// lib/analytics/client.ts
// Client-side analytics event dispatcher. Safe for browser bundles (no node/fs dependencies).

import { AnalyticsEventType } from './events';

export function fireJobAnalytics(
  type: AnalyticsEventType,
  properties?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return;

  try {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, properties }),
    }).catch(() => {});

    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', type, properties);
    }
  } catch {}
}
