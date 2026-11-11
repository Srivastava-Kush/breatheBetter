import { useState, useEffect } from 'react';
import {
  Wind,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  TrendingUp,
  BellRing,
  CloudSun,
  Droplets,
  Compass,
  Thermometer,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Heart,
  Activity,
  Smile,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { useDashboard, useHistory, useAlerts, useWeather } from '../hooks/useAirQuality';
import { locationsApi } from '../api/endpoints';
import { useAppStore, isSyntheticLocationId } from '../stores/appStore';
import { AQIGauge } from '../components/AQIGauge';
import { AqiVisualFigure, getAqiFigureDetails } from '../components/AqiVisualFigure';
import { PollutantCard } from '../components/ui/PollutantCard';
import { PollutantGuideModal } from '../components/PollutantGuideModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AQIShareCard } from '../components/AQIShareCard';
import { InsightsCard } from '../components/InsightsCard';
import { AirLoadingWidget } from '../components/AirLoadingWidget';
import { formatDateTime, getAQIColorHex } from '../utils';
import type { PollutantReading, AQICategory } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DEFAULT_LOCATION_ID = 17; // R K Puram, Delhi - DPCC (Active CPCB ground station)

function getCategoryAtmosphereStyle(category: string | undefined) {
  switch (category) {
    case 'Good':
      return {
        cardBg: 'bg-gradient-to-br from-emerald-500/[0.08] via-card to-emerald-500/[0.02]',
        borderColor: 'border-emerald-300/70',
        glowBg: 'rgba(0, 153, 102, 0.15)',
        accentTag: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'Satisfactory':
      return {
        cardBg: 'bg-gradient-to-br from-lime-500/[0.08] via-card to-lime-500/[0.02]',
        borderColor: 'border-lime-300/70',
        glowBg: 'rgba(85, 170, 0, 0.15)',
        accentTag: 'bg-lime-100 text-lime-800 border-lime-200',
      };
    case 'Moderate':
      return {
        cardBg: 'bg-gradient-to-br from-amber-500/[0.09] via-card to-amber-500/[0.02]',
        borderColor: 'border-amber-300/70',
        glowBg: 'rgba(255, 222, 51, 0.15)',
        accentTag: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'Poor':
      return {
        cardBg: 'bg-gradient-to-br from-orange-500/[0.09] via-card to-orange-500/[0.02]',
        borderColor: 'border-orange-300/70',
        glowBg: 'rgba(255, 126, 0, 0.15)',
        accentTag: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    case 'Very Poor':
      return {
        cardBg: 'bg-gradient-to-br from-rose-500/[0.09] via-card to-rose-500/[0.02]',
        borderColor: 'border-rose-300/70',
        glowBg: 'rgba(204, 0, 51, 0.15)',
        accentTag: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'Severe':
      return {
        cardBg: 'bg-gradient-to-br from-purple-950/[0.12] via-card to-rose-950/[0.05]',
        borderColor: 'border-purple-300/80',
        glowBg: 'rgba(126, 0, 35, 0.2)',
        accentTag: 'bg-purple-100 text-purple-900 border-purple-200',
      };
    default:
      return {
        cardBg: 'bg-card',
        borderColor: 'border-border',
        glowBg: 'rgba(156, 163, 175, 0.1)',
        accentTag: 'bg-muted text-muted-foreground',
      };
  }
}

function HistoryAreaChart({ locationId }: { locationId: number }) {
  const { data, isLoading } = useHistory(locationId, 24, 'pm25');

  if (isLoading) return <div className="h-44 bg-muted/30 rounded-xl animate-pulse" />;

  const points =
    data?.data?.map((d) => ({
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
      <div className="h-44 flex items-center justify-center text-muted-foreground text-xs italic">
        No 24-hour historical records available for this station yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#106644" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#106644" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          unit=" µg"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="PM2.5 (µg/m³)"
          stroke="#106644"
          strokeWidth={2.5}
          fill="url(#pm25Gradient)"
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OverviewPage() {
  const { selectedLocationId, setSelectedLocation, addRecentLocation, recentLocations } = useAppStore();
  const locationId = (selectedLocationId && !isSyntheticLocationId(selectedLocationId)) ? selectedLocationId : DEFAULT_LOCATION_ID;

  const [isInitialBoot, setIsInitialBoot] = useState<boolean>(() => {
    return !sessionStorage.getItem('bb_initial_boot_done');
  });
  const [bootStatus, setBootStatus] = useState<string>('Detecting your location and nearest CPCB ground station...');
  const [detectedStation, setDetectedStation] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const handleLocateMe = (isBoot: boolean | unknown = false) => {
    const bootMode = isBoot === true;
    if (!navigator.geolocation) {
      if (!bootMode) setLocateError('Geolocation is not supported by your browser.');
      return;
    }
    if (!bootMode) {
      setLocating(true);
      setLocateError(null);
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (bootMode) {
            setBootStatus('Scanning 775 official Indian ground stations for closest monitor...');
          }

          const res = await locationsApi.nearby(lat, lng, 150);
          let nearest = res.data && res.data.length > 0 ? res.data[0] : null;

          if (!nearest) {
            // Client-side fallback: calculate distance to all available stations
            const allRes = await locationsApi.list({ limit: 500 });
            if (allRes.data && allRes.data.length > 0) {
              const sorted = allRes.data
                .filter((l) => l.coordinates?.latitude && l.coordinates?.longitude)
                .map((l) => {
                  const dLat = ((l.coordinates.latitude - lat) * Math.PI) / 180;
                  const dLon = ((l.coordinates.longitude - lng) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((lat * Math.PI) / 180) *
                      Math.cos((l.coordinates.latitude * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  return { ...l, dist };
                })
                .sort((a, b) => a.dist - b.dist);
              if (sorted.length > 0) {
                nearest = sorted[0];
              }
            }
          }

          if (nearest) {
            const targetId = Number(nearest.openaqId || (nearest as any).id);
            if (targetId && !isSyntheticLocationId(targetId)) {
              setSelectedLocation(targetId);
              addRecentLocation({ ...nearest, openaqId: targetId });
              setDetectedStation(nearest.name);
              const distMsg = (nearest as any).dist ? ` (${(nearest as any).dist.toFixed(1)} km away)` : '';
              if (bootMode) {
                setBootStatus(`Locked onto ${nearest.name}${distMsg}`);
              }
            }
          }
        } catch (e) {
          console.error('Failed to detect nearest station:', e);
          if (!bootMode) setLocateError('Unable to detect nearby stations.');
        } finally {
          if (!bootMode) {
            setLocating(false);
          } else {
            setTimeout(() => {
              sessionStorage.setItem('bb_initial_boot_done', 'true');
              setIsInitialBoot(false);
            }, 900);
          }
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        if (!bootMode) {
          setLocateError('Location permission denied or timed out.');
          setLocating(false);
        } else {
          setBootStatus('Location permission unavailable. Connecting to national benchmark station...');
          setTimeout(() => {
            sessionStorage.setItem('bb_initial_boot_done', 'true');
            setIsInitialBoot(false);
          }, 800);
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // Auto-detect user location on initial visit if first boot
  useEffect(() => {
    if (!sessionStorage.getItem('bb_initial_boot_done')) {
      handleLocateMe(true);
    }
  }, []);

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
      aqi?.value !== null &&
      aqi?.value !== undefined &&
      aqi.value >= a.threshold
  );

  const atmosphereStyle = getCategoryAtmosphereStyle(aqi?.category ?? undefined);
  const aqiColor = getAQIColorHex(aqi?.category as AQICategory);
  const figureDetails = getAqiFigureDetails(aqi?.category);

  if (isInitialBoot) {
    return (
      <AirLoadingWidget
        variant="fullscreen"
        title="Connecting to India Clean Air Network"
        subtitle={bootStatus}
        stationName={detectedStation || undefined}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <AirLoadingWidget
          variant="card"
          title="Calibrating Live Station Telemetry"
          subtitle="Harmonizing statutory CPCB pollutant sub-indices & microclimatic weather..."
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center space-y-4 rounded-3xl border border-destructive/20 bg-destructive/5">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Station Telemetry Unavailable</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The requested station ID is not active or reporting telemetry.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Sync
          </Button>
          <Button onClick={() => setSelectedLocation(17)} size="sm">
            Switch to Active Station (R K Puram, Delhi)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Active Threshold Alert Banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-sm">Active Air Quality Alert Exceeded!</div>
              <div className="text-xs text-rose-800">
                Current AQI <strong>{aqi?.value}</strong> exceeds your configured threshold of{' '}
                <strong>{activeAlerts[0].threshold}</strong>.
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-rose-600 text-white shadow-xs">
            Critical Threshold
          </span>
        </div>
      )}

      {/* Atmospheric Hero Command Showcase */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border ${atmosphereStyle.borderColor} ${atmosphereStyle.cardBg} shadow-sm card-hover-lift relative overflow-hidden transition-all duration-300`}
      >
        {/* Ambient Top Glow Orbs */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none filter blur-3xl opacity-40 ambient-pulse"
          style={{ backgroundColor: atmosphereStyle.glowBg }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full pointer-events-none filter blur-3xl opacity-30 ambient-pulse"
          style={{ backgroundColor: atmosphereStyle.glowBg }}
        />

        {/* Hero Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{location?.name ?? 'Select Station'}</span>
              {location?.locality && (
                <span className="text-primary font-bold">· {location.locality}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Real-Time Air Quality Showcase
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Kolkata',
              })}{' '}
              · Indian Standard Time (IST)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLocateMe}
              disabled={locating}
              className="shadow-2xs rounded-xl border-border/80 bg-card/90 hover:bg-muted font-medium text-xs flex items-center gap-1.5"
            >
              <Navigation className={`w-3.5 h-3.5 text-primary ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Finding...' : 'Use My GPS'}</span>
            </Button>
            {dashboard && <AQIShareCard dashboard={dashboard} />}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shadow-2xs rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>

        {locateError && (
          <div className="mt-3 p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locateError}</span>
            </div>
            <button
              onClick={() => setLocateError(null)}
              className="text-amber-800 font-bold hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3-Pillar Atmosphere Centerpiece */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 relative z-10 items-center">
          {/* Pillar 1: Animated CPCB AQI Dial */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-card/90 border border-border/80 shadow-xs text-center space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-primary" />
              <span>CPCB National AQI</span>
            </div>

            <AQIGauge
              aqi={aqi?.value ?? null}
              category={aqi?.category ?? 'Unknown'}
              size="lg"
            />

            <div className="space-y-1 w-full pt-1">
              {aqi?.isValid && aqi.dominantPollutant && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-bold text-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aqiColor }} />
                  <span>Dominant: {aqi.dominantPollutant.toUpperCase()}</span>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground pt-1">
                {aqi?.displayLabel ?? 'CPCB Piecewise Methodology'}
              </div>
              {aqi?.calculatedAt && (
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground/80 font-mono">
                  <Clock className="w-3 h-3" />
                  Calculated {formatDateTime(aqi.calculatedAt)}
                </div>
              )}
            </div>
          </div>

          {/* Pillar 2: Official Character Illustration & Real-World Meaning */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-card/90 border border-border/80 shadow-xs text-center space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Real-World Atmosphere</span>
            </div>

            <AqiVisualFigure
              category={aqi?.category}
              size="md"
              showDetails={true}
            />
          </div>

          {/* Pillar 3: Multi-API Meteorological Dispersion Chips */}
          <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-2xl bg-card/90 border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-primary" />
                <span>Weather & Ventilation</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Open-Meteo
              </span>
            </div>

            {weather ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-500" />
                    <span>Temperature</span>
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {weather.temperatureC}°C
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {weather.weatherDescription}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Wind className="w-3 h-3 text-primary" />
                    <span>Surface Wind</span>
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {weather.windSpeedKmh} <span className="text-[10px] font-normal">km/h</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Heading {weather.windDirectionDeg}°
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-base font-extrabold text-foreground">
                    {weather.relativeHumidity}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {weather.surfacePressureHpa} hPa
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-600" />
                    <span>Dispersion</span>
                  </div>
                  <div className="text-sm font-extrabold capitalize text-foreground truncate">
                    {weather.dispersionConditions}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">Ventilation</div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                Synchronizing meteorological dispersion telemetry...
              </div>
            )}

            {weather && (
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground leading-snug">
                <strong className="text-foreground">Dispersion:</strong>{' '}
                {weather.dispersionExplanation}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Action Protocols Section */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>Medical & Health Precautions Protocol</span>
            </CardTitle>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
              style={{ backgroundColor: aqiColor }}
            >
              {aqi?.category ?? 'Advisory'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {health ? (
            <>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/60">
                {health.general}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    icon: '🏃',
                    label: 'Outdoor Exercise',
                    text: health.exercise,
                    border: 'border-l-emerald-500',
                  },
                  {
                    icon: '👶',
                    label: 'Sensitive Groups',
                    text: health.sensitiveGroups,
                    border: 'border-l-amber-500',
                  },
                  {
                    icon: '🚶',
                    label: 'Outdoor Walks',
                    text: health.outdoor,
                    border: 'border-l-sky-500',
                  },
                  {
                    icon: '😷',
                    label: 'Mask & Filtration',
                    text: health.masks,
                    border: 'border-l-rose-500',
                  },
                ].map(({ icon, label, text, border }) => (
                  <div
                    key={label}
                    className={`p-3.5 rounded-xl bg-card border border-border/80 border-l-4 ${border} shadow-2xs space-y-1.5`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <span className="text-base">{icon}</span>
                      <span>{label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {text}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground italic pt-1">
                Disclaimer: Automated guidance based on official CPCB health advisories. Sensitive individuals should follow physician guidance.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Health guidance currently synchronizing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Intelligence Card */}
      <InsightsCard locationId={locationId} />

      {/* Key Pollutants Telemetry Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2 text-foreground">
              <Activity className="w-5 h-5 text-primary" />
              <span>Live Pollutant Concentrations & Sub-Indices</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Physical particulate and gaseous readings recorded by on-site optical spectrometers
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGuidePollutant('pm25');
              setGuideOpen(true);
            }}
            className="text-xs shadow-xs rounded-xl"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Understand Pollutants
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
            <Wind className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No active pollutant telemetry reported</p>
            <p className="text-xs mt-0.5">Sensor synchronization in progress</p>
          </div>
        )}
      </div>

      {/* 24-Hour PM2.5 Micro-Trend Chart Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>24-Hour PM2.5 Atmospheric Concentration Profile</span>
            </CardTitle>
            <span className="text-[11px] font-mono text-muted-foreground">
              NAAQS Safe 24h Limit: 60 µg/m³
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <HistoryAreaChart locationId={locationId} />
          <p className="text-[11px] text-muted-foreground">
            Continuous hourly average readings recorded by regulatory monitors. Missing points reflect active calibration cycles.
          </p>
        </CardContent>
      </Card>

      {/* Recently Viewed Stations */}
      {recentLocations.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recently Inspected Stations
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentLocations.slice(0, 6).map((loc) => (
              <button
                key={loc.openaqId}
                onClick={() => useAppStore.getState().setSelectedLocation(loc.openaqId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:scale-102"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{loc.name.split(',')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Educational Pollutant Meaning Guide Modal */}
      <PollutantGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        initialPollutant={guidePollutant}
      />
    </div>
  );
}
