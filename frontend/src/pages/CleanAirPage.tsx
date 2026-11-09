import { useState } from 'react';
import { Sparkles, MapPin, Navigation, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAQIColorHex, formatDateTime } from '../utils';
import type { AQICategory } from '../types';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function CleanAirPage() {
  const { data, isLoading } = useLocations({ limit: 100, country: 'IN' });
  const { setSelectedLocation } = useAppStore();
  const navigate = useNavigate();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoError('Location permission denied or unavailable. Showing national rankings.');
        setGeoLoading(false);
      }
    );
  };

  const locations = data?.data ?? [];

  // Filter stations that have valid latestAqi
  const validStations = locations
    .filter((loc) => loc.latestAqi && loc.latestAqi.value !== undefined)
    .map((loc) => {
      const distance = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, loc.coordinates.latitude, loc.coordinates.longitude)
        : null;
      return {
        ...loc,
        distance,
        aqiVal: loc.latestAqi!.value,
        aqiCat: loc.latestAqi!.category as AQICategory,
      };
    });

  // Sort by cleanest AQI ascending
  const cleanStations = [...validStations].sort((a, b) => a.aqiVal - b.aqiVal);

  const handleSelectStation = (id: number) => {
    setSelectedLocation(id);
    navigate('/');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Clean Air Finder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identify monitoring stations with relatively lower pollution and cleaner air.
          </p>
        </div>

        <Button onClick={handleGetLocation} variant="outline" size="sm" disabled={geoLoading}>
          <Navigation className={`w-4 h-4 mr-1.5 ${geoLoading ? 'animate-spin' : ''}`} />
          {userCoords ? 'Update My GPS' : 'Rank by Distance from Me'}
        </Button>
      </div>

      {geoError && (
        <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg">
          {geoError}
        </div>
      )}

      {userCoords && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Showing distances relative to your current GPS coordinates ({userCoords.lat.toFixed(3)}°N, {userCoords.lng.toFixed(3)}°E).</span>
        </div>
      )}

      {/* Cleanest Stations List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && cleanStations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No valid station data available at this moment.
          </div>
        )}

        {!isLoading &&
          cleanStations.map((station, index) => {
            const color = getAQIColorHex(station.aqiCat);
            const isTopClean = index < 3 && station.aqiVal <= 100;

            return (
              <Card
                key={station.openaqId}
                className={`transition-all hover:shadow-md ${
                  isTopClean ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        #{index + 1}
                      </span>
                      <h3 className="font-semibold text-base">{station.name}</h3>
                      {isTopClean && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Clean Air Zone
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {station.locality ? `${station.locality}, ${station.country.name}` : station.country.name}
                      </span>
                      {station.distance !== null && (
                        <span className="font-medium text-foreground">
                          · {station.distance} km away
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Synced {formatDateTime(station.lastSyncedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold" style={{ color }}>
                        {station.aqiVal}
                      </div>
                      <div
                        className="text-xs font-semibold px-2 py-0.5 rounded text-white inline-block"
                        style={{ backgroundColor: color }}
                      >
                        {station.aqiCat}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSelectStation(station.openaqId)}
                      className="group"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Important Transparency Notice:</p>
        <p>
          Rankings are based strictly on measurements recorded at registered physical monitoring stations. 
          A low AQI reading at a station represents air quality at that specific sensor location and does not guarantee that your immediate local microclimate has identical air quality.
        </p>
      </div>
    </div>
  );
}

