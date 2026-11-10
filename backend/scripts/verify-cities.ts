import axios from 'axios';

const CITIES = [
  'Prayagraj',
  'Lucknow',
  'Varanasi',
  'Kanpur',
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Patna',
];

const BASE_URL = 'http://localhost:5000/api';

interface CityTestReport {
  city: string;
  geocodingSuccess: boolean;
  coordinates: { lat: number; lng: number } | null;
  nearbyOpenAQCount: number;
  recentReadingsCount: number;
  pm25Count: number;
  pm10Count: number;
  validCalculatedAqiCount: number;
  modelledFallbackAvailable: boolean;
  modelledEstimateSummary?: any;
  notes?: string;
}

async function runCityVerification() {
  console.log('========================================================================');
  console.log('       BREATHEBETTER 8-CITY ARCHITECTURE VERIFICATION TEST');
  console.log('========================================================================\n');

  const reports: CityTestReport[] = [];

  for (const cityName of CITIES) {
    console.log(`Testing city: ${cityName}...`);
    let geocodingSuccess = false;
    let coords: { lat: number; lng: number } | null = null;
    let nearbyOpenAQCount = 0;
    let recentReadingsCount = 0;
    let pm25Count = 0;
    let pm10Count = 0;
    let validCalculatedAqiCount = 0;
    let modelledFallbackAvailable = false;
    let modelledEstimateSummary = null;

    try {
      // 1. Geocoding Search
      const searchRes = await axios.get(`${BASE_URL}/cities/search`, {
        params: { q: cityName, countryCode: 'IN' },
        timeout: 10000,
      });

      const matchedCities = searchRes.data?.data;
      if (matchedCities && matchedCities.length > 0) {
        geocodingSuccess = true;
        const bestMatch = matchedCities[0];
        coords = { lat: bestMatch.latitude, lng: bestMatch.longitude };

        // 2. City Air Quality & Nearby Discovery (25km radius)
        const aqRes = await axios.get(`${BASE_URL}/cities/air-quality`, {
          params: {
            lat: coords.lat,
            lng: coords.lng,
            radius: 25,
            name: cityName,
            state: bestMatch.state,
          },
          timeout: 15000,
        });

        const data = aqRes.data;
        const stations = data.stations || [];
        nearbyOpenAQCount = stations.length;

        // Check recent readings (within 24h)
        const now = Date.now();
        recentReadingsCount = stations.filter((s: any) => {
          const t = new Date(s.dataFreshness).getTime();
          return !isNaN(t) && now - t <= 24 * 3600 * 1000;
        }).length;

        // Check PM2.5 and PM10 availability
        pm25Count = stations.filter((s: any) =>
          s.sensors?.some(
            (sn: any) =>
              sn.parameter?.name?.toLowerCase() === 'pm25' ||
              sn.name?.toLowerCase().includes('pm25')
          )
        ).length;

        pm10Count = stations.filter((s: any) =>
          s.sensors?.some(
            (sn: any) =>
              sn.parameter?.name?.toLowerCase() === 'pm10' ||
              sn.name?.toLowerCase().includes('pm10')
          )
        ).length;

        // Valid calculated AQI count
        validCalculatedAqiCount = stations.filter(
          (s: any) => s.isValidAqi === true && s.aqi !== null
        ).length;

        // Modelled fallback availability:
        // Test fallback directly if stations === 0 or query forecast model
        if (data.modelledFallback) {
          modelledFallbackAvailable = true;
          modelledEstimateSummary = data.modelledFallback.data;
        } else {
          // If ground stations exist, check if Open-Meteo modelled API is reachable for this coordinate
          try {
            const forecastRes = await axios.get(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lng}&current=pm10,pm2_5,nitrogen_dioxide,ozone`,
              { timeout: 8000 }
            );
            if (forecastRes.data?.current) {
              modelledFallbackAvailable = true;
              modelledEstimateSummary = forecastRes.data.current;
            }
          } catch {
            modelledFallbackAvailable = false;
          }
        }
      }
    } catch (err: any) {
      console.error(`Error verifying ${cityName}:`, err.message);
    }

    reports.push({
      city: cityName,
      geocodingSuccess,
      coordinates: coords,
      nearbyOpenAQCount,
      recentReadingsCount,
      pm25Count,
      pm10Count,
      validCalculatedAqiCount,
      modelledFallbackAvailable,
      modelledEstimateSummary,
    });
  }

  console.log('\n========================================================================');
  console.log('                          FINAL REPORT TABLE');
  console.log('========================================================================\n');
  console.log(
    'City        | Geocode | Coords (Lat, Lng)    | Nearby | Recent | PM2.5 | PM10 | Valid AQI | Modelled Fallback'
  );
  console.log(
    '------------+---------+----------------------+--------+--------+-------+------+-----------+------------------'
  );

  for (const r of reports) {
    const coordsStr = r.coordinates
      ? `${r.coordinates.lat.toFixed(2)}, ${r.coordinates.lng.toFixed(2)}`
      : 'N/A';
    console.log(
      `${r.city.padEnd(11)} | ` +
        `${r.geocodingSuccess ? 'YES    ' : 'NO     '} | ` +
        `${coordsStr.padEnd(20)} | ` +
        `${r.nearbyOpenAQCount.toString().padEnd(6)} | ` +
        `${r.recentReadingsCount.toString().padEnd(6)} | ` +
        `${r.pm25Count.toString().padEnd(5)} | ` +
        `${r.pm10Count.toString().padEnd(4)} | ` +
        `${r.validCalculatedAqiCount.toString().padEnd(9)} | ` +
        `${r.modelledFallbackAvailable ? 'YES (Open-Meteo)' : 'NO'}`
    );
  }

  console.log('\nVerification run finished successfully.');
}

runCityVerification();

