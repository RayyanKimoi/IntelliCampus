/**
 * Lightweight date utility functions — native replacement for date-fns.
 * All functions operate on ISO-8601 strings or Date objects.
 */

/** Parse an ISO date string into a Date (native Date() handles ISO 8601). */
export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

/** Returns true if the date is in the past. */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** Returns true if the date is in the future. */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Returns a human-readable relative time string.
 * When addSuffix is true, appends "ago" or "in X".
 */
export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const suffix = options?.addSuffix ?? false;
  const diff = Date.now() - date.getTime(); // positive = past
  const absDiff = Math.abs(diff);
  const isPastDate = diff > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(absDiff / 60_000);
  const hours = Math.floor(absDiff / 3_600_000);
  const days = Math.floor(absDiff / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let text: string;
  if (seconds < 60) {
    text = 'less than a minute';
  } else if (minutes < 60) {
    text = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (hours < 24) {
    text = `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (days < 30) {
    text = `${days} day${days !== 1 ? 's' : ''}`;
  } else if (months < 12) {
    text = `about ${months} month${months !== 1 ? 's' : ''}`;
  } else {
    text = `about ${years} year${years !== 1 ? 's' : ''}`;
  }

  if (!suffix) return text;
  return isPastDate ? `${text} ago` : `in ${text}`;
}

/** Short date: "Jan 5, 2025" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Long datetime: "Jan 5, 2025, 3:30 PM" */
export function formatLongDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Generic format helper mimicking a subset of date-fns format tokens.
 * Supported patterns: 'MMM d, yyyy'  |  'PPpp' (→ long datetime)
 */
export function format(date: Date, pattern: string): string {
  if (pattern === 'PPpp' || pattern === 'PPP p' || pattern === 'Pp') {
    return formatLongDateTime(date);
  }
  if (pattern === 'MMM d, yyyy' || pattern === 'PP') {
    return formatShortDate(date);
  }
  // Fallback: locale string
  return date.toLocaleString('en-US');
}
