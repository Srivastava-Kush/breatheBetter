import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { locationsApi } from '../api/endpoints';
import { useAppStore } from '../stores/appStore';
import type { Location } from '../types';

interface LocationSearchProps {
  onSelect?: (location: Location) => void;
  placeholder?: string;
}

export function LocationSearch({ onSelect, placeholder = 'Search city or station...' }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const addRecent = useAppStore((s) => s.addRecentLocation);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await locationsApi.search(q);
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
    timeoutRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (loc: Location) => {
    setQuery(loc.name);
    setOpen(false);
    setResults([]);
    addRecent(loc);
    onSelect?.(loc);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-9 rounded-lg border border-border bg-background text-sm
                     focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-72 overflow-y-auto">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center">No results found</div>
          )}
          {results.map((loc) => (
            <button
              key={loc.openaqId}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">{loc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[loc.locality, loc.country?.name].filter(Boolean).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

