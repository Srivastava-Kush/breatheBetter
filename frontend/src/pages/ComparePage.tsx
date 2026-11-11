import React, { useState, useEffect, useMemo } from 'react';
import {
  GitCompare,
  Plus,
  X,
  AlertCircle,
  MapPin,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Search,
  Compass,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useCompare, useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { locationsApi } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AQIGauge } from '../components/AQIGauge';
import { AirLoadingWidget } from '../components/AirLoadingWidget';
import { POLLUTANT_DISPLAY } from '../types';
import { getAQIColorHex } from '../utils';
import type { AQICategory, Location } from '../types';

interface ComparisonItem {
  locationId: number;
  stationName: string;
  locality: string | null;
  country: { code: string; name: string };
  coordinates?: { latitude: number; longitude: number };
  aqi: {
    value: number | null;
    category: string | null;
    dominantPollutant: string | null;
    isValid: boolean;
    invalidReason: string | null;
  } | null;
  pollutants: Record<string, { value: number; unit: string }>;
}

// Major Indian Metro Benchmark Stations
const METRO_BENCHMARKS = [
  { id: 17, name: 'Delhi NCR', stationName: 'R K Puram, Delhi - DPCC' },
  { id: 2598, name: 'Mumbai', stationName: 'Airoli, Navi Mumbai - MPCB' },
  { id: 412, name: 'Bengaluru', stationName: 'Peenya, Bengaluru - KSPCB' },
  { id: 716, name: 'Kolkata', stationName: 'Rabindra Bharati University - WBPCB' },
  { id: 2456, name: 'Lucknow', stationName: 'Talkatora, Lucknow - CPCB' },
  { id: 5590, name: 'Varanasi', stationName: 'Ardhali Bazar, Varanasi - UPPCB' },
  { id: 407, name: 'Hyderabad', stationName: 'Zoo Park, Hyderabad - TSPCB' },
  { id: 5631, name: 'Ahmedabad', stationName: 'Maninagar, Ahmedabad - GPCB' },
  { id: 2585, name: 'Pune', stationName: 'Karve Road, Pune - MPCB' },
];

export function ComparePage() {
  const {
    selectedLocationId,
    compareLocationIds,
    addCompareLocation,
    removeCompareLocation,
    clearCompareLocations,
  } = useAppStore();

  const [nearbyStations, setNearbyStations] = useState<Location[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [activeBaselineName, setActiveBaselineName] = useState<string>('Your Location');
  const [searchQuery, setSearchQuery] = useState('');

  const baselineId = selectedLocationId || 17;

  // Pre-seed compare array with baseline if empty
  useEffect(() => {
    if (compareLocationIds.length === 0 && baselineId) {
      addCompareLocation(baselineId);
    }
  }, [baselineId, compareLocationIds.length, addCompareLocation]);

  // Fetch coordinates of baseline station to locate nearby monitors
  useEffect(() => {
    let isCancelled = false;
    setNearbyLoading(true);

    locationsApi
      .getById(baselineId)
      .then((res) => {
        if (isCancelled || !res?.data) return;
        const loc = res.data;
        setActiveBaselineName(loc.name.split(',')[0].trim());

        if (loc.coordinates?.latitude && loc.coordinates?.longitude) {
          return locationsApi.nearby(loc.coordinates.latitude, loc.coordinates.longitude, 120);
        }
      })
      .then((nearbyRes) => {
        if (isCancelled || !nearbyRes?.data) return;
        // Filter out the baseline itself from the "nearby" candidates list
        const others = nearbyRes.data.filter(
          (s) => Number(s.openaqId || (s as any).id) !== baselineId
        );
        setNearbyStations(others);
      })
      .catch((err) => {
        console.warn('Failed to load nearby stations for comparison:', err);
      })
      .finally(() => {
        if (!isCancelled) setNearbyLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [baselineId]);

  const { data: compareData, isLoading: compareLoading, error } = useCompare(compareLocationIds);
  const { data: locationsData } = useLocations({ limit: 500, country: 'IN' });

  const comparisons = (compareData?.data as ComparisonItem[]) ?? [];
  const allLocations = locationsData?.data ?? [];

  // Filter all locations by search
  const filteredAllLocations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allLocations
      .filter((l) => l.name.toLowerCase().includes(q) || (l.locality && l.locality.toLowerCase().includes(q)))
      .slice(0, 15);
  }, [searchQuery, allLocations]);

  // Quick preset handlers
  const handleCompareNearby = () => {
    clearCompareLocations();
    addCompareLocation(baselineId);
    nearbyStations.slice(0, 3).forEach((s) => {
      const id = Number(s.openaqId || (s as any).id);
      if (id) addCompareLocation(id);
    });
  };

  const handleCompareMetros = () => {
    clearCompareLocations();
    [17, 2598, 412, 716].forEach((id) => addCompareLocation(id));
  };

  // Compute Cleanest vs Most Polluted in active comparison
  const stats = useMemo(() => {
    const valid = comparisons.filter((c) => c.aqi?.value !== null && c.aqi?.value !== undefined);
    if (valid.length < 2) return null;

    const sorted = [...valid].sort((a, b) => (a.aqi?.value ?? 0) - (b.aqi?.value ?? 0));
    const cleanest = sorted[0];
    const worst = sorted[sorted.length - 1];
    const diff = (worst.aqi?.value ?? 0) - (cleanest.aqi?.value ?? 0);
    const pct = cleanest.aqi?.value ? Math.round((diff / cleanest.aqi.value) * 100) : 0;

    return { cleanest, worst, diff, pct };
  }, [comparisons]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            Air Quality Comparison & Benchmarking
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare live CPCB telemetry across nearby ground stations and national metropolitan centers
          </p>
        </div>

        {compareLocationIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompareLocations} className="shadow-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Clear Comparison ({compareLocationIds.length}/5)
          </Button>
        )}
      </div>

      {/* Preset Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Quick Presets:
        </span>

        {nearbyStations.length > 0 && (
          <button
            onClick={handleCompareNearby}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            Compare {nearbyStations.length} Nearby Local Stations
          </button>
        )}

        <button
          onClick={handleCompareMetros}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Building2 className="w-3.5 h-3.5 text-primary" />
          Compare Top 4 Indian Metros (Delhi, Mumbai, BLR, Kolkata)
        </button>
      </div>

      {/* Station Selection Tray */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Select Stations to Compare (Up to 5)</span>
            <span className="text-[11px] font-mono text-primary font-bold">
              {compareLocationIds.length} / 5 Selected
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Section 1: Nearby Stations within 120 km */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Nearby Stations in Your Region (Within 120 km of {activeBaselineName})
              </span>
              {nearbyLoading && <span className="text-[10px] text-muted-foreground animate-pulse">Scanning nearby...</span>}
            </div>

            {nearbyStations.length === 0 && !nearbyLoading && (
              <p className="text-xs text-muted-foreground italic">
                No secondary ground stations found within 120 km of this station. Try comparing with major metro cities below.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {nearbyStations.map((station) => {
                const sId = Number(station.openaqId || (station as any).id);
                const isSelected = compareLocationIds.includes(sId);
                const dist = (station as any).distanceKm || (station as any).dist;

                return (
                  <button
                    key={sId}
                    disabled={!isSelected && compareLocationIds.length >= 5}
                    onClick={() => (isSelected ? removeCompareLocation(sId) : addCompareLocation(sId))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    } disabled:opacity-50`}
                  >
                    <span>{isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}</span>
                    <span className="truncate max-w-[200px]">{station.name.split(',')[0]}</span>
                    {dist !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {dist.toFixed(1)} km
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Major Indian Metro Benchmarks */}
          <div className="pt-2 border-t border-border/50">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Major Indian Metro Benchmarks
            </div>

            <div className="flex flex-wrap gap-2">
              {METRO_BENCHMARKS.map((m) => {
                const isSelected = compareLocationIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={!isSelected && compareLocationIds.length >= 5}
                    onClick={() => (isSelected ? removeCompareLocation(m.id) : addCompareLocation(m.id))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    } disabled:opacity-50`}
                  >
                    <span>{isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}</span>
                    <span className="font-semibold">{m.name}</span>
                    <span className={`text-[10px] truncate max-w-[140px] opacity-80`}>
                      ({m.stationName.split(',')[0]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Search Any Station */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search and add any other Indian station..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredAllLocations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {filteredAllLocations.map((loc) => {
                  const id = Number(loc.openaqId || (loc as any).id);
                  const isSelected = compareLocationIds.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => (isSelected ? removeCompareLocation(id) : addCompareLocation(id))}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-card border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Analytics Highlight Banner (when 2+ stations) */}
      {stats && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-amber-500/10 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              Comparative Telemetry Insights
            </div>
            <p className="text-xs text-muted-foreground">
              Air quality at <strong className="text-foreground">{stats.cleanest.stationName.split(',')[0]}</strong> is{' '}
              <span className="text-emerald-700 font-bold">{stats.pct}% cleaner</span> than at{' '}
              <strong className="text-foreground">{stats.worst.stationName.split(',')[0]}</strong> (AQI difference of{' '}
              <strong>{stats.diff} points</strong>).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              Cleanest: {stats.cleanest.aqi?.value} ({stats.cleanest.aqi?.category})
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              Highest: {stats.worst.aqi?.value} ({stats.worst.aqi?.category})
            </div>
          </div>
        </div>
      )}

      {/* Minimum Selection Guidance */}
      {compareLocationIds.length < 2 && (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <GitCompare className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-foreground">Select at least 2 locations to compare</div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Click any of the nearby regional stations or major metro benchmark chips above to launch the comparative breakdown.
            </p>
          </div>
          {nearbyStations.length > 0 && (
            <Button size="sm" onClick={handleCompareNearby} className="mt-1 shadow-xs">
              <Compass className="w-3.5 h-3.5 mr-1.5" />
              Add Closest Stations Automatically
            </Button>
          )}
        </div>
      )}

      {/* Loading Widget */}
      {compareLoading && compareLocationIds.length >= 2 && (
        <AirLoadingWidget
          variant="card"
          title="Analyzing Cross-Station Atmospheric Telemetry"
          subtitle="Harmonizing multi-station CPCB criteria pollutant sub-indices..."
        />
      )}

      {/* Comparison Cards Grid */}
      {!compareLoading && comparisons.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {comparisons.map((comp, idx) => {
            const aqiVal = comp.aqi?.value;
            const aqiCat = (comp.aqi?.category || 'Unknown') as AQICategory;
            const isBaseline = comp.locationId === baselineId;

            // Delta relative to first comparison item
            const baselineVal = comparisons[0]?.aqi?.value;
            const delta =
              idx > 0 && aqiVal !== null && baselineVal !== null && aqiVal !== undefined && baselineVal !== undefined
                ? aqiVal - baselineVal
                : null;

            return (
              <Card
                key={comp.locationId}
                className={`relative border-border overflow-hidden transition-all hover:shadow-md ${
                  isBaseline ? 'ring-2 ring-primary/40 bg-gradient-to-b from-primary/[0.03] to-card' : ''
                }`}
              >
                {/* Baseline Tag */}
                {isBaseline && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-xs">
                    Your Baseline
                  </div>
                )}

                <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
                  <div className="pr-16">
                    <CardTitle className="text-sm font-bold text-foreground leading-snug line-clamp-1">
                      {comp.stationName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {comp.locality || comp.country?.name || 'CPCB Ground Station'}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Gauge & Delta Badge */}
                  <div className="flex flex-col items-center justify-center pt-1">
                    <AQIGauge aqi={aqiVal ?? null} category={aqiCat} size="sm" />

                    {delta !== null && (
                      <div
                        className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          delta > 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : delta < 0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {delta > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-rose-600" />
                            <span>+{delta} pts higher than baseline</span>
                          </>
                        ) : delta < 0 ? (
                          <>
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                            <span>{Math.abs(delta)} pts cleaner than baseline</span>
                          </>
                        ) : (
                          <span>Identical to baseline</span>
                        )}
                      </div>
                    )}
                  </div>

                  {comp.aqi && !comp.aqi.isValid && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg text-center">
                      {comp.aqi.invalidReason || 'Insufficient parameters for official index'}
                    </div>
                  )}

                  {/* Pollutant Breakdown with Comparative Bars */}
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Criteria Pollutants
                    </div>
                    {Object.entries(comp.pollutants ?? {}).map(([key, reading]) => {
                      const display = POLLUTANT_DISPLAY[key];
                      if (!display) return null;
                      const r = reading as { value: number; unit: string };
                      return (
                        <div key={key} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{display.label}</span>
                            <span className="font-semibold text-foreground">
                              {r.value.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">{display.unit}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Remove Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => removeCompareLocation(comp.locationId)}
                      className="w-full py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove from comparison
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!compareLoading && comparisons.length >= 2 && (
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
          <strong>Data Integrity Note:</strong> All values represent physical telemetry recorded by CPCB and State Pollution Control Board monitors. No cross-station synthetic averaging or hypothetical values are introduced. Each station’s index is computed strictly per statutory CPCB criteria sub-index standards.
        </div>
      )}
    </div>
  );
}
