// Shared TypeScript types for the BreatheBetter frontend

export type AQICategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe'
  | 'Unknown';

export type FreshnessStatus = 'Recent' | 'Delayed' | 'Possibly stale' | 'Stale' | 'Unknown';

export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | 'nh3';

export interface LocationSensor {
  id: number;
  name: string;
  parameter: {
    id: number;
    name: string;
    units: string;
    displayName: string;
  };
}

export interface Location {
  _id?: string;
  openaqId: number;
  name: string;
  locality: string | null;
  timezone: string;
  country: {
    code: string;
    name: string;
  };
  owner: { id: number; name: string } | null;
  provider: { id: number; name: string } | null;
  isMobile: boolean;
  isMonitor: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensors: LocationSensor[];
  latestAqi?: {
    value: number;
    category: AQICategory;
    dominantPollutant: PollutantKey;
  } | null;
  lastSyncedAt: string;
}

export interface PollutantReading {
  pollutant: PollutantKey;
  value: number;
  unit: string;
  measurementUtc: string;
  freshnessStatus: FreshnessStatus;
  ageMinutes: number | null;
}

export interface AQISubIndex {
  pollutant: PollutantKey;
  value: number;
  subIndex: number;
  unit: string;
  averagingPeriodHours: number;
  dataPointsUsed: number;
}

export interface AQIData {
  value: number | null;
  category: AQICategory | null;
  dominantPollutant: PollutantKey | null;
  subIndices: AQISubIndex[];
  isValid: boolean;
  invalidReason: string | null;
  calculatedAt: string | null;
  displayLabel: string;
}

export interface DashboardData {
  location: {
    id: number;
    name: string;
    locality: string | null;
    country: { code: string; name: string };
    coordinates: { latitude: number; longitude: number };
    isMonitor: boolean;
    isMobile: boolean;
    provider: { id: number; name: string } | null;
  };
  aqi: AQIData | null;
  pollutants: Record<string, PollutantReading>;
  health: HealthRecommendation;
  dominantPollutantDescription: string | null;
}

export interface HealthRecommendation {
  category: AQICategory | 'Unknown';
  general: string;
  outdoor: string;
  sensitiveGroups: string;
  exercise: string;
  windows: string;
  masks: string;
  color: string;
  emoji: string;
}

export interface HistoryDataPoint {
  pollutant: string;
  value: number;
  unit: string;
  measurementUtc: string;
  freshnessStatus: FreshnessStatus;
}

export interface ForecastHour {
  time: string;
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
    nh3: number | null;
  };
  usAqi: number | null;
  europeanAqi: number | null;
  source: 'open-meteo';
  dataType: 'forecast';
}

export interface ForecastData {
  hours: ForecastHour[];
  disclaimer: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    total: number;
    limit: number;
    skip: number;
  };
}

export const AQI_COLORS: Record<AQICategory, string> = {
  'Good': '#009966',
  'Satisfactory': '#55aa00',
  'Moderate': '#ffde33',
  'Poor': '#ff7e00',
  'Very Poor': '#cc0033',
  'Severe': '#7e0023',
  'Unknown': '#9ca3af',
};

export const AQI_TEXT_COLORS: Record<AQICategory, string> = {
  'Good': '#ffffff',
  'Satisfactory': '#ffffff',
  'Moderate': '#1a1a1a',
  'Poor': '#ffffff',
  'Very Poor': '#ffffff',
  'Severe': '#ffffff',
  'Unknown': '#ffffff',
};

export const FRESHNESS_COLORS: Record<FreshnessStatus, string> = {
  'Recent': '#22c55e',
  'Delayed': '#eab308',
  'Possibly stale': '#f97316',
  'Stale': '#ef4444',
  'Unknown': '#9ca3af',
};

export const POLLUTANT_DISPLAY: Record<string, { label: string; unit: string }> = {
  pm25: { label: 'PM2.5', unit: 'µg/m³' },
  pm10: { label: 'PM10', unit: 'µg/m³' },
  no2: { label: 'NO₂', unit: 'µg/m³' },
  so2: { label: 'SO₂', unit: 'µg/m³' },
  co: { label: 'CO', unit: 'mg/m³' },
  o3: { label: 'O₃', unit: 'µg/m³' },
  nh3: { label: 'NH₃', unit: 'µg/m³' },
};

