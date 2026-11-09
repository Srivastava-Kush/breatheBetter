import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useHistory } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { POLLUTANT_DISPLAY } from '../types';
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

const CHART_COLORS: Record<string, string> = {
  pm25: '#009966',
  pm10: '#3b82f6',
  no2: '#8b5cf6',
  so2: '#f59e0b',
  co: '#ef4444',
  o3: '#06b6d4',
};

function PollutantChart({
  locationId,
  pollutant,
  hours,
}: {
  locationId: number;
  pollutant: string;
  hours: number;
}) {
  const { data, isLoading, error } = useHistory(locationId, hours, pollutant);
  const display = POLLUTANT_DISPLAY[pollutant] ?? { label: pollutant.toUpperCase(), unit: '' };
  const color = CHART_COLORS[pollutant] ?? '#009966';

  if (isLoading) return <div className="h-48 bg-muted/30 rounded animate-pulse" />;

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
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No {display.label} data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(val: any) => [`${Number(val)?.toFixed(2)} ${display.unit}`, display.label]}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={`${display.label} (${display.unit})`}
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsPage() {
  const [hours, setHours] = useState(168);
  const [activePollutants, setActivePollutants] = useState(['pm25', 'pm10']);
  const { selectedLocationId } = useAppStore();

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Historical Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Hourly average measurements from OpenAQ ground sensors
          </p>
        </div>

        {/* Time range */}
        <div className="flex gap-2">
          {TIME_RANGES.map(({ label, hours: h }) => (
            <Button
              key={label}
              variant={hours === h ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHours(h)}
            >
              {label}
            </Button>
          ))}
        </div>
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'border-transparent text-white'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              style={active ? { backgroundColor: CHART_COLORS[p] } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[p] }} />
              {display?.label ?? p.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {activePollutants.map((p) => (
          <Card key={p}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[p] }}
                />
                {POLLUTANT_DISPLAY[p]?.label ?? p.toUpperCase()} Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PollutantChart
                locationId={selectedLocationId}
                pollutant={p}
                hours={hours}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <strong>Note:</strong> Gaps in charts represent periods where no measurements are available. 
        Missing data is never interpolated or filled. Data sourced from OpenAQ hourly averages.
      </div>
    </div>
  );
}

