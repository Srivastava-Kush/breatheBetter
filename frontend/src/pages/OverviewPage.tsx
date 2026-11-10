import { useState } from 'react';
import { Wind, AlertCircle, RefreshCw, MapPin, Clock, TrendingUp, BellRing, CloudSun, Droplets, Compass, Thermometer, BookOpen } from 'lucide-react';
import { useDashboard, useHistory, useAlerts, useWeather } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { AQIGauge } from '../components/AQIGauge';
import { AqiVisualFigure } from '../components/AqiVisualFigure';
import { PollutantCard } from '../components/ui/PollutantCard';
import { PollutantGuideModal } from '../components/PollutantGuideModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AQIShareCard } from '../components/AQIShareCard';
import { InsightsCard } from '../components/InsightsCard';
import { formatDateTime } from '../utils';
import type { PollutantReading } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DEFAULT_LOCATION_ID = 4663956; // Santushti Apartments, Vasant Kunj — fallback for demo

function HistoryChart({ locationId }: { locationId: number }) {
  const { data, isLoading } = useHistory(locationId, 24, 'pm25');

  if (isLoading) return <div className="h-48 bg-muted/30 rounded animate-pulse" />;

  const points = data?.data?.map((d) => ({
    time: new Date(d.measurementUtc).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }),
    value: d.value,
  })) ?? [];

  if (points.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No historical data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name="PM2.5 (µg/m³)"
          stroke="#009966"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OverviewPage() {
  const { selectedLocationId, recentLocations } = useAppStore();
  const locationId = selectedLocationId ?? DEFAULT_LOCATION_ID;

  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePollutant, setGuidePollutant] = useState('pm25');

  const { data, isLoading, isError, refetch, isFetching } = useDashboard(locationId);
  const { data: alertsData } = useAlerts();
  const { data: weatherRes } = useWeather(locationId);

  const dashboard = data?.data;
  const weather = weatherRes?.data;
  const aqi = dashboard?.aqi;
  const health = dashboard?.health;
  const pollutants = dashboard?.pollutants ?? {};
  const location = dashboard?.location;

  const activeAlerts = (alertsData?.data ?? []).filter(
    (a: any) =>
      a.locationId === locationId &&
      a.isActive &&
      aqi?.value !== undefined &&
      aqi.value !== null &&
      aqi.value >= a.aqiThreshold
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">Unable to load dashboard</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The backend may be starting up or the location is not yet synced.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Active Threshold Alert Banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 shrink-0 animate-bounce" />
            <div>
              <div className="font-semibold text-sm">Smart Threshold Alert Triggered!</div>
              <div className="text-xs opacity-90">
                AQI at {location?.name} ({aqi?.value}) has exceeded your configured alert threshold of {activeAlerts[0].aqiThreshold}.
              </div>
            </div>
          </div>
          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-rose-500 text-white">
            Threshold Exceeded
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <MapPin className="w-4 h-4" />
            <span>{location?.name ?? 'Select a location'}</span>
            {location?.locality && <span>· {location.locality}</span>}
          </div>
          <h1 className="text-2xl font-bold">Air Quality Overview</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Kolkata',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dashboard && <AQIShareCard dashboard={dashboard} />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AQI Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Air Quality Index
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <AQIGauge
              aqi={aqi?.value ?? null}
              category={aqi?.category ?? 'Unknown'}
              size="lg"
            />

            {/* Visual Meaning Figure & Human Activity Meaning */}
            <div className="w-full pt-2 border-t border-border/60">
              <AqiVisualFigure
                category={aqi?.category}
                size="md"
                showDetails={true}
              />
            </div>

            {aqi && !aqi.isValid && (
              <div className="w-full p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {aqi.invalidReason ?? 'AQI unavailable'}
              </div>
            )}

            {aqi?.isValid && aqi.dominantPollutant && (
              <div className="text-center space-y-1">
                <div className="text-xs text-muted-foreground">Dominant pollutant</div>
                <Badge variant="default">{aqi.dominantPollutant.toUpperCase()}</Badge>
              </div>
            )}

            <div className="text-xs text-center text-muted-foreground px-2">
              {aqi?.displayLabel ?? 'No AQI data available'}
            </div>

            {aqi?.calculatedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Calculated {formatDateTime(aqi.calculatedAt)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Recommendation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{health?.emoji}</span>
              Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {health ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {health.general}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: '🏃 Outdoor Activity', text: health.outdoor },
                    { label: '⚠️ Sensitive Groups', text: health.sensitiveGroups },
                    { label: '🤸 Exercise', text: health.exercise },
                    { label: '😷 Masks', text: health.masks },
                  ].map(({ label, text }) => (
                    <div key={label} className="p-3 rounded-lg bg-muted/30 space-y-1">
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">{text}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Disclaimer: Health recommendations are general information only. Consult a healthcare professional for personal advice.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Health data unavailable. Select a location to see recommendations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Pollution Insights */}
      <InsightsCard locationId={locationId} />

      {/* Multi-API Meteorological Dispersion Integration */}
      {weather && (
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-primary" />
                Multi-API Meteorological & Atmospheric Ventilation Context
              </CardTitle>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Open-Meteo Weather API
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-500" />
                  Temperature
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {weather.temperatureC}°C
                </div>
                <div className="text-[10px] text-muted-foreground">{weather.weatherDescription}</div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Wind className="w-3 h-3 text-primary" />
                  Surface Wind
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {weather.windSpeedKmh} <span className="text-xs font-normal text-muted-foreground">km/h</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Heading {weather.windDirectionDeg}°</div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  Relative Humidity
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {weather.relativeHumidity}%
                </div>
                <div className="text-[10px] text-muted-foreground">Pressure {weather.surfacePressureHpa} hPa</div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-600" />
                  Dispersion Rating
                </div>
                <div className="text-sm font-bold text-foreground capitalize mt-1">
                  {weather.dispersionConditions}
                </div>
                <div className="text-[10px] text-muted-foreground">Boundary ventilation</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Dispersion Analysis:</strong> {weather.dispersionExplanation}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pollutants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Pollutant Readings
            {Object.keys(pollutants).length === 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                — No readings available
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGuidePollutant('pm25');
              setGuideOpen(true);
            }}
            className="text-xs shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Understand Pollutants
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Object.entries(pollutants).map(([key, reading]) => (
            <PollutantCard
              key={key}
              pollutant={key}
              reading={reading as PollutantReading}
              onOpenGuide={(p) => {
                setGuidePollutant(p);
                setGuideOpen(true);
              }}
            />
          ))}
        </div>
        {Object.keys(pollutants).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Wind className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No pollutant measurements available for this location.</p>
            <p className="text-sm mt-1">
              Data will appear after the first sync completes.
            </p>
          </div>
        )}
      </div>

      {/* 24h PM2.5 Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            PM2.5 — Last 24 Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryChart locationId={locationId} />
          <p className="text-xs text-muted-foreground mt-2">
            Hourly average measurements from OpenAQ ground sensors.
            Gaps indicate missing or unavailable data for that period.
          </p>
        </CardContent>
      </Card>

      {/* Recently viewed */}
      {recentLocations.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">Recent Locations</h2>
          <div className="flex flex-wrap gap-2">
            {recentLocations.slice(0, 6).map((loc) => (
              <button
                key={loc.openaqId}
                onClick={() => useAppStore.getState().setSelectedLocation(loc.openaqId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border
                           text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {loc.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Educational Pollutant Meaning Guide */}
      <PollutantGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        initialPollutant={guidePollutant}
      />
    </div>
  );
}

