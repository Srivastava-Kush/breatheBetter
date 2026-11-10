import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  Radio,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { useCityAirQuality } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { getAQIColorHex } from '../utils';
import type { AQICategory } from '../types';
import type { SelectedCity } from './CitySearch';

interface CityAirQualityPanelProps {
  city: SelectedCity;
  onClose: () => void;
  onSelectStation?: (stationId: number) => void;
  onAutoPan?: (coords: Array<[number, number]>) => void;
}

export function CityAirQualityPanel({
  city,
  onClose,
  onSelectStation,
  onAutoPan,
}: CityAirQualityPanelProps) {
  const [radius, setRadius] = useState<number>(25);
  const navigate = useNavigate();
  const { setSelectedLocation } = useAppStore();

  const { data: res, isLoading, error } = useCityAirQuality({
    lat: city.latitude,
    lng: city.longitude,
    radius,
    name: city.name,
    state: city.state,
  });

  const cityData = res?.data as any;
  const overview = cityData?.overview;
  const stations = cityData?.stations || [];
  const nearestAlternatives = cityData?.nearestAlternativeStations || [];
  const modelledFallback = cityData?.modelledFallback;

  // Auto-pan map when stations or alternatives are loaded
  useEffect(() => {
    if (stations.length > 0 && onAutoPan) {
      const coords: Array<[number, number]> = stations.map((s: any) => [
        s.coordinates.latitude,
        s.coordinates.longitude,
      ]);
      onAutoPan(coords);
    } else if (stations.length === 0 && nearestAlternatives.length > 0 && onAutoPan) {
      // Pan to the nearest ground stations so users can see the available alternatives
      const altCoords: Array<[number, number]> = nearestAlternatives.slice(0, 3).map((a: any) => [
        a.coordinates.latitude,
        a.coordinates.longitude,
      ]);
      onAutoPan(altCoords);
    }
  }, [stations, nearestAlternatives, onAutoPan]);

  const handleOpenStation = (stationId: number) => {
    setSelectedLocation(stationId);
    if (onSelectStation) {
      onSelectStation(stationId);
    } else {
      navigate('/');
    }
  };

  const handlePanToStation = (lat: number, lng: number) => {
    if (onAutoPan) {
      onAutoPan([[lat, lng]]);
    }
  };

  const isGoa =
    city.name.toLowerCase().includes('goa') ||
    city.name.toLowerCase().includes('panaji') ||
    (city.state && city.state.toLowerCase().includes('goa'));

  const explicitNoStationMessage = isGoa
    ? 'No ground station was found in Goa on the OpenAQ platform as of now.'
    : (cityData?.noStationMessage || `No ground station was found in ${city.state || city.name} on the OpenAQ platform as of now.`);

  return (
    <div className="absolute top-16 right-3 bottom-8 z-[1000] w-full max-w-md bg-card/98 backdrop-blur-md border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground leading-snug">
              {city.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {[city.district, city.state, city.country].filter(Boolean).join(', ')}
            </p>
            <div className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
              {city.latitude.toFixed(4)}°N, {city.longitude.toFixed(4)}°E
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Radius Filter & Quick Stats */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/15 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-primary" />
          Search Radius:
        </span>
        <div className="flex items-center gap-1.5">
          {[10, 25, 50].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                radius === r
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Searching for ground stations...</p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            Failed to load air quality intelligence for this location.
          </div>
        )}

        {!isLoading && overview && (
          <>
            {/* City Overview Card (When ground stations exist) */}
            {stations.length > 0 && (
              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    City Ground Stations Overview
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {overview.totalNearbyStations} ground station{overview.totalNearbyStations !== 1 ? 's' : ''} in {radius}km
                  </span>
                </div>

                {overview.aqiRange ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-xs text-muted-foreground">Ground Station AQI Range</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {overview.aqiRange.min} – {overview.aqiRange.max}
                      </span>
                      <span className="text-[10px] text-muted-foreground">(CPCB Index)</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    Ground stations active, but insufficient criteria parameters to calculate official AQI.
                  </div>
                )}

                {overview.availablePollutants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1 self-center">Sensors:</span>
                    {overview.availablePollutants.map((pol: string) => (
                      <span
                        key={pol}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-primary/10 text-primary border border-primary/20"
                      >
                        {pol}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground/70 flex items-center gap-1 pt-1 border-t border-border/40">
                  <Info className="w-3 h-3 text-primary shrink-0" />
                  <span>
                    Individual ground station readings are reported without synthetic averaging.
                  </span>
                </div>
              </div>
            )}

            {/* List of nearby ground stations */}
            {stations.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Available Ground Stations ({stations.length})</span>
                  <span>Distance</span>
                </div>

                {stations.map((st: any) => {
                  const aqiColor = st.aqiCategory
                    ? getAQIColorHex(st.aqiCategory as AQICategory)
                    : '#9ca3af';

                  return (
                    <div
                      key={st.id}
                      className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-foreground leading-tight">
                            {st.name}
                          </h3>
                          {st.locality && (
                            <p className="text-xs text-muted-foreground">{st.locality}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                              {st.isMonitor ? 'Ground Reference Monitor' : 'Ground Sensor'}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{st.provider}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {st.distanceKm !== null && (
                            <span className="inline-block text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                              {st.distanceKm} km
                            </span>
                          )}
                          {st.aqi !== null ? (
                            <div
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white text-center shadow-xs"
                              style={{ backgroundColor: aqiColor }}
                            >
                              {st.aqi} · {st.aqiCategory}
                            </div>
                          ) : (
                            <div className="px-2 py-1 rounded-lg text-[10px] bg-muted text-muted-foreground font-medium text-center">
                              No AQI
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dominant Pollutant & Freshness */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        {st.dominantPollutant ? (
                          <span className="flex items-center gap-1">
                            Dominant: <strong className="uppercase text-foreground">{st.dominantPollutant}</strong>
                          </span>
                        ) : (
                          <span>{st.sensors?.length || 0} sensors tracked</span>
                        )}

                        <span className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3" />
                          {new Date(st.dataFreshness).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        <button
                          onClick={() => handlePanToStation(st.coordinates.latitude, st.coordinates.longitude)}
                          className="py-1 px-2 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1 transition-colors"
                        >
                          <Compass className="w-3 h-3 text-primary" />
                          Focus on Map
                        </button>
                        <button
                          onClick={() => handleOpenStation(st.id)}
                          className="py-1 px-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors shadow-xs"
                        >
                          Station Analytics
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* When NO ground station exists in searched city radius */}
            {stations.length === 0 && (
              <div className="space-y-3.5">
                {/* Explicit Search Radius Outcome Notice */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-foreground space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Search Radius Notice ({radius} km)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 font-semibold">
                      0 Stations in {radius} km
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground">
                    Looked within {radius} km search radius of {city.name}: No ground monitoring station found in this immediate perimeter.
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {explicitNoStationMessage}
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    Coordinates scanned: <strong>{city.latitude.toFixed(4)}°N, {city.longitude.toFixed(4)}°E</strong>. The map has automatically expanded its radius up to 350 km across the regional network to discover alternative ground stations for you below.
                  </p>

                  {radius < 50 && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => setRadius(50)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        Expand search radius to 50 km
                      </button>
                    </div>
                  )}
                </div>

                {/* Nearest Alternative Ground Stations List */}
                {nearestAlternatives.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        Nearest Available Ground Stations
                      </span>
                      <span>Distance</span>
                    </div>

                    {nearestAlternatives.map((alt: any) => {
                      const aqiColor = alt.aqiCategory
                        ? getAQIColorHex(alt.aqiCategory as AQICategory)
                        : '#9ca3af';

                      return (
                        <div
                          key={`alt-${alt.id}`}
                          className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm text-foreground leading-tight">
                                {alt.name}
                              </h3>
                              {alt.locality && (
                                <p className="text-xs text-muted-foreground">{alt.locality}</p>
                              )}
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Provider: {alt.provider}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {alt.distanceKm !== null && (
                                <span className="inline-block text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                                  {alt.distanceKm} km away
                                </span>
                              )}
                              {alt.aqi !== null ? (
                                <div
                                  className="px-2 py-0.5 rounded text-xs font-bold text-white text-center shadow-xs"
                                  style={{ backgroundColor: aqiColor }}
                                >
                                  AQI {alt.aqi}
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground text-center">
                                  No AQI
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <button
                              onClick={() => handlePanToStation(alt.coordinates.latitude, alt.coordinates.longitude)}
                              className="py-1 px-2 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center gap-1 transition-colors"
                            >
                              <Compass className="w-3 h-3 text-primary" />
                              Pan Map Here
                            </button>
                            <button
                              onClick={() => handleOpenStation(alt.id)}
                              className="py-1 px-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors shadow-xs"
                            >
                              View Station
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modelled Fallback Atmospheric Simulation */}
                {modelledFallback && (
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-foreground space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span>Modelled Atmospheric Chemistry (Local Coordinates)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {modelledFallback.disclaimer}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {modelledFallback.data?.pm2_5 !== null && (
                        <div className="p-2 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground font-semibold">PM2.5 (Modelled)</div>
                          <div className="text-sm font-bold text-foreground">
                            {modelledFallback.data.pm2_5} <span className="text-[10px] font-normal text-muted-foreground">µg/m³</span>
                          </div>
                        </div>
                      )}
                      {modelledFallback.data?.pm10 !== null && (
                        <div className="p-2 rounded-lg bg-card border border-border">
                          <div className="text-[10px] text-muted-foreground font-semibold">PM10 (Modelled)</div>
                          <div className="text-sm font-bold text-foreground">
                            {modelledFallback.data.pm10} <span className="text-[10px] font-normal text-muted-foreground">µg/m³</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
