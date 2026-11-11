import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Globe, X, Building2 } from 'lucide-react';
import { citiesApi } from '../api/endpoints';

export interface SelectedCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country: string;
  district?: string;
}

interface CitySearchProps {
  onSelectCity: (city: SelectedCity) => void;
  placeholder?: string;
  className?: string;
  scope?: 'india' | 'global';
}

export function CitySearch({
  onSelectCity,
  placeholder,
  className = '',
  scope = 'india',
}: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const defaultPlaceholder =
    scope === 'global'
      ? 'Search global city (e.g. London, Tokyo, New York, Paris)...'
      : 'Search Indian city (e.g. Prayagraj, Lucknow, Varanasi)...';

  const effectivePlaceholder = placeholder || defaultPlaceholder;

  const loadingText =
    scope === 'global'
      ? 'Searching global cities worldwide...'
      : 'Searching cities across India...';

  const emptyText =
    scope === 'global'
      ? `No matching global cities found for "${query}"`
      : `No matching Indian cities found for "${query}"`;

  // Reset search when scope changes between India and World
  useEffect(() => {
    setQuery('');
    setResults([]);
    setOpen(false);
  }, [scope]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const countryCode = scope === 'global' ? '' : 'IN';
      const res = await citiesApi.search(q, countryCode);
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(val), 250);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelect(results[0]);
      } else if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const countryCode = scope === 'global' ? '' : 'IN';
          const res = await citiesApi.search(query.trim(), countryCode);
          if (res.data && res.data.length > 0) {
            handleSelect(res.data[0]);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSelect = (city: SelectedCity) => {
    setQuery(`${city.name}${city.state ? `, ${city.state}` : ''}`);
    setOpen(false);
    setResults([]);
    onSelectCity(city);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={effectivePlaceholder}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-card/95 backdrop-blur-xs text-sm shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-all"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-[1100] mt-1.5 w-full rounded-xl border border-border bg-card shadow-xl max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {loadingText}
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {emptyText}
            </div>
          )}
          {results.map((city) => (
            <button
              key={`${city.id}-${city.latitude}`}
              onClick={() => handleSelect(city)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted text-left transition-colors border-b border-border/50 last:border-b-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {scope === 'global' ? (
                    <Globe className="w-4 h-4 text-primary" />
                  ) : (
                    <Building2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{city.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[city.district, city.state, city.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                {Math.abs(city.latitude).toFixed(2)}°{city.latitude >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(city.longitude).toFixed(2)}°{city.longitude >= 0 ? 'E' : 'W'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

