import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Activity,
  CheckCircle2,
  FileText,
  ArrowRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useHistory, useAnomalies } from '../hooks/useAirQuality';
import { useAppStore, isSyntheticLocationId, useIsDark } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { POLLUTANT_DISPLAY } from '../types';
import { PollutantGuideModal } from '../components/PollutantGuideModal';
import { DiurnalHeatmap } from '../components/DiurnalHeatmap';
import { AirLoadingWidget } from '../components/AirLoadingWidget';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const TIME_RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

const POLLUTANTS = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];

const CHART_COLORS_LIGHT: Record<string, string> = {
  pm25: '#009966',
  pm10: '#2563eb',
  no2: '#7c3aed',
  so2: '#d97706',
  co: '#dc2626',
  o3: '#0891b2',
};

const CHART_COLORS_DARK: Record<string, string> = {
  pm25: '#34d399',
  pm10: '#60a5fa',
  no2: '#a78bfa',
  so2: '#fbbf24',
  co: '#f87171',
  o3: '#22d3ee',
};

const getChartColor = (pollutant: string, isDark: boolean = false): string =>
  (isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT)[pollutant] ?? (isDark ? '#34d399' : '#009966');

function PollutantChart({
  locationId,
  pollutant,
  hours,
  onOpenGuide,
}: {
  locationId: number;
  pollutant: string;
  hours: number;
  onOpenGuide?: (pollutant: string) => void;
}) {
  const { data, isLoading } = useHistory(locationId, hours, pollutant);
  const isDark = useIsDark();
  const display = POLLUTANT_DISPLAY[pollutant] ?? { label: pollutant.toUpperCase(), unit: '' };
  const color = getChartColor(pollutant, isDark);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border/80 bg-card/60">
        <AirLoadingWidget
          variant="inline"
          title={`Fetching ${display.label} Telemetry Series`}
          subtitle={`Querying OpenAQ ${hours}h sensor observations...`}
        />
      </div>
    );
  }

  const points = data?.data?.map((d) => ({
    time: new Date(d.measurementUtc).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: hours <= 24 ? '2-digit' : undefined,
      minute: hours <= 24 ? '2-digit' : undefined,
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }),
    value: d.value,
  })) ?? [];

  if (points.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-sm">
          <div className="text-sm font-bold text-foreground">
            Historical Records Unavailable for {display.label}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No telemetry records exist for <strong>{display.label}</strong> ({display.unit}) at this station during the selected <strong>{hours}h</strong> observation timeframe.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <span className="px-2 py-0.5 rounded-md bg-card border border-border">Sensor uninstalled / offline</span>
          <span className="px-2 py-0.5 rounded-md bg-card border border-border">Maintenance calibration</span>
        </div>
        {onOpenGuide && (
          <button
            onClick={() => onOpenGuide(pollutant)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Learn what {display.label} is and why it matters &rarr;
          </button>
        )}
      </div>
    );
  }

  // Calculate percentage delta from start of period to end
  const firstVal = points[0]?.value || 0;
  const lastVal = points[points.length - 1]?.value || 0;
  const percentDelta = firstVal > 0 ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0;
  const peakVal = Math.max(...points.map((p) => p.value));

  return (
    <div className="space-y-3">
      {/* Quick stats strip */}
      <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
        <div>
          Peak Spike: <strong className="text-foreground">{peakVal.toFixed(1)} {display.unit}</strong>
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <span>Period Trend:</span>
          <span className={percentDelta > 0 ? 'text-rose-600' : 'text-emerald-600'}>
            {percentDelta > 0 ? `+${percentDelta}% surge` : `${percentDelta}% reduction`}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#21332a' : '#e2e8f0'} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDark ? '#8fa59b' : '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: isDark ? '#8fa59b' : '#64748b' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#111a16' : '#ffffff',
              border: `1px solid ${isDark ? '#253930' : '#cbd5e1'}`,
              borderRadius: 10,
              fontSize: 12,
              color: isDark ? '#f3f7f5' : '#0f241d',
              boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.08)',
            }}
            itemStyle={{
              color: color,
            }}
            labelStyle={{
              color: isDark ? '#8fa59b' : '#64748b',
              fontWeight: 600,
            }}
            formatter={(val: any) => [`${Number(val)?.toFixed(2)} ${display.unit}`, display.label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={`${display.label} (${display.unit})`}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsPage() {
  const isDark = useIsDark();
  const [hours, setHours] = useState(168);
  const [activePollutants, setActivePollutants] = useState(['pm25', 'pm10']);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePollutant, setGuidePollutant] = useState('pm25');
  const { selectedLocationId } = useAppStore();
  const locationId = (selectedLocationId && !isSyntheticLocationId(selectedLocationId)) ? selectedLocationId : 17;
  const navigate = useNavigate();

  const { data: allHistoryRes, isLoading: allHistoryLoading } = useHistory(
    locationId,
    hours
  );
  const allObservations = (allHistoryRes?.data as any[]) ?? [];

  const { data: anomaliesRes, isLoading: anomaliesLoading } = useAnomalies(
    locationId,
    hours,
    'pm25'
  );
  const anomalyData = anomaliesRes?.data;
  const anomalies = anomalyData?.anomalies ?? [];

  const togglePollutant = (p: string) => {
    setActivePollutants((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].slice(0, 4)
    );
  };

  if (!selectedLocationId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <BarChart3 className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold">No location selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use the search bar above to select a monitoring station.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Historical Pollution Tracker & Analytics
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Statistical trend curves, anomaly detection, and percentage fluctuation tracker
          </p>
        </div>

        {/* Time range & Impact Report button */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-xl border border-border">
            {TIME_RANGES.map(({ label, hours: h }) => (
              <button
                key={label}
                onClick={() => setHours(h)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  hours === h
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGuidePollutant('pm25');
                setGuideOpen(true);
              }}
              className="shadow-xs"
            >
              <BookOpen className="w-4 h-4 mr-1.5 text-primary" />
              Pollutant Guide
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/report')}
              className="shadow-xs"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Impact Report
            </Button>
          </div>
        </div>
      </div>

      {/* Statistical Anomaly Detection Engine Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Statistical Anomaly & Surge Detection Engine (Z-Score & IQR)
            </CardTitle>
            <span className="text-[11px] text-muted-foreground font-mono">
              Analyzed Window: {hours}h
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomaliesLoading && (
            <div className="py-2">
              <AirLoadingWidget
                variant="compact"
                title={`Evaluating statistical Z-Score & IQR anomaly model over ${hours}h series...`}
              />
            </div>
          )}

          {!anomaliesLoading && anomalies.length === 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                No statistical emission surges or abnormal sensor anomalies detected over this {hours}-hour timeframe. Observations conform to expected diurnal planetary boundary layer curves.
              </span>
            </div>
          )}

          {!anomaliesLoading && anomalies.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Detected {anomalies.length} unusual pollution spike{anomalies.length > 1 ? 's' : ''} in historical series:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {anomalies.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-foreground space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-900">{a.title}</span>
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        Z = +{a.zScore}σ
                      </span>
                    </div>
                    <p className="text-xs text-rose-800/90 leading-relaxed">
                      {a.explanation}
                    </p>
                    <div className="text-[10px] text-rose-900/60 font-mono">
                      Timestamp: {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Pollutant Aggregated 24-Hour Diurnal Heatmap Matrix */}
      <DiurnalHeatmap
        observations={allObservations}
        hoursWindow={hours}
        isLoading={allHistoryLoading}
        onOpenGuide={(pol) => {
          setGuidePollutant(pol);
          setGuideOpen(true);
        }}
      />

      {/* Individual Pollutants Section Header & Selector */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Individual Pollutant Trend Curves & Detailed Telemetry
            </h2>
            <p className="text-xs text-muted-foreground">
              Select up to 4 specific pollutants to view separate high-resolution statistical dispersion curves
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Active: {activePollutants.map((p) => p.toUpperCase()).join(', ')}
          </span>
        </div>

        {/* Pollutant selector */}
        <div className="flex flex-wrap gap-2">
          {POLLUTANTS.map((p) => {
            const display = POLLUTANT_DISPLAY[p];
            const active = activePollutants.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePollutant(p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'border-transparent text-white shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground bg-card'
                }`}
                style={active ? { backgroundColor: getChartColor(p, isDark) } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getChartColor(p, isDark) }} />
                {display?.label ?? p.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {activePollutants.map((p) => (
          <Card key={p}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getChartColor(p, isDark) }}
                  />
                  {POLLUTANT_DISPLAY[p]?.label ?? p.toUpperCase()} Historical Distribution
                </CardTitle>
                <button
                  onClick={() => {
                    setGuidePollutant(p);
                    setGuideOpen(true);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  title={`Learn what ${POLLUTANT_DISPLAY[p]?.label ?? p.toUpperCase()} means`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <PollutantChart
                locationId={locationId}
                pollutant={p}
                hours={hours}
                onOpenGuide={(pol) => {
                  setGuidePollutant(pol);
                  setGuideOpen(true);
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-[11px] text-muted-foreground">
        <strong>Data Integrity Notice:</strong> Historical measurements represent physical observations recorded by OpenAQ ground monitors. Sensor gaps are preserved as missing records and never synthetically fabricated.
      </div>

      {/* Educational Pollutant Meaning Guide */}
      <PollutantGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        initialPollutant={guidePollutant}
      />
    </div>
  );
}
