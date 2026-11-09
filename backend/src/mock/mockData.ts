import { calculateCPCBAQI, getAQICategory } from '../utils/aqi-calculator';

export interface MockLocation {
  openaqId: number;
  name: string;
  locality: string | null;
  timezone: string;
  country: { code: string; name: string };
  owner: { id: number; name: string } | null;
  provider: { id: number; name: string } | null;
  isMobile: boolean;
  isMonitor: boolean;
  coordinates: { latitude: number; longitude: number };
  sensors: Array<{
    id: number;
    name: string;
    parameter: { id: number; name: string; units: string; displayName: string };
  }>;
  licenses: any[];
  lastSyncedAt: Date;
}

export interface MockObservation {
  source: string;
  locationId: number;
  sensorId: number;
  stationName: string;
  coordinates: { latitude: number; longitude: number };
  pollutant: string;
  value: number;
  unit: string;
  measurementUtc: Date;
  measurementLocal: string;
  fetchedAt: Date;
  measurementType: 'ground_observation' | 'hourly_average';
  ageMinutes: number;
  freshnessStatus: 'Recent' | 'Delayed' | 'Possibly stale' | 'Stale';
}

export const MOCK_LOCATIONS: MockLocation[] = [
  {
    openaqId: 4663956,
    name: 'Santushti Apartments, Vasant Kunj',
    locality: 'South West Delhi',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 1, name: 'CPCB / DPCC' },
    provider: { id: 1, name: 'Delhi Pollution Control Committee' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 28.5266, longitude: 77.1493 },
    sensors: [
      { id: 13273790, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273791, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273792, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
      { id: 13273793, name: 'so2', parameter: { id: 9, name: 'so2', units: 'µg/m³', displayName: 'SO₂' } },
      { id: 13273794, name: 'co', parameter: { id: 8, name: 'co', units: 'mg/m³', displayName: 'CO' } },
      { id: 13273795, name: 'o3', parameter: { id: 7, name: 'o3', units: 'µg/m³', displayName: 'O₃' } },
    ],
    licenses: [{ name: 'CC BY 4.0', attribution: 'CPCB / DPCC via OpenAQ' }],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663960,
    name: 'Anand Vihar, Delhi',
    locality: 'East Delhi',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 1, name: 'DPCC' },
    provider: { id: 1, name: 'Delhi Pollution Control Committee' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 28.6476, longitude: 77.3158 },
    sensors: [
      { id: 13273800, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273801, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273802, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
      { id: 13273803, name: 'so2', parameter: { id: 9, name: 'so2', units: 'µg/m³', displayName: 'SO₂' } },
      { id: 13273804, name: 'co', parameter: { id: 8, name: 'co', units: 'mg/m³', displayName: 'CO' } },
      { id: 13273805, name: 'o3', parameter: { id: 7, name: 'o3', units: 'µg/m³', displayName: 'O₃' } },
    ],
    licenses: [{ name: 'CC BY 4.0' }],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663965,
    name: 'Bandra, Mumbai',
    locality: 'Mumbai Suburban',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 2, name: 'MPCB' },
    provider: { id: 2, name: 'Maharashtra Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 19.0596, longitude: 72.8295 },
    sensors: [
      { id: 13273810, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273811, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273812, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
      { id: 13273813, name: 'so2', parameter: { id: 9, name: 'so2', units: 'µg/m³', displayName: 'SO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663970,
    name: 'BTM Layout, Bengaluru',
    locality: 'Bengaluru Urban',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 3, name: 'KSPCB' },
    provider: { id: 3, name: 'Karnataka State Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 12.9166, longitude: 77.6101 },
    sensors: [
      { id: 13273820, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273821, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273822, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663975,
    name: 'Victoria Memorial, Kolkata',
    locality: 'Kolkata',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 4, name: 'WBPCB' },
    provider: { id: 4, name: 'West Bengal Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 22.5448, longitude: 88.3426 },
    sensors: [
      { id: 13273830, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273831, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273832, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663980,
    name: 'Alandur Bus Depot, Chennai',
    locality: 'Chennai',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 5, name: 'TNPCB' },
    provider: { id: 5, name: 'Tamil Nadu Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 13.0012, longitude: 80.2014 },
    sensors: [
      { id: 13273840, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273841, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273842, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663985,
    name: 'Sanathnagar, Hyderabad',
    locality: 'Hyderabad',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 6, name: 'TSPCB' },
    provider: { id: 6, name: 'Telangana State Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 17.4565, longitude: 78.4439 },
    sensors: [
      { id: 13273850, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273851, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273852, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663990,
    name: 'Shivajinagar, Pune',
    locality: 'Pune',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 2, name: 'MPCB' },
    provider: { id: 2, name: 'Maharashtra Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 18.5314, longitude: 73.8446 },
    sensors: [
      { id: 13273860, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273861, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273862, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4663995,
    name: 'Adarsh Nagar, Jaipur',
    locality: 'Jaipur',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 7, name: 'RSPCB' },
    provider: { id: 7, name: 'Rajasthan State Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 26.9011, longitude: 75.8277 },
    sensors: [
      { id: 13273870, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273871, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273872, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
  {
    openaqId: 4664000,
    name: 'Ardhali Bazar, Varanasi',
    locality: 'Varanasi',
    timezone: 'Asia/Kolkata',
    country: { code: 'IN', name: 'India' },
    owner: { id: 8, name: 'UPPCB' },
    provider: { id: 8, name: 'Uttar Pradesh Pollution Control Board' },
    isMobile: false,
    isMonitor: true,
    coordinates: { latitude: 25.3424, longitude: 82.9739 },
    sensors: [
      { id: 13273880, name: 'pm25', parameter: { id: 2, name: 'pm25', units: 'µg/m³', displayName: 'PM2.5' } },
      { id: 13273881, name: 'pm10', parameter: { id: 1, name: 'pm10', units: 'µg/m³', displayName: 'PM10' } },
      { id: 13273882, name: 'no2', parameter: { id: 5, name: 'no2', units: 'µg/m³', displayName: 'NO₂' } },
    ],
    licenses: [],
    lastSyncedAt: new Date(),
  },
];

// Base values by city profile
const STATION_BASE_PROFILES: Record<number, { pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number }> = {
  4663956: { pm25: 142.5, pm10: 248.0, no2: 54.2, so2: 18.5, co: 1.8, o3: 38.0 }, // Vasant Kunj - Very Poor
  4663960: { pm25: 285.0, pm10: 440.0, no2: 92.0, so2: 24.0, co: 3.2, o3: 28.0 }, // Anand Vihar - Severe
  4663965: { pm25: 64.0,  pm10: 118.0, no2: 42.0, so2: 12.0, co: 0.9, o3: 45.0 }, // Bandra - Moderate
  4663970: { pm25: 28.0,  pm10: 52.0,  no2: 22.0, so2: 8.0,  co: 0.6, o3: 32.0 }, // Bengaluru - Good/Satisfactory
  4663975: { pm25: 110.0, pm10: 195.0, no2: 58.0, so2: 15.0, co: 1.4, o3: 30.0 }, // Kolkata - Poor
  4663980: { pm25: 42.0,  pm10: 78.0,  no2: 28.0, so2: 10.0, co: 0.7, o3: 40.0 }, // Chennai - Satisfactory
  4663985: { pm25: 78.0,  pm10: 135.0, no2: 36.0, so2: 11.0, co: 1.1, o3: 35.0 }, // Hyderabad - Moderate
  4663990: { pm25: 58.0,  pm10: 105.0, no2: 34.0, so2: 9.0,  co: 0.8, o3: 36.0 }, // Pune - Moderate
  4663995: { pm25: 98.0,  pm10: 172.0, no2: 46.0, so2: 14.0, co: 1.2, o3: 32.0 }, // Jaipur - Poor
  4664000: { pm25: 128.0, pm10: 220.0, no2: 48.0, so2: 16.0, co: 1.5, o3: 29.0 }, // Varanasi - Very Poor
};

/** Generate mock latest observations and hourly history */
export function generateMockObservations(locationId: number): {
  latest: Record<string, any>;
  history: any[];
  aqiSnapshot: any;
} {
  const profile = STATION_BASE_PROFILES[locationId] || { pm25: 85, pm10: 150, no2: 40, so2: 12, co: 1.0, o3: 35 };
  const loc = MOCK_LOCATIONS.find((l) => l.openaqId === locationId) || MOCK_LOCATIONS[0];
  const now = new Date();

  const latest: Record<string, any> = {};
  const pollutants = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'] as const;

  for (const p of pollutants) {
    const val = (profile as any)[p];
    if (val === undefined) continue;
    const unit = p === 'co' ? 'mg/m³' : 'µg/m³';
    latest[p] = {
      source: 'OpenAQ',
      locationId,
      sensorId: 13273790,
      stationName: loc.name,
      coordinates: loc.coordinates,
      pollutant: p,
      value: val,
      unit,
      measurementUtc: now.toISOString(),
      measurementLocal: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      ageMinutes: 18,
      freshnessStatus: 'Recent',
    };
  }

  // Generate 7-day hourly history
  const history: any[] = [];
  for (let i = 168; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    // Add realistic diurnal cycle: peak in morning (8am) and evening (8pm)
    const hour = t.getHours();
    const cycleFactor = 1 + 0.35 * Math.sin(((hour - 4) * Math.PI) / 12) + (Math.sin(i * 0.2) * 0.1);

    for (const p of ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'] as const) {
      const base = (profile as any)[p];
      if (base === undefined) continue;
      const unit = p === 'co' ? 'mg/m³' : 'µg/m³';
      const value = Math.max(2, parseFloat((base * cycleFactor).toFixed(1)));

      history.push({
        pollutant: p,
        value,
        unit,
        measurementUtc: t.toISOString(),
        freshnessStatus: i < 3 ? 'Recent' : 'Stale',
      });
    }
  }

  // Calculate AQI using CPCB methodology
  const aqiResult = calculateCPCBAQI({
    pm25: { value: profile.pm25, unit: 'µg/m³', dataPointsUsed: 24 },
    pm10: { value: profile.pm10, unit: 'µg/m³', dataPointsUsed: 24 },
    no2: { value: profile.no2, unit: 'µg/m³', dataPointsUsed: 24 },
    so2: { value: profile.so2, unit: 'µg/m³', dataPointsUsed: 24 },
    co: { value: profile.co, unit: 'mg/m³', dataPointsUsed: 8 },
    o3: { value: profile.o3, unit: 'µg/m³', dataPointsUsed: 8 },
  });

  const aqiSnapshot = {
    locationId,
    stationName: loc.name,
    calculationStandard: 'CPCB',
    aqi: aqiResult.aqi,
    category: aqiResult.category,
    dominantPollutant: aqiResult.dominantPollutant,
    subIndices: aqiResult.subIndices,
    isValid: aqiResult.isValid,
    invalidReason: aqiResult.invalidReason,
    calculatedAt: now.toISOString(),
    displayLabel: 'BreatheBetter AQI — Calculated using CPCB methodology',
  };

  return { latest, history, aqiSnapshot };
}
