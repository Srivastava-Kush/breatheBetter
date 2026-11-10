import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Search, MapPin, X, Building2 } from 'lucide-react';
import { locationsApi, citiesApi } from '../api/endpoints';
import { useAppStore } from '../stores/appStore';
import type { Location } from '../types';

interface LocationSearchProps {
  onSelect?: (location: Location) => void;
  placeholder?: string;
}

interface SearchCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country: string;
}

export function LocationSearch({
  onSelect,
  placeholder = 'Search city or station in real time...',
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Location[]>([]);
  const [cities, setCities] = useState<SearchCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { addRecentLocation, setSelectedLocation } = useAppStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchRealtime = async (q: string) => {
    if (q.trim().length < 2) {
      setStations([]);
      setCities([]);
      return;
    }
    setLoading(true);
    try {
      const [stationRes, cityRes] = await Promise.allSettled([
        locationsApi.search(q),
        citiesApi.search(q),
      ]);

      if (stationRes.status === 'fulfilled' && stationRes.value?.data) {
        setStations(stationRes.value.data.slice(0, 5));
      } else {
        setStations([]);
      }

      if (cityRes.status === 'fulfilled' && cityRes.value?.data) {
        setCities(cityRes.value.data.slice(0, 5));
      } else {
        setCities([]);
      }
    } catch {
      setStations([]);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchRealtime(val), 250);
  };

  const handleSelectStation = (loc: Location) => {
    setQuery(loc.name);
    setOpen(false);
    setStations([]);
    setCities([]);
    setSelectedLocation(loc.openaqId);
    addRecentLocation(loc);
    onSelect?.(loc);
  };

  const handleSelectCity = async (city: SearchCity) => {
    setQuery(`${city.name}${city.state ? `, ${city.state}` : ''}`);
    setOpen(false);
    setStations([]);
    setCities([]);

    try {
      // Find nearest active monitoring station in real time
      const nearbyRes = await locationsApi.nearby(city.latitude, city.longitude, 35);
      if (nearbyRes.data && nearbyRes.data.length > 0) {
        const nearest = nearbyRes.data[0];
        setSelectedLocation(nearest.openaqId);
        addRecentLocation(nearest);
        onSelect?.(nearest);
      }
    } catch (e) {
      console.error('Failed to resolve nearest station for city:', e);
    }
  };

  const clear = () => {
    setQuery('');
    setStations([]);
    setCities([]);
    setOpen(false);
  };

  const hasResults = stations.length > 0 || cities.length > 0;

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-background text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-2xl max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Searching cities and stations live...
            </div>
          )}

          {!loading && !hasResults && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No matching cities or stations found
            </div>
          )}

          {/* Cities Section */}
          {cities.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted/40 border-b border-border/40">
                Cities
              </div>
              {cities.map((city) => (
                <button
                  key={`city-${city.id}-${city.latitude}`}
                  onClick={() => handleSelectCity(city)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-muted/60 text-left transition-colors border-b border-border/30 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{city.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {[city.state, city.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                    Select City
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Stations Section */}
          {stations.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted/40 border-b border-border/40">
                Ground Stations
              </div>
              {stations.map((loc) => (
                <button
                  key={`loc-${loc.openaqId}`}
                  onClick={() => handleSelectStation(loc)}
                  className="w-full flex items-start gap-2.5 p-2.5 hover:bg-muted/60 text-left transition-colors border-b border-border/30 last:border-b-0"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{loc.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {[loc.locality, loc.country?.name].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
