// lib/analytics.ts
// Privacy-preserving client-side analytics tracker
// Complies with NDPA 2023: no personal data, no third-party tracker injection

export type AnalyticsLocation = 'header' | 'hero' | 'recruiters' | 'final' | 'doors';

export type AnalyticsEvent =
  | { name: 'home_view' }
  | { name: 'stats_band_view' }
  | { name: 'cta_book_demo_click'; location: AnalyticsLocation }
  | { name: 'cta_find_work_click' }
  | { name: 'door_click'; which: string }
  | { name: 'demo_request_submitted' }
  | { name: 'enterprise_interest_submitted' }
  | { name: 'faq_open'; which: string | number };

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  // Check if a cookie consent banner exists and is rejected
  try {
    const consent = localStorage.getItem('sync730_cookie_consent');
    if (consent === 'rejected') {
      return; // Respect user opt-out
    }
  } catch {
    // LocalStorage inaccessible
  }

  // Dispatch custom browser event for observability
  try {
    const customEvent = new CustomEvent('sync730:analytics', {
      detail: {
        ...event,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(customEvent);
  } catch {
    // Fail silently in non-standard environments
  }
}
