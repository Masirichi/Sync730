// lib/admin/date.ts
// Canonical date formatting for Sync730 Admin Command Center.
// Format: absolute and unambiguous, e.g. "12 Mar 2025, 14:05", timezone Africa/Lagos,
// with relative time helper for tooltips.

export function formatLagosDateTime(dateInput?: string | number | Date | null): {
  formatted: string;
  relative: string;
  iso: string;
} {
  if (!dateInput) {
    return { formatted: 'Not recorded', relative: 'unknown', iso: '' };
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return { formatted: String(dateInput), relative: 'invalid date', iso: '' };
  }

  // Absolute format in Africa/Lagos timezone: "12 Mar 2025, 14:05"
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatted = formatter.format(date);

  // Relative time computation
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  let relative = 'just now';

  if (diffSec < 60) {
    relative = `${Math.max(1, diffSec)}s ago`;
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = `${mins}m ago`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    relative = `${hours}h ago`;
  } else {
    const days = Math.floor(diffSec / 86400);
    relative = `${days}d ago`;
  }

  return {
    formatted,
    relative,
    iso: date.toISOString(),
  };
}
