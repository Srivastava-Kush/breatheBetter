import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  locationsApi,
  aqiApi,
  historyApi,
  forecastApi,
  compareApi,
  alertsApi,
} from '../api/endpoints';

// Keys
export const queryKeys = {
  locations: (params?: object) => ['locations', params],
  location: (id: number) => ['location', id],
  nearbyLocations: (lat: number, lng: number) => ['nearby', lat, lng],
  dashboard: (id: number) => ['dashboard', id],
  history: (id: number, hours?: number, pollutant?: string) => ['history', id, hours, pollutant],
  forecast: (id: number) => ['forecast', id],
  compare: (ids: number[]) => ['compare', ids],
  alerts: () => ['alerts'],
};

// Locations
export const useLocations = (params?: {
  limit?: number;
  skip?: number;
  search?: string;
  country?: string;
}) =>
  useQuery({
    queryKey: queryKeys.locations(params),
    queryFn: () => locationsApi.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useLocation = (id: number) =>
  useQuery({
    queryKey: queryKeys.location(id),
    queryFn: () => locationsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useNearbyLocations = (
  lat: number | null,
  lng: number | null,
  radius = 50
) =>
  useQuery({
    queryKey: queryKeys.nearbyLocations(lat!, lng!),
    queryFn: () => locationsApi.nearby(lat!, lng!, radius),
    enabled: lat !== null && lng !== null,
    staleTime: 2 * 60 * 1000,
  });

// Dashboard / AQI
export const useDashboard = (locationId: number | null) =>
  useQuery({
    queryKey: queryKeys.dashboard(locationId!),
    queryFn: () => aqiApi.dashboard(locationId!),
    enabled: locationId !== null,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 min
  });

// History
export const useHistory = (
  locationId: number | null,
  hours = 168,
  pollutant?: string
) =>
  useQuery({
    queryKey: queryKeys.history(locationId!, hours, pollutant),
    queryFn: () => historyApi.get(locationId!, { hours, pollutant }),
    enabled: locationId !== null,
    staleTime: 10 * 60 * 1000,
  });

// Forecast
export const useForecast = (locationId: number | null) =>
  useQuery({
    queryKey: queryKeys.forecast(locationId!),
    queryFn: () => forecastApi.get(locationId!),
    enabled: locationId !== null,
    staleTime: 30 * 60 * 1000,
  });

// Compare
export const useCompare = (locationIds: number[]) =>
  useQuery({
    queryKey: queryKeys.compare(locationIds),
    queryFn: () => compareApi.compare(locationIds),
    enabled: locationIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

// Alerts
export const useAlerts = () =>
  useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: () => alertsApi.list(),
    staleTime: 60 * 1000,
  });

export const useCreateAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts() }),
  });
};

export const useDeleteAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts() }),
  });
};

