import { apiClient } from './client';
import type {
  ApiResponse,
  Location,
  DashboardData,
  HistoryDataPoint,
  ForecastData,
  HealthRecommendation,
} from '../types';

// Locations
export const locationsApi = {
  list: (params?: {
    limit?: number;
    skip?: number;
    search?: string;
    country?: string;
    isMonitor?: boolean;
  }) =>
    apiClient
      .get<ApiResponse<Location[]>>('/locations', { params })
      .then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Location>>(`/locations/${id}`).then((r) => r.data),

  nearby: (lat: number, lng: number, radius = 50) =>
    apiClient
      .get<ApiResponse<Location[]>>('/locations/nearby', {
        params: { lat, lng, radius },
      })
      .then((r) => r.data),

  search: (q: string) =>
    apiClient
      .get<ApiResponse<Location[]>>('/locations/search', { params: { q } })
      .then((r) => r.data),
};

// AQI
export const aqiApi = {
  dashboard: (locationId: number) =>
    apiClient
      .get<ApiResponse<DashboardData>>(`/aqi/dashboard/${locationId}`)
      .then((r) => r.data),

  current: (locationId: number) =>
    apiClient
      .get<ApiResponse<unknown>>(`/aqi/current/${locationId}`)
      .then((r) => r.data),

  weather: (locationId: number) =>
    apiClient
      .get<ApiResponse<{
        temperatureC: number;
        relativeHumidity: number;
        windSpeedKmh: number;
        windDirectionDeg: number;
        surfacePressureHpa: number;
        weatherCode: number;
        weatherDescription: string;
        dispersionConditions: 'favorable' | 'moderate' | 'poor' | 'stagnant';
        dispersionExplanation: string;
      }>>(`/aqi/weather/${locationId}`)
      .then((r) => r.data),

  refresh: (locationId: number) =>
    apiClient.post(`/aqi/refresh/${locationId}`).then((r) => r.data),
};

// History
export const historyApi = {
  get: (locationId: number, params?: { hours?: number; pollutant?: string }) =>
    apiClient
      .get<ApiResponse<HistoryDataPoint[]>>(`/history/${locationId}`, { params })
      .then((r) => r.data),

  getPollutant: (locationId: number, pollutant: string, hours = 168) =>
    apiClient
      .get<ApiResponse<HistoryDataPoint[]>>(`/history/${locationId}/${pollutant}`, {
        params: { hours },
      })
      .then((r) => r.data),

  anomalies: (locationId: number, params?: { hours?: number; pollutant?: string }) =>
    apiClient
      .get<ApiResponse<{
        locationId: number;
        stationName: string;
        analyzedHours: number;
        dataPointsEvaluated: number;
        totalAnomaliesDetected: number;
        status: 'normal' | 'anomalous_spikes_detected' | 'severe_irregularity';
        anomalies: Array<{
          id: string;
          timestamp: string;
          pollutant: string;
          observedValue: number;
          expectedBaseline: number;
          zScore: number;
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          title: string;
          explanation: string;
        }>;
      }>>(`/history/anomalies/${locationId}`, { params })
      .then((r) => r.data),

  report: (locationId: number, days = 30) =>
    apiClient
      .get<ApiResponse<any>>(`/history/report/${locationId}`, { params: { days } })
      .then((r) => r.data),
};

// Forecast
export const forecastApi = {
  get: (locationId: number, days = 7) =>
    apiClient
      .get<ApiResponse<ForecastData>>(`/forecast/${locationId}`, {
        params: { days },
      })
      .then((r) => r.data),

  mlPrediction: (locationId: number) =>
    apiClient
      .get<ApiResponse<{
        modelType: string;
        trainingFeatures: string[];
        currentWeatherContext: {
          windSpeedKmh: number;
          temperatureC: number;
          relativeHumidity: number;
          dispersionConditions: string;
        };
        featureImportance: Array<{ feature: string; weightPercent: number; impact: string }>;
        accuracyConfidenceScore: number;
        hourlyPredictions: Array<{
          hourOffset: number;
          time: string;
          predictedAqi: number;
          predictedCategory: string;
          predictedPm25: number;
          confidenceLower: number;
          confidenceUpper: number;
          dominantInfluence: string;
        }>;
      }>>(`/forecast/ml-prediction/${locationId}`)
      .then((r) => r.data),
};

// Health Insights
export const healthApi = {
  get: (locationId: number) =>
    apiClient
      .get<ApiResponse<{ health: HealthRecommendation; category: string }>>(`/health-insights/${locationId}`)
      .then((r) => r.data),
};

// AI Pollution Insights
export const insightsApi = {
  get: (locationId: number) =>
    apiClient
      .get<ApiResponse<{
        stationName: string;
        summary: string;
        trend: 'improving' | 'worsening' | 'stable';
        trendDescription: string;
        peakHour: string | null;
        pmRatio: { ratio: number | null; interpretation: string };
        keyFindings: string[];
        generatedAt: string;
      }>>(`/insights/${locationId}`)
      .then((r) => r.data),
};

// Compare
export const compareApi = {
  compare: (locationIds: number[]) =>
    apiClient
      .get<ApiResponse<unknown[]>>('/compare', {
        params: { ids: locationIds.join(',') },
      })
      .then((r) => r.data),
};

// Cities (Open-Meteo Geocoding & City Air Quality)
export const citiesApi = {
  search: (q: string, countryCode = 'IN') =>
    apiClient
      .get<ApiResponse<Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        state?: string;
        country: string;
        district?: string;
      }>>>('/cities/search', { params: { q, countryCode } })
      .then((r) => r.data),

  airQuality: (params: { lat: number; lng: number; radius?: number; name?: string; state?: string }) =>
    apiClient
      .get<ApiResponse<{
        city: { name: string; state?: string; coordinates: { latitude: number; longitude: number }; searchRadiusKm: number };
        overview: {
          totalNearbyStations: number;
          stationsWithRecentData: number;
          validAqiStationsCount: number;
          availablePollutants: string[];
          aqiRange: { min: number; max: number } | null;
        };
        stations: any[];
        modelledFallback: any | null;
      }>>('/cities/air-quality', { params })
      .then((r) => r.data),
};

// Alerts
export const alertsApi = {
  list: () => apiClient.get('/alerts').then((r) => r.data),

  create: (data: {
    locationId: number;
    stationName: string;
    aqiThreshold: number;
    condition?: 'above' | 'below';
    pollutant?: string;
  }) => apiClient.post('/alerts', data).then((r) => r.data),

  update: (id: string, data: Partial<{ aqiThreshold: number; isActive: boolean }>) =>
    apiClient.put(`/alerts/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/alerts/${id}`).then((r) => r.data),
};

