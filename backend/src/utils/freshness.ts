/**
 * Data freshness calculation service.
 * BreatheBetter display rules — not official OpenAQ classifications.
 */

export type FreshnessStatus = 'Recent' | 'Delayed' | 'Possibly stale' | 'Stale' | 'Unknown';

export interface FreshnessInfo {
  ageMinutes: number | null;
  status: FreshnessStatus;
  lastMeasuredAt: string | null;
}

/**
 * Calculate freshness of a measurement.
 * @param measurementUtc ISO 8601 UTC timestamp string
 * @param now Current UTC time (default: now)
 */
export function calculateFreshness(
  measurementUtc: string | null | undefined,
  now: Date = new Date()
): FreshnessInfo {
  if (!measurementUtc) {
    return { ageMinutes: null, status: 'Unknown', lastMeasuredAt: null };
  }

  const measurementTime = new Date(measurementUtc);

  if (isNaN(measurementTime.getTime())) {
    return { ageMinutes: null, status: 'Unknown', lastMeasuredAt: null };
  }

  // Future timestamps are invalid
  if (measurementTime > now) {
    return { ageMinutes: null, status: 'Unknown', lastMeasuredAt: measurementUtc };
  }

  const ageMs = now.getTime() - measurementTime.getTime();
  const ageMinutes = Math.floor(ageMs / 60000);

  let status: FreshnessStatus;
  if (ageMinutes <= 60) {
    status = 'Recent';
  } else if (ageMinutes <= 180) {
    status = 'Delayed';
  } else if (ageMinutes <= 360) {
    status = 'Possibly stale';
  } else {
    status = 'Stale';
  }

  return { ageMinutes, status, lastMeasuredAt: measurementUtc };
}

/**
 * Color codes for freshness status (used by frontend).
 */
export const FRESHNESS_COLORS: Record<FreshnessStatus, string> = {
  'Recent': '#22c55e',
  'Delayed': '#eab308',
  'Possibly stale': '#f97316',
  'Stale': '#ef4444',
  'Unknown': '#9ca3af',
};

