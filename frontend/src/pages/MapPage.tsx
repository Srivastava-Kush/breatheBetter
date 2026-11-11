import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { getAQIColorHex, getAQICategory } from '../utils';
import type { AQICategory, Location } from '../types';
import {
  MapPin,
  Navigation,
  Layers,
  Filter,
  Check,
  SlidersHorizontal,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Clock,
  Sparkles,
  Globe,
} from 'lucide-react';
import { CitySearch, SelectedCity } from '../components/CitySearch';
import { CityAirQualityPanel } from '../components/CityAirQualityPanel';
import { StationMarkersLayer } from '../components/ClusterMapLayer';
import { GlobalClusterMapLayer } from '../components/GlobalClusterMapLayer';
import { HeatmapLayer } from '../components/HeatmapLayer';
import { IndiaBoundaryLayer } from '../components/IndiaBoundaryLayer';

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const INDIA_BOUNDS: L.LatLngBoundsLiteral = [
  [6.0, 68.0],
  [37.5, 97.5],
];

function FloatingMapControls({
  mapContainerRef,
  tileLayerType,
  onToggleTileLayer,
  geoScope = 'india',
}: {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  tileLayerType: 'streets' | 'satellite';
  onToggleTileLayer: () => void;
  geoScope?: 'india' | 'global';
}) {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleReset = () => {
    if (geoScope === 'global') {
      map.flyTo([25.0, 15.0], 2.5, { duration: 1.2 });
    } else {
      map.flyTo(INDIA_CENTER, 5, { duration: 1.2 });
    }
  };
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.5 });
      },
      () => {
        setIsLocating(false);
      }
    );
  };
  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-center gap-2 select-none">
      {/* Zoom In & Out */}
      <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-border/80 bg-card/95 backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="p-2.5 hover:bg-muted text-foreground transition-colors border-b border-border/60"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 hover:bg-muted text-foreground transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Locate Me GPS */}
      <button
        onClick={handleLocate}
        disabled={isLocating}
        className={`p-2.5 rounded-xl shadow-lg border border-border/80 bg-card/95 backdrop-blur-md hover:bg-muted text-foreground transition-all hover:scale-105 ${
          isLocating ? 'animate-pulse text-primary' : ''
        }`}
        title="Find My Location (GPS)"
      >
        <Navigation className={`w-4 h-4 ${isLocating ? 'text-primary' : 'text-foreground'}`} />
      </button>

      {/* Reset Overview */}
      <button
        onClick={handleReset}
        className="p-2.5 rounded-xl shadow-lg border border-border/80 bg-card/95 backdrop-blur-md hover:bg-muted text-foreground transition-all hover:scale-105"
        title={geoScope === 'global' ? 'Reset to Global Overview' : 'Reset to Pan-India Overview'}
      >
        <RotateCcw className="w-4 h-4 text-foreground" />
      </button>

      {/* Satellite Imagery / Street Map Toggle */}
      <button
        onClick={onToggleTileLayer}
        className={`p-2.5 rounded-xl shadow-lg border border-border/80 bg-card/95 backdrop-blur-md hover:bg-muted transition-all hover:scale-105 ${
          tileLayerType === 'satellite' ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-foreground'
        }`}
        title={tileLayerType === 'satellite' ? 'Switch to Street Map' : 'Switch to Satellite Imagery'}
      >
        <Layers className="w-4 h-4" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={handleToggleFullscreen}
        className="p-2.5 rounded-xl shadow-lg border border-border/80 bg-card/95 backdrop-blur-md hover:bg-muted text-foreground transition-all hover:scale-105"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MapViewportHandler({
  targets,
  isPanelOpen = false,
}: {
  targets: Array<[number, number]> | null;
  isPanelOpen?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!targets || targets.length === 0) return;

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    if (targets.length === 1) {
      const currentZoom = map.getZoom();
      // Smoothly center on station without restricting user's zoom level
      const targetZoom = currentZoom >= 11 ? currentZoom : 12;

      // When the city panel is open on desktop, offset camera to center station in unobstructed visible canvas
      const panelOffsetPx = isPanelOpen && isDesktop ? 220 : 0;

      if (panelOffsetPx > 0) {
        const targetPoint = map.project(targets[0], targetZoom);
        const shiftedPoint = new L.Point(targetPoint.x + panelOffsetPx, targetPoint.y);
        const shiftedLatLng = map.unproject(shiftedPoint, targetZoom);
        map.flyTo(shiftedLatLng, targetZoom, { duration: 0.9 });
      } else {
        map.flyTo(targets[0], targetZoom, { duration: 0.9 });
      }
    } else {
      const bounds = L.latLngBounds(targets.map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [isPanelOpen && isDesktop ? 460 : 50, 50],
        maxZoom: 13,
        animate: true,
      });
    }
  }, [targets, isPanelOpen, map]);

  return null;
}

function MapScopeController({ scope }: { scope: 'india' | 'global' }) {
  const map = useMap();
  const prevScopeRef = useRef(scope);

  useEffect(() => {
    if (prevScopeRef.current === scope) return;
    prevScopeRef.current = scope;

    if (scope === 'india') {
      map.setMaxBounds(L.latLngBounds(INDIA_BOUNDS));
      map.setMinZoom(4.5);
      map.flyTo(INDIA_CENTER, 5.0, { duration: 1.2 });
    } else {
      map.setMaxBounds(null as any);
      map.setMinZoom(2.0);
      map.flyTo([25.0, 15.0], 2.5, { duration: 1.4 });
    }
  }, [scope, map]);

  return null;
}

export function MapPage() {
  const navigate = useNavigate();
  const { setSelectedLocation } = useAppStore();

  // Geographic Scope: 'india' (default, individual pins, locked bounds) vs 'global' (clustered worldwide)
  const [geoScope, setGeoScope] = useState<'india' | 'global'>('india');

  // Load all stations across India or Globally based on active scope
  const { data, isLoading } = useLocations({
    limit: 1000,
    country: geoScope === 'india' ? 'IN' : 'global',
  });
  const rawLocations = data?.data ?? [];

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'reference' | 'sensors'>('all');
  const [aqiFilter, setAqiFilter] = useState<'all' | 'valid' | 'unavailable'>('valid');
  const [showHalo, setShowHalo] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [highlightIndia, setHighlightIndia] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Selected City & Viewport target
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [focusedStationId, setFocusedStationId] = useState<number | null>(null);
  const [viewportTargets, setViewportTargets] = useState<Array<[number, number]> | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite'>('streets');

  // Dynamically discovered stations from city searches
  const [searchedStations, setSearchedStations] = useState<Location[]>([]);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(25);

  const handleCityStationsLoaded = useCallback((newStations: any[], radiusKm: number) => {
    setSearchRadiusKm(radiusKm);
    if (!newStations || newStations.length === 0) return;

    setSearchedStations((prev) => {
      const existingIds = new Set(prev.map((p) => p.openaqId));
      const additions: Location[] = [];

      newStations.forEach((s: any) => {
        const id = s.id || s.openaqId;
        if (!id || existingIds.has(id)) return;
        existingIds.add(id);

        additions.push({
          openaqId: id,
          name: s.name,
          locality: s.locality || null,
          timezone: 'UTC',
          country: {
            code: s.country?.code || (selectedCity?.country === 'India' ? 'IN' : 'INTL'),
            name: s.country?.name || selectedCity?.country || 'Unknown',
          },
          owner: null,
          provider: s.provider ? { id: 0, name: s.provider } : null,
          isMobile: false,
          isMonitor: s.isMonitor ?? true,
          coordinates: {
            latitude: s.coordinates.latitude,
            longitude: s.coordinates.longitude,
          },
          sensors: s.sensors || [],
          lastSyncedAt: s.dataFreshness || new Date().toISOString(),
          latestAqi: s.isValidAqi && s.aqi !== null
            ? {
                value: s.aqi,
                category: s.aqiCategory,
                dominantPollutant: s.dominantPollutant,
              }
            : undefined,
        });
      });

      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [selectedCity]);

  // Combine baseline locations with newly searched stations
  const combinedLocations = useMemo(() => {
    if (searchedStations.length === 0) return rawLocations;
    const existing = new Set(rawLocations.map((l) => l.openaqId));
    const newItems = searchedStations.filter((s) => !existing.has(s.openaqId));
    return [...rawLocations, ...newItems];
  }, [rawLocations, searchedStations]);

  // Apply filters
  const filteredLocations = combinedLocations.filter((loc) => {
    // 1. AQI Category filter
    if (selectedCategory && loc.latestAqi?.category !== selectedCategory) {
      return false;
    }

    // 2. Monitor type filter
    if (monitorFilter === 'reference' && !loc.isMonitor) return false;
    if (monitorFilter === 'sensors' && loc.isMonitor) return false;

    // 3. AQI validity filter
    if (aqiFilter === 'valid' && !loc.latestAqi) return false;
    if (aqiFilter === 'unavailable' && loc.latestAqi) return false;

    return true;
  });

  // Forecast Time Horizon Slider (0 = Live, 3, 6, 12, 18, 24 hours into future)
  const [timeHorizon, setTimeHorizon] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeHorizon((prev) => {
        const steps = [0, 3, 6, 12, 18, 24];
        const nextIdx = (steps.indexOf(prev) + 1) % steps.length;
        return steps[nextIdx];
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Project locations based on timeHorizon
  const displayedLocations = useMemo(() => {
    if (timeHorizon === 0) return filteredLocations;

    return filteredLocations.map((loc) => {
      if (!loc.latestAqi || !loc.latestAqi.value) return loc;

      const baseAqi = loc.latestAqi.value;
      const now = new Date();
      const futureHour = (now.getHours() + timeHorizon) % 24;

      let diurnalFactor = 1.0;
      if (futureHour >= 7 && futureHour <= 10) {
        diurnalFactor = 1.20; // Morning traffic surge
      } else if (futureHour >= 12 && futureHour <= 16) {
        diurnalFactor = 0.74; // Solar boundary layer dispersion
      } else if (futureHour >= 18 && futureHour <= 21) {
        diurnalFactor = 1.26; // Evening peak emissions
      } else if (futureHour >= 23 || futureHour <= 5) {
        diurnalFactor = 1.16; // Nighttime thermal inversion
      } else {
        diurnalFactor = 0.94;
      }

      // Indo-Gangetic regional modifier
      if (
        loc.coordinates.latitude > 24.0 &&
        loc.coordinates.latitude < 30.0 &&
        (futureHour >= 21 || futureHour <= 8)
      ) {
        diurnalFactor *= 1.10;
      }

      const projectedValue = Math.round(Math.max(15, Math.min(500, baseAqi * diurnalFactor)));
      const projectedCategory = getAQICategory(projectedValue);

      return {
        ...loc,
        latestAqi: {
          ...loc.latestAqi,
          value: projectedValue,
          category: projectedCategory,
          isProjected: true,
          hourOffset: timeHorizon,
        },
      };
    });
  }, [filteredLocations, timeHorizon]);

  const handleCitySelect = (city: SelectedCity) => {
    // If selecting an international city, automatically unlock sovereign bounds and switch to global scope
    const isInternational =
      city.country !== 'India' &&
      city.country !== 'IN' &&
      (city.latitude < 6.5 || city.latitude > 37.5 || city.longitude < 68.0 || city.longitude > 97.5);

    if (isInternational && geoScope === 'india') {
      setGeoScope('global');
      setHighlightIndia(false);
    }

    setSelectedCity(city);
    setFocusedStationId(null);
    setViewportTargets([[city.latitude, city.longitude]]);
  };

  const handleAutoPan = (coords: Array<[number, number]>) => {
    if (coords && coords.length > 0) {
      setViewportTargets(coords);
    }
  };

  const handleFocusStation = (stationId: number, lat: number, lng: number) => {
    setFocusedStationId(stationId);
    setViewportTargets([[lat, lng]]);
  };

  const handleSelectStation = (stationId: number) => {
    setSelectedLocation(stationId);
    navigate('/analytics');
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      {/* Top Filter & Search Header */}
      <div className="p-3.5 border-b border-border bg-card/95 backdrop-blur-md z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-tight">Explore Air Quality Map</h1>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? (geoScope === 'global' ? 'Loading worldwide monitoring network...' : 'Loading monitoring network across India...')
                  : `${filteredLocations.length} stations ${aqiFilter === 'valid' ? 'reporting live AQI' : 'visible'} ${geoScope === 'india' ? 'across India' : 'worldwide'}`}
              </p>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="md:hidden p-2 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* City Search Bar (Integrated) */}
        <div className="w-full md:max-w-md">
          <CitySearch onSelectCity={handleCitySelect} scope={geoScope} />
        </div>

        {/* Desktop Quick Category Filters */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {[
            { label: 'Good', color: '#009966' },
            { label: 'Satisfactory', color: '#55aa00' },
            { label: 'Moderate', color: '#ffde33' },
            { label: 'Poor', color: '#ff7e00' },
            { label: 'Very Poor', color: '#cc0033' },
            { label: 'Severe', color: '#7e0023' },
          ].map(({ label, color }) => {
            const isSelected = selectedCategory === label;
            return (
              <button
                key={label}
                onClick={() => setSelectedCategory(isSelected ? null : label)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${
                  isSelected
                    ? 'border-transparent text-white font-bold shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                style={isSelected ? { backgroundColor: color } : {}}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Controls Bar (Station Type, AQI Status, Halo) */}
      <div className="px-4 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        {/* Geographic Scope Toggle: 🇮🇳 India Focus (Default) vs 🌍 Global Air */}
        <div className="flex items-center gap-1 bg-card p-0.5 rounded-xl border border-border shadow-2xs shrink-0">
          <button
            onClick={() => {
              setGeoScope('india');
              setHighlightIndia(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              geoScope === 'india'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="India Focus: Sovereign Bounds Locked, Individual High-Res Pins (Default)"
          >
            <span>🇮🇳 India (Individual)</span>
          </button>
          <button
            onClick={() => {
              setGeoScope('global');
              setHighlightIndia(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              geoScope === 'global'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Global Air: Worldwide Scope, Clustered Regulatory Stations"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌍 World (Clustered)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Type:
          </span>
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
            {(
              [
                { id: 'all', label: 'All Stations' },
                { id: 'reference', label: 'Reference Monitors' },
                { id: 'sensors', label: 'Sensors Only' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setMonitorFilter(t.id)}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  monitorFilter === t.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-medium">Status:</span>
            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'valid', label: 'Valid AQI' },
                  { id: 'unavailable', label: 'Incomplete' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAqiFilter(s.id)}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    aqiFilter === s.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowHalo(!showHalo)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border transition-colors ${
              showHalo
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'border-border text-muted-foreground hover:text-foreground bg-background/80'
            }`}
            title="Toggle concentration dispersion halos"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Density Halos</span>
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border transition-colors ${
              showHeatmap
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-bold'
                : 'border-border text-muted-foreground hover:text-foreground bg-background/80'
            }`}
            title="Toggle Continuous Regional Pollution Heatmap"
          >
            <span>🔥 Pollution Heatmap</span>
          </button>

          <button
            onClick={() => setHighlightIndia(!highlightIndia)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border transition-colors ${
              highlightIndia
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                : 'border-border text-muted-foreground hover:text-foreground bg-background/80'
            }`}
            title="Highlight India sovereign boundary and dim outer regions"
          >
            <span>🇮🇳 India Spotlight</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 relative bg-slate-100">
        <MapContainer
          center={INDIA_CENTER}
          zoom={5}
          minZoom={geoScope === 'india' ? 4.5 : 2.0}
          maxZoom={18}
          maxBounds={geoScope === 'india' ? INDIA_BOUNDS : undefined}
          maxBoundsViscosity={geoScope === 'india' ? 0.85 : 0.0}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {/* Dynamic Map Scope & Bounds Controller */}
          <MapScopeController scope={geoScope} />

          {tileLayerType === 'streets' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}

          {/* India Sovereign Boundary & Dimming Mask (active in India scope) */}
          <IndiaBoundaryLayer highlight={highlightIndia && geoScope === 'india'} />

          {/* Continuous Multi-Point Pollution Heatmap Surface */}
          <HeatmapLayer locations={displayedLocations} visible={showHeatmap} />

          {/* Station Markers Layer: Individual Numeric Pins in India mode; Clustered in Global mode */}
          {geoScope === 'india' ? (
            <StationMarkersLayer
              locations={displayedLocations}
              onSelectStation={handleSelectStation}
              focusedStationId={focusedStationId}
            />
          ) : (
            <GlobalClusterMapLayer
              locations={displayedLocations}
              onSelectStation={handleSelectStation}
              focusedStationId={focusedStationId}
            />
          )}

          {/* Active Searched City Center Focal Pin & Dynamic Radius Ring */}
          {selectedCity && (
            <>
              <Circle
                center={[selectedCity.latitude, selectedCity.longitude]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.07,
                  weight: 2,
                  dashArray: '5, 8',
                }}
              />
              <Marker
                position={[selectedCity.latitude, selectedCity.longitude]}
                icon={L.divIcon({
                  className: 'bb-city-center-marker-container',
                  html: `
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                      <div style="
                        position: absolute;
                        bottom: 22px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #1e40af;
                        color: #ffffff;
                        font-size: 11px;
                        font-weight: 800;
                        padding: 3px 9px;
                        border-radius: 9999px;
                        white-space: nowrap;
                        box-shadow: 0 4px 14px rgba(30, 64, 175, 0.4);
                        border: 1.5px solid #ffffff;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        pointer-events: none;
                        z-index: 40000;
                      ">
                        <span>📍 ${selectedCity.name}</span>
                      </div>
                      <div style="
                        width: 14px;
                        height: 14px;
                        border-radius: 9999px;
                        background: #2563eb;
                        border: 2.5px solid #ffffff;
                        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 4px 10px rgba(0,0,0,0.3);
                      "></div>
                    </div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-sm font-bold text-gray-900">{selectedCity.name}</strong>
                    <div className="text-gray-500">
                      {[selectedCity.district, selectedCity.state, selectedCity.country].filter(Boolean).join(', ')}
                    </div>
                    <div className="mt-1 text-primary font-medium">Search Radius: {searchRadiusKm} km</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Interpolated dispersion halo rings if enabled */}
          {showHalo &&
            displayedLocations.map((loc) => {
              if (!loc.latestAqi) return null;
              const color = getAQIColorHex(loc.latestAqi.category as AQICategory);
              return (
                <Circle
                  key={`halo-${loc.openaqId}`}
                  center={[loc.coordinates.latitude, loc.coordinates.longitude]}
                  radius={85000}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.18,
                    stroke: false,
                  }}
                />
              );
            })}

          {viewportTargets && (
            <MapViewportHandler
              targets={viewportTargets}
              isPanelOpen={!!selectedCity}
            />
          )}

          {/* Floating Geospatial Controls (Zoom, GPS, Reset, Satellite Toggle, Fullscreen) */}
          <FloatingMapControls
            mapContainerRef={mapContainerRef}
            tileLayerType={tileLayerType}
            onToggleTileLayer={() =>
              setTileLayerType(tileLayerType === 'streets' ? 'satellite' : 'streets')
            }
            geoScope={geoScope}
          />
        </MapContainer>

        {/* Floating Predicted AQI Horizon Slider & Radar Control Dock */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1.5 w-auto max-w-[94vw] pointer-events-auto">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                isPlaying
                  ? 'bg-rose-600 text-white shadow-md animate-pulse'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
              }`}
              title={isPlaying ? 'Pause Radar Simulation' : 'Play 24-Hour Predictive Dispersion Radar'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Time Horizon Step Buttons */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
              {[
                { offset: 0, label: 'Live' },
                { offset: 3, label: '+3h' },
                { offset: 6, label: '+6h' },
                { offset: 12, label: '+12h' },
                { offset: 18, label: '+18h' },
                { offset: 24, label: '+24h' },
              ].map((step) => {
                const isActive = timeHorizon === step.offset;
                return (
                  <button
                    key={step.offset}
                    onClick={() => {
                      setIsPlaying(false);
                      setTimeHorizon(step.offset);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? step.offset === 0
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : 'bg-indigo-600 text-white shadow-xs scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>

            {/* Time status feedback */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-background/80 rounded-xl border border-border/60 text-xs text-foreground font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {timeHorizon === 0 ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Ground Stations
                  </span>
                ) : (
                  <span className="text-indigo-900 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    +{timeHorizon}h Diurnal Forecast Simulation
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* City Air Quality Intelligence Drawer */}
        {selectedCity && (
          <CityAirQualityPanel
            city={selectedCity}
            onClose={() => {
              setSelectedCity(null);
              setFocusedStationId(null);
            }}
            onSelectStation={handleSelectStation}
            onAutoPan={handleAutoPan}
            onFocusStation={handleFocusStation}
            focusedStationId={focusedStationId}
            onStationsLoaded={handleCityStationsLoaded}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center z-[1200]">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-2xl text-sm text-foreground flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading India monitoring network & real-time observations...</span>
            </div>
          </div>
        )}

        {/* Map Legend & Methodology footnote */}
        <div className="absolute bottom-3 left-3 z-[1000] text-[11px] text-muted-foreground bg-card/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-md max-w-xs hidden sm:block">
          <div className="font-semibold text-foreground mb-1">CPCB AQI Categories</div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#009966]" /> Good (0-50)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#55aa00]" /> Satisfactory</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffde33]" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff7e00]" /> Poor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#cc0033]" /> Very Poor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7e0023]" /> Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
