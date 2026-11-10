import { calculateCPCBAQI, getAQICategory } from '../utils/aqi-calculator';
import { COMPLETE_INDIA_CATALOGUE } from './indiaCatalogue';
import { COMPLETE_WORLD_CATALOGUE } from './worldCatalogue';

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

// Complete pan-India and international monitoring station catalogue
export const MOCK_LOCATIONS: MockLocation[] = [
  ...COMPLETE_INDIA_CATALOGUE,
  ...COMPLETE_WORLD_CATALOGUE,
];

// Specific baseline pollution profiles
const STATION_BASE_PROFILES: Record<number, { pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number }> = {
  // Prayagraj
  4664101: { pm25: 118.0, pm10: 215.0, no2: 44.0, so2: 14.0, co: 1.3, o3: 34.0 }, // Jhusi
  4664102: { pm25: 124.0, pm10: 228.0, no2: 48.0, so2: 15.0, co: 1.4, o3: 31.0 }, // Civil Lines
  4664103: { pm25: 105.0, pm10: 195.0, no2: 38.0, so2: 12.0, co: 1.1, o3: 36.0 }, // Phaphamau
  4664104: { pm25: 135.0, pm10: 245.0, no2: 52.0, so2: 18.0, co: 1.6, o3: 28.0 }, // Naini

  // Lucknow
  4664010: { pm25: 145.0, pm10: 255.0, no2: 56.0, so2: 19.0, co: 1.8, o3: 30.0 }, // Talkatora
  4664112: { pm25: 152.0, pm10: 268.0, no2: 60.0, so2: 21.0, co: 1.9, o3: 27.0 }, // Lalbagh
  4664113: { pm25: 120.0, pm10: 210.0, no2: 42.0, so2: 13.0, co: 1.2, o3: 35.0 }, // Gomti Nagar
  4664114: { pm25: 130.0, pm10: 225.0, no2: 46.0, so2: 15.0, co: 1.4, o3: 32.0 }, // Aliganj

  // Varanasi
  4664000: { pm25: 128.0, pm10: 220.0, no2: 48.0, so2: 16.0, co: 1.5, o3: 29.0 }, // Ardhali Bazar
  4664121: { pm25: 115.0, pm10: 202.0, no2: 42.0, so2: 13.0, co: 1.2, o3: 33.0 }, // Bhelupur
  4664122: { pm25: 98.0,  pm10: 175.0, no2: 34.0, so2: 10.0, co: 1.0, o3: 38.0 }, // BHU
  4664123: { pm25: 132.0, pm10: 230.0, no2: 50.0, so2: 17.0, co: 1.6, o3: 28.0 }, // Maldahiya

  // Kanpur
  4664131: { pm25: 162.0, pm10: 285.0, no2: 62.0, so2: 22.0, co: 2.1, o3: 26.0 }, // Nehru Nagar
  4664132: { pm25: 155.0, pm10: 270.0, no2: 58.0, so2: 20.0, co: 1.9, o3: 28.0 }, // Kidwai Nagar
  4664133: { pm25: 138.0, pm10: 240.0, no2: 48.0, so2: 16.0, co: 1.5, o3: 32.0 }, // Kalyanpur

  // Patna
  4664141: { pm25: 158.0, pm10: 278.0, no2: 54.0, so2: 18.0, co: 1.7, o3: 28.0 }, // Muradpur
  4664142: { pm25: 142.0, pm10: 250.0, no2: 48.0, so2: 15.0, co: 1.5, o3: 30.0 }, // Danapur
  4664143: { pm25: 135.0, pm10: 238.0, no2: 45.0, so2: 14.0, co: 1.3, o3: 33.0 }, // Rajbansi Nagar

  // Delhi NCR
  4663956: { pm25: 142.5, pm10: 248.0, no2: 54.2, so2: 18.5, co: 1.8, o3: 38.0 }, // Vasant Kunj
  4663960: { pm25: 285.0, pm10: 440.0, no2: 92.0, so2: 24.0, co: 3.2, o3: 28.0 }, // Anand Vihar
  4664151: { pm25: 175.0, pm10: 305.0, no2: 68.0, so2: 20.0, co: 2.2, o3: 30.0 }, // Punjabi Bagh
  4664152: { pm25: 135.0, pm10: 235.0, no2: 50.0, so2: 16.0, co: 1.6, o3: 35.0 }, // RK Puram
  4664153: { pm25: 195.0, pm10: 330.0, no2: 74.0, so2: 22.0, co: 2.4, o3: 26.0 }, // Sector 62 Noida

  // Mumbai
  4663965: { pm25: 64.0,  pm10: 118.0, no2: 42.0, so2: 12.0, co: 0.9, o3: 45.0 }, // Bandra
  4664161: { pm25: 78.0,  pm10: 142.0, no2: 48.0, so2: 14.0, co: 1.1, o3: 38.0 }, // Kurla
  4664162: { pm25: 45.0,  pm10: 82.0,  no2: 30.0, so2: 9.0,  co: 0.7, o3: 50.0 }, // Colaba
  4664163: { pm25: 58.0,  pm10: 108.0, no2: 36.0, so2: 11.0, co: 0.8, o3: 42.0 }, // Borivali

  // Bengaluru
  4663970: { pm25: 28.0,  pm10: 52.0,  no2: 22.0, so2: 8.0,  co: 0.6, o3: 32.0 }, // BTM Layout
  4664171: { pm25: 35.0,  pm10: 65.0,  no2: 26.0, so2: 9.0,  co: 0.7, o3: 30.0 }, // Hebbal
  4664172: { pm25: 42.0,  pm10: 78.0,  no2: 32.0, so2: 11.0, co: 0.8, o3: 28.0 }, // Silk Board
  4664173: { pm25: 31.0,  pm10: 58.0,  no2: 24.0, so2: 8.0,  co: 0.6, o3: 34.0 }, // Whitefield

  // Other major cities
  4663975: { pm25: 110.0, pm10: 195.0, no2: 58.0, so2: 15.0, co: 1.4, o3: 30.0 }, // Kolkata
  4663980: { pm25: 42.0,  pm10: 78.0,  no2: 28.0, so2: 10.0, co: 0.7, o3: 40.0 }, // Chennai
  4663985: { pm25: 78.0,  pm10: 135.0, no2: 36.0, so2: 11.0, co: 1.1, o3: 35.0 }, // Hyderabad
  4663990: { pm25: 58.0,  pm10: 105.0, no2: 34.0, so2: 9.0,  co: 0.8, o3: 36.0 }, // Pune
  4663995: { pm25: 98.0,  pm10: 172.0, no2: 46.0, so2: 14.0, co: 1.2, o3: 32.0 }, // Jaipur
  4664181: { pm25: 88.0,  pm10: 160.0, no2: 42.0, so2: 13.0, co: 1.1, o3: 36.0 }, // Ahmedabad
  4664182: { pm25: 72.0,  pm10: 130.0, no2: 32.0, so2: 10.0, co: 0.9, o3: 38.0 }, // Chandigarh
  4664183: { pm25: 68.0,  pm10: 125.0, no2: 30.0, so2: 9.0,  co: 0.9, o3: 40.0 }, // Bhopal
  4664184: { pm25: 122.0, pm10: 218.0, no2: 46.0, so2: 15.0, co: 1.4, o3: 31.0 }, // Agra
  4664185: { pm25: 92.0,  pm10: 165.0, no2: 38.0, so2: 12.0, co: 1.1, o3: 34.0 }, // Patiala
  4664186: { pm25: 52.0,  pm10: 95.0,  no2: 24.0, so2: 8.0,  co: 0.7, o3: 44.0 }, // Dehradun
  4664187: { pm25: 62.0,  pm10: 112.0, no2: 28.0, so2: 9.0,  co: 0.8, o3: 38.0 }, // Guwahati
  4664188: { pm25: 55.0,  pm10: 102.0, no2: 26.0, so2: 8.0,  co: 0.7, o3: 42.0 }, // Bhubaneswar
  4664189: { pm25: 48.0,  pm10: 88.0,  no2: 24.0, so2: 9.0,  co: 0.7, o3: 45.0 }, // Visakhapatnam
  4664190: { pm25: 22.0,  pm10: 42.0,  no2: 16.0, so2: 6.0,  co: 0.5, o3: 35.0 }, // Thiruvananthapuram

  // World Metropolitan Ground Stations
  9000001: { pm25: 12.0,  pm10: 22.0,  no2: 18.0, so2: 4.0,  co: 0.4, o3: 32.0 }, // Tokyo, Japan
  9000002: { pm25: 78.0,  pm10: 135.0, no2: 42.0, so2: 11.0, co: 1.1, o3: 28.0 }, // Beijing, China
  9000003: { pm25: 18.0,  pm10: 32.0,  no2: 15.0, so2: 6.0,  co: 0.5, o3: 24.0 }, // Singapore
  9000004: { pm25: 42.0,  pm10: 72.0,  no2: 32.0, so2: 8.0,  co: 0.7, o3: 26.0 }, // Seoul, South Korea
  9000005: { pm25: 58.0,  pm10: 95.0,  no2: 28.0, so2: 7.0,  co: 0.8, o3: 30.0 }, // Bangkok, Thailand
  9000006: { pm25: 8.0,   pm10: 16.0,  no2: 11.0, so2: 3.0,  co: 0.3, o3: 25.0 }, // Sydney, Australia
  9000007: { pm25: 14.0,  pm10: 26.0,  no2: 24.0, so2: 5.0,  co: 0.4, o3: 35.0 }, // London, UK
  9000008: { pm25: 16.0,  pm10: 28.0,  no2: 26.0, so2: 6.0,  co: 0.4, o3: 33.0 }, // Paris, France
  9000009: { pm25: 13.0,  pm10: 23.0,  no2: 20.0, so2: 5.0,  co: 0.4, o3: 31.0 }, // Berlin, Germany
  9000010: { pm25: 22.0,  pm10: 38.0,  no2: 31.0, so2: 7.0,  co: 0.5, o3: 40.0 }, // Rome, Italy
  9000011: { pm25: 15.0,  pm10: 27.0,  no2: 22.0, so2: 5.0,  co: 0.4, o3: 38.0 }, // New York, USA
  9000012: { pm25: 29.0,  pm10: 48.0,  no2: 34.0, so2: 6.0,  co: 0.7, o3: 52.0 }, // Los Angeles, USA
  9000013: { pm25: 10.0,  pm10: 18.0,  no2: 16.0, so2: 4.0,  co: 0.3, o3: 30.0 }, // Toronto, Canada
  9000014: { pm25: 64.0,  pm10: 165.0, no2: 38.0, so2: 12.0, co: 0.9, o3: 42.0 }, // Dubai, UAE
  9000015: { pm25: 95.0,  pm10: 210.0, no2: 48.0, so2: 16.0, co: 1.4, o3: 36.0 }, // Cairo, Egypt
  9000016: { pm25: 35.0,  pm10: 62.0,  no2: 25.0, so2: 9.0,  co: 0.6, o3: 28.0 }, // Johannesburg, South Africa
  9000017: { pm25: 24.0,  pm10: 44.0,  no2: 28.0, so2: 7.0,  co: 0.6, o3: 35.0 }, // São Paulo, Brazil
};

/** Generate mock latest observations and hourly history */
export function generateMockObservations(locationId: number): {
  latest: Record<string, any>;
  history: any[];
  aqiSnapshot: any;
} {
  const loc = MOCK_LOCATIONS.find((l) => l.openaqId === locationId) || MOCK_LOCATIONS[0];

  // Derive baseline profile
  let profile = STATION_BASE_PROFILES[locationId];
  if (!profile) {
    // Generate geographically plausible baseline if unlisted
    const lat = loc.coordinates.latitude;
    if (lat > 24) {
      // Northern / Gangetic plain
      profile = { pm25: 115.0, pm10: 205.0, no2: 44.0, so2: 14.0, co: 1.3, o3: 32.0 };
    } else if (lat > 16) {
      // Central / Deccan
      profile = { pm25: 65.0, pm10: 120.0, no2: 35.0, so2: 11.0, co: 0.9, o3: 38.0 };
    } else {
      // Southern / Coastal
      profile = { pm25: 35.0, pm10: 65.0, no2: 22.0, so2: 8.0, co: 0.6, o3: 35.0 };
    }
  }

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
