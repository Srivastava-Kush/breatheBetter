import { useState, useMemo } from 'react';
import { Sparkles, MapPin, Navigation, ArrowRight, ShieldCheck, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AirLoadingWidget } from '../components/AirLoadingWidget';
import { getAQIColorHex, formatDateTime } from '../utils';
import type { AQICategory, Location } from '../types';

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
  return Math.round(R * c * 10) / 10;
}

export function CleanAirPage() {
  const { data, isLoading } = useLocations({ limit: 1000, country: 'IN' });
  const { selectedLocationId, setSelectedLocation } = useAppStore();
  const navigate = useNavigate();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(50);

  const locations = data?.data ?? [];

  // Default reference to selected station if no GPS
  const currentStation = useMemo(() => {
    if (selectedLocationId) {
      return locations.find((l) => l.openaqId === selectedLocationId) || null;
    }
    return locations[0] || null;
  }, [locations, selectedLocationId]);

  const activeReference = useMemo(() => {
    if (userCoords) {
      return { lat: userCoords.lat, lng: userCoords.lng, label: userCoords.label };
    }
    if (currentStation) {
      return {
        lat: currentStation.coordinates.latitude,
        lng: currentStation.coordinates.longitude,
        label: currentStation.name,
      };
    }
    return null;
  }, [userCoords, currentStation]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current GPS Location',
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Location permission denied. You can select any anchor ground station below.');
        setGeoLoading(false);
      }
    );
  };

  // Process valid stations with distance and AQI
  const stationsWithDistance = useMemo(() => {
    return locations
      .filter((loc) => loc.latestAqi && loc.latestAqi.value !== undefined)
      .map((loc) => {
        const distance = activeReference
          ? calculateDistanceKm(
              activeReference.lat,
              activeReference.lng,
              loc.coordinates.latitude,
              loc.coordinates.longitude
            )
          : null;
        return {
          ...loc,
          distance,
          aqiVal: loc.latestAqi!.value,
          aqiCat: loc.latestAqi!.category as AQICategory,
        };
      });
  }, [locations, activeReference]);

  // Find the closest station to reference point
  const closestStation = useMemo(() => {
    if (!activeReference || stationsWithDistance.length === 0) return null;
    const sortedByDist = [...stationsWithDistance].sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    return sortedByDist[0];
  }, [activeReference, stationsWithDistance]);

  // Stations within the selected radius
  const stationsInRadius = useMemo(() => {
    if (!activeReference) return stationsWithDistance;
    return stationsWithDistance
      .filter((s) => s.distance !== null && s.distance <= radiusKm)
      .sort((a, b) => a.aqiVal - b.aqiVal);
  }, [stationsWithDistance, activeReference, radiusKm]);

  // Better/cleaner stations within radius compared to the closest station
  const cleanerStationsInRadius = useMemo(() => {
    if (!closestStation) return [];
    return stationsInRadius.filter(
      (s) => s.openaqId !== closestStation.openaqId && s.aqiVal < closestStation.aqiVal - 5
    );
  }, [stationsInRadius, closestStation]);

  const handleSelectStation = (id: number) => {
    setSelectedLocation(id);
    navigate('/');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Clean Air Finder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Identify ground monitoring stations with relatively lower pollution and cleaner air.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleGetLocation} variant="outline" size="sm" disabled={geoLoading}>
            <Navigation className={`w-4 h-4 mr-1.5 ${geoLoading ? 'animate-spin' : ''}`} />
            {userCoords ? 'Update My GPS' : 'Use My GPS Location'}
          </Button>
        </div>
      </div>

      {geoError && (
        <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Reference point and radius selector */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>
            Anchor Reference: <strong className="text-foreground">{activeReference?.label || 'All India Network'}</strong>
          </span>
          {closestStation && (
            <span className="text-[11px] text-muted-foreground">
              (Closest ground station: <strong>{closestStation.name}</strong> · AQI <strong>{closestStation.aqiVal}</strong>)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-muted-foreground font-medium">Search Distance:</span>
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/60">
            {[25, 50, 100, 250].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  radiusKm === r
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Descriptive Distance-Based Intelligence Banner */}
      {closestStation && (
        <div>
          {cleanerStationsInRadius.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/60 border border-border/80 text-foreground flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground">
                  No better area within {radiusKm} km
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your closest ground station (<strong className="text-foreground">{closestStation.name}</strong>, AQI <strong className="text-foreground">{closestStation.aqiVal}</strong>) currently has the lowest or equivalent pollution levels in this radius. No significantly cleaner ground stations were detected within {radiusKm} km. Below is the full ranking of monitored areas.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-foreground flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-emerald-800">
                  Found {cleanerStationsInRadius.length} cleaner area{cleanerStationsInRadius.length > 1 ? 's' : ''} within {radiusKm} km
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Air quality improves by up to <strong className="text-foreground">{closestStation.aqiVal - cleanerStationsInRadius[0].aqiVal} points</strong> at{' '}
                  <strong className="text-foreground">{cleanerStationsInRadius[0].name}</strong> ({cleanerStationsInRadius[0].distance} km away, AQI{' '}
                  <strong className="text-foreground">{cleanerStationsInRadius[0].aqiVal}</strong>) compared to your closest station ({closestStation.name}, AQI {closestStation.aqiVal}).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleanest Stations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Ranked Ground Stations ({stationsInRadius.length} in {radiusKm} km)</span>
          <span>Lowest AQI First</span>
        </div>

        {isLoading && (
          <AirLoadingWidget
            variant="card"
            title="Scanning India Clean Air Stations"
            subtitle="Comparing nearby ground monitors to identify optimal clean air zones..."
          />
        )}

        {!isLoading && stationsInRadius.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            No ground stations found within {radiusKm} km. Try expanding the distance radius above.
          </div>
        )}

        {!isLoading &&
          stationsInRadius.map((station, index) => {
            const color = getAQIColorHex(station.aqiCat);
            const isTopClean = index < 3 && station.aqiVal <= 100;
            const aqiImprovement = closestStation ? closestStation.aqiVal - station.aqiVal : null;

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
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Clean Air Zone
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
                      {aqiImprovement !== null && aqiImprovement > 5 && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          ↓ {aqiImprovement} pts cleaner
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
                        className="text-xs font-semibold px-2 py-0.5 rounded text-white inline-block shadow-xs"
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
          Rankings are based strictly on measurements recorded at registered physical ground stations. 
          A low AQI reading at a ground station represents air quality at that specific sensor location and does not guarantee that your immediate local microclimate has identical air quality.
        </p>
      </div>
    </div>
  );
}
