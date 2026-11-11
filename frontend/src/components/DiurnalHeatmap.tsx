import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  Info,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { POLLUTANT_DISPLAY, type AQICategory } from '../types';
import { getAQIColorHex, getAQICategory } from '../utils';
import { AirLoadingWidget } from './AirLoadingWidget';

interface ObservationPoint {
  pollutant: string;
  value: number;
  unit: string;
  measurementUtc: string;
}

interface DiurnalHeatmapProps {
  observations: ObservationPoint[];
  hoursWindow: number;
  isLoading?: boolean;
  onOpenGuide?: (pollutant: string) => void;
}

const POLLUTANT_ORDER = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];

// CPCB Sub-Index Breakpoint calculation
function calculateSubIndex(pollutant: string, concentration: number): { subIndex: number; category: AQICategory } {
  if (concentration < 0 || isNaN(concentration)) {
    return { subIndex: 0, category: 'Good' };
  }

  interface BP {
    cLow: number;
    cHigh: number;
    iLow: number;
    iHigh: number;
    cat: AQICategory;
  }

  const table: Record<string, BP[]> = {
    pm25: [
      { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
    pm10: [
      { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 100, cHigh: 250, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 250, cHigh: 350, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 350, cHigh: 430, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 430, cHigh: 500, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
    no2: [
      { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 80, cHigh: 180, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 180, cHigh: 280, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 280, cHigh: 400, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 400, cHigh: 500, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
    so2: [
      { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 80, cHigh: 380, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 380, cHigh: 800, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 800, cHigh: 1600, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 1600, cHigh: 2000, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
    co: [
      { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 1.0, cHigh: 2.0, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 2.0, cHigh: 10.0, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 10.0, cHigh: 17.0, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 17.0, cHigh: 34.0, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 34.0, cHigh: 50.0, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
    o3: [
      { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50, cat: 'Good' },
      { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100, cat: 'Satisfactory' },
      { cLow: 100, cHigh: 168, iLow: 101, iHigh: 200, cat: 'Moderate' },
      { cLow: 168, cHigh: 208, iLow: 201, iHigh: 300, cat: 'Poor' },
      { cLow: 208, cHigh: 748, iLow: 301, iHigh: 400, cat: 'Very Poor' },
      { cLow: 748, cHigh: 1000, iLow: 401, iHigh: 500, cat: 'Severe' },
    ],
  };

  const bps = table[pollutant.toLowerCase()];
  if (!bps) {
    const fallbackCat = getAQICategory(concentration);
    return { subIndex: Math.round(concentration), category: fallbackCat };
  }

  // Find matching bracket
  for (const b of bps) {
    if (concentration >= b.cLow && concentration <= b.cHigh) {
      const idx = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (concentration - b.cLow);
      return { subIndex: Math.round(idx), category: b.cat };
    }
  }

  // Above max bracket: severe
  const last = bps[bps.length - 1];
  if (concentration > last.cHigh) {
    return { subIndex: 500, category: 'Severe' };
  }

  return { subIndex: 0, category: 'Good' };
}

// Diurnal atmospheric context explanation helper
function getDiurnalContext(hour: number): string {
  if (hour >= 23 || hour <= 4) {
    return 'Deep nocturnal radiation cooling; low planetary boundary layer suppresses vertical dispersion.';
  }
  if (hour >= 5 && hour <= 6) {
    return 'Early morning dawn calm; pre-sunrise thermal inversion traps ground-level emissions.';
  }
  if (hour >= 7 && hour <= 9) {
    return 'Morning commuter rush hour; dense traffic emissions surge into shallow cold boundary layer.';
  }
  if (hour >= 10 && hour <= 12) {
    return 'Solar insolation heating ground; boundary layer commences convective expansion.';
  }
  if (hour >= 13 && hour <= 16) {
    return 'Peak solar convective mixing & maximum boundary layer height; optimal atmospheric ventilation.';
  }
  if (hour >= 17 && hour <= 19) {
    return 'Evening rush hour & sunset cooling; boundary layer rapidly collapses, trapping exhaust.';
  }
  return 'Nocturnal commercial transit & biomass heating; accumulation of un-dispersed particulate matter.';
}

export function DiurnalHeatmap({
  observations,
  hoursWindow,
  isLoading,
  onOpenGuide,
}: DiurnalHeatmapProps) {
  const [viewMode, setViewMode] = useState<'severity' | 'subindex' | 'concentration'>('severity');
  const [hoveredCell, setHoveredCell] = useState<{
    pollutant: string;
    hour: number;
    subIndex: number;
    avgConc: number;
    count: number;
    category: AQICategory;
    unit: string;
  } | null>(null);

  // Group observations by [pollutant][hourIST (0..23)]
  const matrixData = useMemo(() => {
    // 6 rows x 24 columns
    const grid: Record<
      string,
      Array<{ sum: number; count: number; unit: string }>
    > = {};

    POLLUTANT_ORDER.forEach((p) => {
      grid[p] = Array.from({ length: 24 }, () => ({ sum: 0, count: 0, unit: '' }));
    });

    observations.forEach((obs) => {
      const pol = obs.pollutant.toLowerCase();
      if (!grid[pol]) return;

      const date = new Date(obs.measurementUtc);
      // Compute Indian Standard Time hour (0..23)
      const hourIST = parseInt(
        new Intl.DateTimeFormat('en-IN', {
          hour: 'numeric',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        }).format(date),
        10
      );

      if (hourIST >= 0 && hourIST < 24 && typeof obs.value === 'number' && !isNaN(obs.value)) {
        grid[pol][hourIST].sum += obs.value;
        grid[pol][hourIST].count += 1;
        if (!grid[pol][hourIST].unit && obs.unit) {
          grid[pol][hourIST].unit = obs.unit;
        }
      }
    });

    // Compute averages, sub-indices and categories
    const processed: Record<
      string,
      Array<{
        avgConc: number | null;
        subIndex: number | null;
        category: AQICategory | null;
        count: number;
        unit: string;
      }>
    > = {};

    POLLUTANT_ORDER.forEach((p) => {
      processed[p] = grid[p].map((cell) => {
        if (cell.count === 0) {
          return { avgConc: null, subIndex: null, category: null, count: 0, unit: cell.unit };
        }
        const avg = cell.sum / cell.count;
        const { subIndex, category } = calculateSubIndex(p, avg);
        return {
          avgConc: Number(avg.toFixed(1)),
          subIndex,
          category,
          count: cell.count,
          unit: cell.unit || (p === 'co' ? 'mg/m³' : 'µg/m³'),
        };
      });
    });

    // Compute composite peak AQI for each of the 24 hours
    const compositePeak: Array<{
      peakAQI: number | null;
      category: AQICategory | null;
      dominantPollutant: string | null;
    }> = Array.from({ length: 24 }, (_, hour) => {
      let maxIdx = -1;
      let dominant = '';

      POLLUTANT_ORDER.forEach((p) => {
        const cell = processed[p][hour];
        if (cell.subIndex !== null && cell.subIndex > maxIdx) {
          maxIdx = cell.subIndex;
          dominant = p;
        }
      });

      if (maxIdx === -1) {
        return { peakAQI: null, category: null, dominantPollutant: null };
      }

      return {
        peakAQI: maxIdx,
        category: getAQICategory(maxIdx),
        dominantPollutant: dominant,
      };
    });

    // Compute statistical highlights (Cleanest vs Worst window)
    let minAQI = Infinity;
    let minHour = -1;
    let maxAQI = -Infinity;
    let maxHour = -1;

    compositePeak.forEach((c, h) => {
      if (c.peakAQI !== null) {
        if (c.peakAQI < minAQI) {
          minAQI = c.peakAQI;
          minHour = h;
        }
        if (c.peakAQI > maxAQI) {
          maxAQI = c.peakAQI;
          maxHour = h;
        }
      }
    });

    return {
      processed,
      compositePeak,
      highlights: {
        cleanest: minHour !== -1 ? { hour: minHour, aqi: minAQI } : null,
        worst: maxHour !== -1 ? { hour: maxHour, aqi: maxAQI } : null,
      },
    };
  }, [observations]);

  const { processed, compositePeak, highlights } = matrixData;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading) {
    return (
      <Card className="border-border overflow-hidden">
        <AirLoadingWidget
          variant="card"
          title="Synthesizing 24-Hour Diurnal Pollution Matrix"
          subtitle={`Aggregating multi-pollutant concentrations across ${hoursWindow}h observation window...`}
        />
      </Card>
    );
  }

  return (
    <Card className="border-border overflow-hidden shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>Multi-Pollutant 24-Hour Diurnal Heatmap Matrix</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                All Pollutants Aggregated
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Hour-of-day diurnal distribution averaged over the past <strong>{hoursWindow}h</strong> observation period. Color-mapped to statutory CPCB severity breakpoints.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground">Cell Display:</span>
            <div className="flex items-center gap-1 bg-card p-0.5 rounded-lg border border-border shadow-2xs">
              {(
                [
                  { id: 'severity', label: 'CPCB Category' },
                  { id: 'subindex', label: 'Sub-Index (0-500)' },
                  { id: 'concentration', label: 'Concentration' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    viewMode === mode.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diurnal Intelligence Highlights */}
        {highlights.cleanest && highlights.worst && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3 mt-1">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Cleanest Diurnal Window:</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 font-mono text-[11px]">
                    {String(highlights.cleanest.hour).padStart(2, '0')}:00 – {String((highlights.cleanest.hour + 2) % 24).padStart(2, '0')}:00 IST
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-tight">
                  Midday solar heating expands planetary boundary layer height, promoting atmospheric convective dispersion.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4 text-rose-700" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Peak Exposure Window:</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-200/80 font-mono text-[11px]">
                    {String(highlights.worst.hour).padStart(2, '0')}:00 – {String((highlights.worst.hour + 2) % 24).padStart(2, '0')}:00 IST
                  </span>
                </div>
                <p className="text-[11px] text-rose-800/90 leading-tight">
                  Nocturnal radiative surface cooling collapses mixing layer; ground thermal inversion traps traffic exhaust.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Scrollable Heatmap Table Container */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="min-w-[840px] select-none">
            {/* Time of Day Quadrant Header */}
            <div className="grid grid-cols-[140px_repeat(24,minmax(0,1fr))] items-center gap-1 mb-1 text-[10px] text-muted-foreground font-semibold">
              <div className="text-right pr-2">Diurnal Period:</div>
              <div className="col-span-6 bg-slate-100 rounded px-1.5 py-0.5 text-center flex items-center justify-center gap-1 text-slate-700 border border-slate-200/70">
                <Moon className="w-3 h-3 text-slate-500" /> Night (00:00–05:59)
              </div>
              <div className="col-span-6 bg-amber-50 rounded px-1.5 py-0.5 text-center flex items-center justify-center gap-1 text-amber-800 border border-amber-200/70">
                <Sunrise className="w-3 h-3 text-amber-600" /> Morning Rush (06:00–11:59)
              </div>
              <div className="col-span-6 bg-sky-50 rounded px-1.5 py-0.5 text-center flex items-center justify-center gap-1 text-sky-800 border border-sky-200/70">
                <Sun className="w-3 h-3 text-sky-600" /> Afternoon Sun (12:00–17:59)
              </div>
              <div className="col-span-6 bg-purple-50 rounded px-1.5 py-0.5 text-center flex items-center justify-center gap-1 text-purple-800 border border-purple-200/70">
                <Sunset className="w-3 h-3 text-purple-600" /> Evening Inversion (18:00–23:59)
              </div>
            </div>

            {/* Hourly Column Labels */}
            <div className="grid grid-cols-[140px_repeat(24,minmax(0,1fr))] items-center gap-1 mb-2 text-[10px] font-mono text-muted-foreground">
              <div className="font-sans font-bold text-foreground text-xs pl-1">Pollutant / Hour</div>
              {hours.map((h) => (
                <div key={h} className="text-center font-semibold">
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Pollutant Rows */}
            <div className="space-y-1">
              {POLLUTANT_ORDER.map((p) => {
                const info = POLLUTANT_DISPLAY[p] ?? { label: p.toUpperCase(), unit: '' };
                const row = processed[p];

                return (
                  <div
                    key={p}
                    className="grid grid-cols-[140px_repeat(24,minmax(0,1fr))] items-center gap-1"
                  >
                    {/* Pollutant Header Cell */}
                    <div className="flex items-center justify-between pr-2 py-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-foreground truncate">
                          {info.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({info.unit})</span>
                      </div>
                      {onOpenGuide && (
                        <button
                          onClick={() => onOpenGuide(p)}
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                          title={`Learn about ${info.label}`}
                        >
                          <HelpCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* 24 Hourly Cells */}
                    {hours.map((h) => {
                      const cell = row[h];
                      const hasData = cell && cell.category !== null;
                      const bg = hasData ? getAQIColorHex(cell.category) : '#f3f4f6';
                      const isDark = cell?.category && ['Good', 'Poor', 'Very Poor', 'Severe'].includes(cell.category);
                      const textColor = isDark ? '#ffffff' : '#111827';

                      return (
                        <div
                          key={h}
                          onMouseEnter={() => {
                            if (hasData) {
                              setHoveredCell({
                                pollutant: p,
                                hour: h,
                                subIndex: cell.subIndex!,
                                avgConc: cell.avgConc!,
                                count: cell.count,
                                category: cell.category!,
                                unit: cell.unit,
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="h-8 rounded-[5px] flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 hover:z-20 shadow-2xs relative border border-black/5"
                          style={{
                            backgroundColor: bg,
                            color: textColor,
                          }}
                        >
                          {viewMode === 'subindex' && hasData && cell.subIndex}
                          {viewMode === 'concentration' && hasData && (
                            <span className="text-[9px] truncate px-0.5">
                              {cell.avgConc! >= 10 ? Math.round(cell.avgConc!) : cell.avgConc}
                            </span>
                          )}
                          {viewMode === 'severity' && !hasData && (
                            <span className="text-gray-400 font-normal text-[9px]">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Bottom Composite Peak AQI Row */}
              <div className="grid grid-cols-[140px_repeat(24,minmax(0,1fr))] items-center gap-1 pt-2 border-t border-border/80 mt-2">
                <div className="pr-2 py-1 flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-primary truncate">
                    Composite Peak AQI
                  </span>
                </div>

                {hours.map((h) => {
                  const comp = compositePeak[h];
                  const hasData = comp && comp.peakAQI !== null;
                  const bg = hasData ? getAQIColorHex(comp.category) : '#f3f4f6';
                  const isDark = comp?.category && ['Good', 'Poor', 'Very Poor', 'Severe'].includes(comp.category);
                  const textColor = isDark ? '#ffffff' : '#111827';

                  return (
                    <div
                      key={`comp-${h}`}
                      className="h-8 rounded-[5px] flex items-center justify-center font-mono text-[10px] font-extrabold shadow-xs transition-transform hover:scale-110 hover:z-20 relative border-2 border-white"
                      style={{
                        backgroundColor: bg,
                        color: textColor,
                      }}
                      title={hasData ? `Hour ${h}:00 Peak AQI = ${comp.peakAQI} (${comp.category}) driven by ${comp.dominantPollutant?.toUpperCase()}` : ''}
                    >
                      {hasData ? comp.peakAQI : '—'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Hover Inspection Popover Box */}
        {hoveredCell ? (
          <div className="p-3 rounded-xl bg-card border border-border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-xs shrink-0"
                style={{
                  backgroundColor: getAQIColorHex(hoveredCell.category),
                  color: hoveredCell.category === 'Moderate' ? '#111827' : '#ffffff',
                }}
              >
                {hoveredCell.subIndex}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>{POLLUTANT_DISPLAY[hoveredCell.pollutant]?.label ?? hoveredCell.pollutant.toUpperCase()}</span>
                  <span className="text-muted-foreground font-normal">at</span>
                  <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.2 rounded text-[11px]">
                    {String(hoveredCell.hour).padStart(2, '0')}:00 – {String((hoveredCell.hour + 1) % 24).padStart(2, '0')}:00 IST
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                    style={{
                      backgroundColor: getAQIColorHex(hoveredCell.category),
                      color: hoveredCell.category === 'Moderate' ? '#111827' : '#ffffff',
                    }}
                  >
                    {hoveredCell.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mean Concentration: <strong>{hoveredCell.avgConc} {hoveredCell.unit}</strong> (aggregated across {hoveredCell.count} sensor telemetry readings).
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground sm:text-right max-w-sm italic border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-3">
              {getDiurnalContext(hoveredCell.hour)}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-muted/30 border border-dashed border-border/80 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>Hover over any hourly cell in the matrix to inspect exact concentrations, CPCB sub-indices, and planetary boundary layer dynamics.</span>
            </div>
            <span className="text-[11px] font-mono hidden md:inline">Timezone: Asia/Kolkata (IST)</span>
          </div>
        )}

        {/* CPCB Severity Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          <span className="text-muted-foreground font-semibold text-[11px]">CPCB Severity Legend:</span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { cat: 'Good', range: '0–50', color: '#009966', text: '#ffffff' },
              { cat: 'Satisfactory', range: '51–100', color: '#55aa00', text: '#ffffff' },
              { cat: 'Moderate', range: '101–200', color: '#ffde33', text: '#111827' },
              { cat: 'Poor', range: '201–300', color: '#ff7e00', text: '#ffffff' },
              { cat: 'Very Poor', range: '301–400', color: '#cc0033', text: '#ffffff' },
              { cat: 'Severe', range: '401–500', color: '#7e0023', text: '#ffffff' },
              { cat: 'No Data', range: 'N/A', color: '#f3f4f6', text: '#6b7280' },
            ].map((item) => (
              <div key={item.cat} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="w-3.5 h-3.5 rounded-sm shadow-2xs border border-black/10 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground">{item.cat}</span>
                <span className="text-muted-foreground font-mono text-[10px]">({item.range})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

