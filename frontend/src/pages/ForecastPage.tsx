import React, { useState } from 'react';
import { CloudSun, AlertCircle, Info } from 'lucide-react';
import { useForecast } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { POLLUTANT_DISPLAY } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export function ForecastPage() {
  const { selectedLocationId } = useAppStore();
  const { data, isLoading, error } = useForecast(selectedLocationId);
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');

  const forecast = data?.data;
  const hours = forecast?.hours ?? [];

  const chartData = hours.slice(0, 72).map((h) => ({
    time: new Date(h.time).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }),
    value: (h.pollutants as Record<string, number | null>)[selectedPollutant] ?? null,
    usAqi: h.usAqi,
  }));

  if (!selectedLocationId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <CloudSun className="w-12 h-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Select a location to view forecast</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CloudSun className="w-6 h-6 text-primary" />
          Air Quality Forecast
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">Modelled estimate</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Open-Meteo model
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-start">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {forecast?.disclaimer ?? 'Forecast data is a modelled estimate from Open-Meteo. It is not an official government reading and should not be confused with ground-station observations.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
      )}

      {!isLoading && (!forecast || hours.length === 0) && (
        <div className="flex items-center gap-2 text-muted-foreground justify-center py-12">
          <AlertCircle className="w-5 h-5" />
          <span>Forecast unavailable. Open-Meteo integration may be disabled.</span>
        </div>
      )}

      {!isLoading && hours.length > 0 && (
        <>
          {/* Pollutant selector */}
          <div className="flex flex-wrap gap-2">
            {['pm25', 'pm10', 'no2', 'so2', 'o3'].map((p) => {
              const display = POLLUTANT_DISPLAY[p];
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPollutant(p)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    selectedPollutant === p
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {display?.label ?? p.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {POLLUTANT_DISPLAY[selectedPollutant]?.label ?? selectedPollutant.toUpperCase()} Forecast — Next 72 Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    formatter={(val: any) => [
                      `${Number(val)?.toFixed(2) ?? 'N/A'} ${POLLUTANT_DISPLAY[selectedPollutant]?.unit ?? ''}`,
                      `${POLLUTANT_DISPLAY[selectedPollutant]?.label ?? selectedPollutant} (Forecast)`,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#forecastGrad)"
                    dot={false}
                    connectNulls={false}
                    strokeDasharray="6 2"
                    name={`${POLLUTANT_DISPLAY[selectedPollutant]?.label} (Modelled)`}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">
                ⚡ Dashed line indicates modelled forecast, not observed ground measurements.
              </p>
            </CardContent>
          </Card>

          {/* Next 24h summary table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">24-Hour Outlook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">PM2.5</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">PM10</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">US AQI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hours.slice(0, 24).map((h, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5">
                          {new Date(h.time).toLocaleString('en-IN', {
                            weekday: 'short',
                            hour: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata',
                          })}
                        </td>
                        <td className="text-right py-1.5">
                          {h.pollutants.pm25?.toFixed(1) ?? '—'} µg/m³
                        </td>
                        <td className="text-right py-1.5">
                          {h.pollutants.pm10?.toFixed(1) ?? '—'} µg/m³
                        </td>
                        <td className="text-right py-1.5">{h.usAqi ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

