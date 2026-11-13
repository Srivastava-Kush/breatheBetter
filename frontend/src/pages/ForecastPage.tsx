import React, { useState } from 'react';
import { CloudSun, AlertCircle, Info, Cpu, Sparkles, Wind, Droplets, Gauge, ArrowRight } from 'lucide-react';
import { useForecast, useMLPrediction } from '../hooks/useAirQuality';
import { useAppStore, isSyntheticLocationId, useIsDark } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { POLLUTANT_DISPLAY, type AQICategory } from '../types';
import { getAQIColorHex } from '../utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export function ForecastPage() {
  const { selectedLocationId } = useAppStore();
  const isDark = useIsDark();
  const locationId = (selectedLocationId && !isSyntheticLocationId(selectedLocationId)) ? selectedLocationId : 17;
  const [activeTab, setActiveTab] = useState<'openmeteo' | 'ml'>('ml');
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');

  const { data: forecastData, isLoading: forecastLoading } = useForecast(locationId);
  const { data: mlData, isLoading: mlLoading } = useMLPrediction(locationId);

  const forecast = forecastData?.data;
  const hours = forecast?.hours ?? [];
  const mlModel = mlData?.data;

  const openMeteoChartData = hours.slice(0, 72).map((h) => ({
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

  const mlChartData = (mlModel?.hourlyPredictions ?? []).map((p) => ({
    time: new Date(p.time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }),
    predictedAqi: p.predictedAqi,
    confidenceLower: p.confidenceLower,
    confidenceUpper: p.confidenceUpper,
    pm25: p.predictedPm25,
    category: p.predictedCategory as AQICategory,
    influence: p.dominantInfluence.replace(/_/g, ' '),
  }));

  // Dynamic AQI Multi-stop gradient calculation for SVG
  const aqiValues = mlChartData.map((d) => d.predictedAqi);
  const maxPredAqi = aqiValues.length > 0 ? Math.max(...aqiValues, 200) : 300;
  const minPredAqi = aqiValues.length > 0 ? Math.max(0, Math.min(...aqiValues, 50)) : 0;
  const aqiSpan = Math.max(maxPredAqi - minPredAqi, 40);

  const getOffsetPercent = (val: number) => {
    const raw = ((maxPredAqi - val) / aqiSpan) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const cpcbThresholds = [
    { aqi: 450, color: '#7e0023' }, // Severe
    { aqi: 350, color: '#cc0033' }, // Very Poor
    { aqi: 250, color: '#ff7e00' }, // Poor
    { aqi: 150, color: '#ffde33' }, // Moderate
    { aqi: 75, color: '#55aa00' },  // Satisfactory
    { aqi: 25, color: '#009966' },  // Good
  ];

  if (!selectedLocationId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
        <CloudSun className="w-12 h-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Select a location to view forecast and ML predictions</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-primary" />
            Air Quality Forecast & Predictions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare atmospheric dispersion forecasts with multi-factor machine learning projections.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('ml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ml'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            ML-Based Prediction (24h)
          </button>
          <button
            onClick={() => setActiveTab('openmeteo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'openmeteo'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5 text-blue-600" />
            Open-Meteo Model (7d)
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ML-BASED PREDICTION MODEL */}
      {/* ======================================================== */}
      {activeTab === 'ml' && (
        <div className="space-y-6">
          {mlLoading && (
            <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />
          )}

          {!mlLoading && mlModel && (
            <>
              {/* ML Overview Header Card */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Gradient-Boosted Lag Model
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Confidence: <strong>{mlModel.accuracyConfidenceScore}%</strong>
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-foreground mt-1">
                      {mlModel.modelType}
                    </h2>
                  </div>

                  {/* Real-time Weather Telemetry */}
                  <div className="flex items-center gap-3 text-xs bg-muted/40 p-2 rounded-lg border border-border/40">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Wind className="w-3.5 h-3.5 text-primary" />
                      <span>{mlModel.currentWeatherContext.windSpeedKmh} km/h Wind</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span>{mlModel.currentWeatherContext.relativeHumidity}% RH</span>
                    </div>
                    <span className="font-semibold text-foreground capitalize">
                      {mlModel.currentWeatherContext.dispersionConditions} Dispersion
                    </span>
                  </div>
                </div>

                {/* 24-Hour ML Prediction Chart with Confidence Envelopes */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-foreground">
                      Next 24-Hour Predicted AQI Trajectory with 90% Confidence Envelope
                    </div>
                    {/* CPCB Scale Legend Indicator */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#009966]" /> Good</span>
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#55aa00]" /> Satisfactory</span>
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#ffde33]" /> Moderate</span>
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#ff7e00]" /> Poor</span>
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#cc0033]" /> Very Poor</span>
                      <span className="flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-[#7e0023]" /> Severe</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={mlChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        {/* Dynamic CPCB Spectrum Area Fill Gradient */}
                        <linearGradient id="mlAqiGrad" x1="0" y1="0" x2="0" y2="1">
                          {cpcbThresholds.map((t, i) => (
                            <stop
                              key={`fill-${i}`}
                              offset={`${getOffsetPercent(t.aqi)}%`}
                              stopColor={t.color}
                              stopOpacity={0.4}
                            />
                          ))}
                        </linearGradient>

                        {/* Dynamic CPCB Spectrum Stroke Gradient */}
                        <linearGradient id="mlAqiStrokeGrad" x1="0" y1="0" x2="0" y2="1">
                          {cpcbThresholds.map((t, i) => (
                            <stop
                              key={`stroke-${i}`}
                              offset={`${getOffsetPercent(t.aqi)}%`}
                              stopColor={t.color}
                              stopOpacity={1}
                            />
                          ))}
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#21332a' : '#e2e8f0'} />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDark ? '#8fa59b' : '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: isDark ? '#8fa59b' : '#64748b' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111a16' : '#ffffff',
                          border: `1px solid ${isDark ? '#253930' : '#cbd5e1'}`,
                          borderRadius: 10,
                          fontSize: 12,
                          boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
                        }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          const catColor = getAQIColorHex(data.category);
                          return (
                            <div className="p-2.5 bg-card border border-border rounded-xl shadow-lg space-y-1.5 min-w-44 text-xs">
                              <div className="text-[11px] font-mono text-muted-foreground">{data.time}</div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-foreground">Predicted AQI:</span>
                                <span className="text-sm font-black" style={{ color: catColor }}>
                                  {data.predictedAqi}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Category:</span>
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                                  style={{
                                    backgroundColor: catColor,
                                    color: data.category === 'Moderate' ? '#111827' : '#ffffff',
                                  }}
                                >
                                  {data.category}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                                <span>90% Range:</span>
                                <span className="font-mono">
                                  {data.confidenceLower} – {data.confidenceUpper}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60 capitalize">
                                Primary Driver: <span className="font-semibold text-foreground">{data.influence}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke="none"
                        fill="#e2e8f0"
                        fillOpacity={0.6}
                        name="Upper 90% Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                        name="Lower 90% Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="predictedAqi"
                        stroke="url(#mlAqiStrokeGrad)"
                        strokeWidth={3}
                        fill="url(#mlAqiGrad)"
                        name="Predicted AQI"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-[11px] text-muted-foreground">
                    The curve dynamically shifts across CPCB color thresholds (Green = Good &rarr; Yellow = Moderate &rarr; Orange = Poor &rarr; Red = Very Poor &rarr; Maroon = Severe) based on calculated pollution concentrations.
                  </p>
                </div>
              </div>

              {/* Feature Importance & Model Weights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Machine Learning Feature Weights & Influence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mlModel.featureImportance.map((feat, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{feat.feature}</span>
                          <span className="font-mono font-bold text-primary">{feat.weightPercent}% weight</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${feat.weightPercent}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{feat.impact}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Predictive Schedule with CPCB Category Accents */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hourly Prediction Breakdown (CPCB Color-Coded)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {mlModel.hourlyPredictions.slice(0, 12).map((pred) => {
                      const catColor = getAQIColorHex(pred.predictedCategory as AQICategory);
                      const textColor = pred.predictedCategory === 'Moderate' ? '#111827' : '#ffffff';
                      return (
                        <div
                          key={pred.hourOffset}
                          className="p-2.5 rounded-xl border border-border bg-card text-center space-y-1 shadow-xs hover:border-primary/50 transition-all hover:scale-[1.02]"
                          style={{ borderTop: `3.5px solid ${catColor}` }}
                        >
                          <div className="text-[11px] text-muted-foreground font-mono">
                            +{pred.hourOffset}h ({new Date(pred.time).getHours()}:00)
                          </div>
                          <div className="text-xl font-black tracking-tight" style={{ color: catColor }}>
                            {pred.predictedAqi}
                          </div>
                          <div>
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: catColor, color: textColor }}
                            >
                              {pred.predictedCategory}
                            </span>
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate capitalize font-mono">
                            {pred.dominantInfluence.replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OPEN-METEO ATMOSPHERIC MODEL */}
      {/* ======================================================== */}
      {activeTab === 'openmeteo' && (
        <div className="space-y-6">
          {/* Disclaimer */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3 items-start">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {forecast?.disclaimer ??
                    'Forecast data is a modelled estimate from Open-Meteo. It is not an official government reading and should not be confused with physical ground observations.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {forecastLoading && (
            <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
          )}

          {!forecastLoading && (!forecast || hours.length === 0) && (
            <div className="flex items-center gap-2 text-muted-foreground justify-center py-12">
              <AlertCircle className="w-5 h-5" />
              <span>Forecast unavailable. Open-Meteo integration may be disabled.</span>
            </div>
          )}

          {!forecastLoading && hours.length > 0 && (
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
                          ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
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
                    <AreaChart data={openMeteoChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? '#60a5fa' : '#3b82f6'} stopOpacity={isDark ? 0.35 : 0.3} />
                          <stop offset="95%" stopColor={isDark ? '#60a5fa' : '#3b82f6'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                          color: isDark ? '#60a5fa' : '#2563eb',
                        }}
                        labelStyle={{
                          color: isDark ? '#8fa59b' : '#64748b',
                          fontWeight: 600,
                        }}
                        formatter={(val: any) => [
                          `${Number(val)?.toFixed(2) ?? 'N/A'} ${POLLUTANT_DISPLAY[selectedPollutant]?.unit ?? ''}`,
                          `${POLLUTANT_DISPLAY[selectedPollutant]?.label ?? selectedPollutant} (Forecast)`,
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={isDark ? '#60a5fa' : '#3b82f6'}
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
                    ⚡ Dashed line indicates numerical atmospheric dispersion simulation, not an observed ground sensor measurement.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
