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
};

// Forecast
export const forecastApi = {
  get: (locationId: number, days = 7) =>
    apiClient
      .get<ApiResponse<ForecastData>>(`/forecast/${locationId}`, {
        params: { days },
      })
      .then((r) => r.data),
};

// Health Insights
export const healthApi = {
  get: (locationId: number) =>
    apiClient
      .get<ApiResponse<{ health: HealthRecommendation; category: string }>>(`/health-insights/${locationId}`)
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

