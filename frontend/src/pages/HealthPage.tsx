import React from 'react';
import { Heart, AlertCircle, Info } from 'lucide-react';
import { useDashboard } from '../hooks/useAirQuality';
import { useAppStore, isSyntheticLocationId } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AQIGauge } from '../components/AQIGauge';
import type { AQICategory } from '../types';
import { getAQIColorHex } from '../utils';

const HEALTH_ICONS: Record<string, string> = {
  general: '🌍',
  outdoor: '🏃',
  sensitiveGroups: '⚠️',
  exercise: '🤸',
  windows: '🪟',
  masks: '😷',
};

export function HealthPage() {
  const { selectedLocationId } = useAppStore();
  const locationId = (selectedLocationId && !isSyntheticLocationId(selectedLocationId)) ? selectedLocationId : 17;
  const { data, isLoading } = useDashboard(locationId);

  const dashboard = data?.data;
  const aqi = dashboard?.aqi;
  const health = dashboard?.health;
  const dominantDesc = dashboard?.dominantPollutantDescription;
  const category = (aqi?.category ?? 'Unknown') as AQICategory | 'Unknown';
  const color = getAQIColorHex(category as AQICategory);

  if (!selectedLocationId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <Heart className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">No location selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use the search bar to select a monitoring station.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 animate-pulse space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
    </div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          Health & Safety Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Based on current air quality measurements at {dashboard?.location?.name}
        </p>
      </div>

      {/* AQI + Category banner */}
      <div
        className="rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
        style={{ backgroundColor: color + '15', borderLeft: `4px solid ${color}` }}
      >
        <AQIGauge aqi={aqi?.value ?? null} category={category} size="md" />
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="text-2xl font-bold" style={{ color }}>
            {health?.emoji} {category}
          </div>
          <p className="text-muted-foreground">{health?.general}</p>
          {aqi?.dominantPollutant && (
            <div className="text-sm">
              <strong>Dominant pollutant:</strong> {aqi.dominantPollutant.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Dominant pollutant description */}
      {dominantDesc && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">About the dominant pollutant</div>
                <p className="text-sm text-muted-foreground">{dominantDesc}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'outdoor', label: 'Outdoor Activities', value: health.outdoor },
            { key: 'sensitiveGroups', label: 'Sensitive Groups', value: health.sensitiveGroups },
            { key: 'exercise', label: 'Exercise Guidance', value: health.exercise },
            { key: 'windows', label: 'Ventilation', value: health.windows },
            { key: 'masks', label: 'Mask Guidance', value: health.masks },
          ].map(({ key, label, value }) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <span className="text-xl">{HEALTH_ICONS[key]}</span>
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <p className="text-sm text-muted-foreground mt-1">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AQI unavailable */}
      {aqi && !aqi.isValid && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">AQI calculation incomplete</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {aqi.invalidReason ?? 'Insufficient data to calculate AQI.'}
                  {' '}Health recommendations above are based on the available data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 rounded-xl bg-muted/30 text-xs text-muted-foreground">
        <strong>Disclaimer:</strong> Health recommendations are general information derived from CPCB air quality guidelines. 
        They are not medical advice. Consult a qualified healthcare professional for personal health decisions.
        AQI is calculated by BreatheBetter using CPCB methodology and is not an officially published CPCB value.
      </div>
    </div>
  );
}

