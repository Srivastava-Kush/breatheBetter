import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { getAQIColorHex } from '../utils';
import type { Location, AQICategory } from '../types';
import { MapPin, Navigation, Layers, Clock, Info } from 'lucide-react';

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];

const getMarkerColor = (category: string | null | undefined): string => {
  if (!category) return '#9ca3af';
  return getAQIColorHex(category as AQICategory);
};

function LocateMe() {
  const map = useMap();
  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 12);
    });
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-24 right-3 z-[1000] p-2 bg-card rounded-lg shadow-md border border-border hover:bg-muted text-foreground transition-colors"
      title="My Location"
    >
      <Navigation className="w-4 h-4 text-primary" />
    </button>
  );
}

function StationMarker({ location, showHalo }: { location: Location; showHalo: boolean }) {
  const aqi = location.latestAqi;
  const color = getMarkerColor(aqi?.category);
  const { setSelectedLocation } = useAppStore();
  const navigate = useNavigate();

  const handleViewStation = () => {
    setSelectedLocation(location.openaqId);
    navigate('/');
  };

  return (
    <>
      {/* Interpolated concentration halo layer */}
      {showHalo && aqi && (
        <Circle
          center={[location.coordinates.latitude, location.coordinates.longitude]}
          radius={45000} // 45km radius
          pathOptions={{
            fillColor: color,
            fillOpacity: 0.15,
            stroke: false,
          }}
        />
      )}

      {/* Primary Station Vector Marker */}
      <CircleMarker
        center={[location.coordinates.latitude, location.coordinates.longitude]}
        radius={aqi ? 10 : 7}
        pathOptions={{
          fillColor: color,
          fillOpacity: 0.9,
          color: '#ffffff',
          weight: 2,
        }}
      >
        <Popup>
          <div className="min-w-[210px] space-y-2 text-sm p-1">
            <div className="font-semibold text-gray-900">{location.name}</div>
            {location.locality && (
              <div className="text-gray-600 text-xs">{location.locality}</div>
            )}

            {aqi ? (
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">BreatheBetter AQI</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: color }}
                  >
                    {aqi.value} · {aqi.category}
                  </span>
                </div>
                {aqi.dominantPollutant && (
                  <div className="text-[11px] text-gray-600 flex justify-between">
                    <span>Dominant:</span>
                    <strong className="uppercase font-semibold text-gray-900">{aqi.dominantPollutant}</strong>
                  </div>
                )}
                <div className="text-[10px] text-gray-400 italic">
                  Calculated using CPCB methodology
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">AQI unavailable — insufficient valid pollutant data</div>
            )}

            <div className="text-[11px] text-gray-400">
              {location.coordinates.latitude.toFixed(4)}°N, {location.coordinates.longitude.toFixed(4)}°E
            </div>

            <button
              onClick={handleViewStation}
              className="w-full mt-2 py-1.5 px-3 rounded text-xs font-medium bg-[#106644] text-white hover:bg-[#0d5337] transition-colors text-center block shadow-xs"
            >
              Open in Live Dashboard →
            </button>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

export function MapPage() {
  const { data, isLoading } = useLocations({ limit: 500, country: 'IN' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showHalo, setShowHalo] = useState(false);
  const locations = data?.data ?? [];

  const filteredLocations = selectedCategory
    ? locations.filter((l) => l.latestAqi?.category === selectedCategory)
    : locations;

  return (
    <div className="h-full flex flex-col">
      {/* Map header */}
      <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-semibold text-base">Interactive Air Quality Map</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? 'Loading monitoring stations...'
                : `${filteredLocations.length} of ${locations.length} monitoring stations shown`}
            </p>
          </div>
        </div>

        {/* Controls: Halo layer toggle & Category filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowHalo(!showHalo)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              showHalo
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Toggle concentration dispersion visualization derived from station data"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interpolated Density Layer</span>
          </button>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground border-primary font-medium'
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  isSelected
                    ? 'border-transparent text-white font-medium shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                style={isSelected ? { backgroundColor: color } : {}}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <MapContainer
          center={INDIA_CENTER}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredLocations.map((loc) => (
            <StationMarker key={loc.openaqId} location={loc} showHalo={showHalo} />
          ))}

          <LocateMe />
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="p-4 rounded-xl bg-card border border-border shadow-lg text-sm text-foreground flex items-center gap-3">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading monitoring stations...
            </div>
          </div>
        )}

        {/* Halo mode explanation banner */}
        {showHalo && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-11/12 bg-card/95 backdrop-blur-md border border-border p-2.5 rounded-xl shadow-lg flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              <strong>Spatial Interpolation Notice:</strong> Halo visualization reflects estimated dispersion derived from sparse ground stations. It is not an officially certified continuous surface.
            </p>
          </div>
        )}

        {/* Attribution bar */}
        <div className="absolute bottom-2 left-2 z-[1000] text-[11px] text-muted-foreground bg-card/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg shadow-sm">
          Ground data: OpenAQ · CPCB Methodology · Map: OpenStreetMap
        </div>
      </div>
    </div>
  );
}
