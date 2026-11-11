import React, { useState, useMemo } from 'react';
import {
  Trophy,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Filter,
  Globe2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AirLoadingWidget } from '../components/AirLoadingWidget';
import { getAQIColorHex } from '../utils';
import type { AQICategory } from '../types';

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  JP: '🇯🇵',
  AU: '🇦🇺',
  AE: '🇦🇪',
  SG: '🇸🇬',
  TH: '🇹🇭',
  CA: '🇨🇦',
  BR: '🇧🇷',
  MX: '🇲🇽',
  ZA: '🇿🇦',
  KR: '🇰🇷',
  CL: '🇨🇱',
};

export function LeaderboardPage() {
  const [scope, setScope] = useState<'india' | 'global'>('india');
  const [activeTab, setActiveTab] = useState<'cleanest' | 'polluted'>('cleanest');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Query India (country: 'IN') or Global International (country: 'GLOBAL_ONLY')
  const { data, isLoading } = useLocations({
    limit: 1000,
    country: scope === 'india' ? 'IN' : 'GLOBAL_ONLY',
  });

  const { setSelectedLocation } = useAppStore();
  const navigate = useNavigate();

  const rawStations = data?.data ?? [];

  // Filter stations that have valid latestAqi
  const validStations = useMemo(() => {
    return rawStations
      .filter((loc) => loc.latestAqi && loc.latestAqi.value !== undefined && loc.latestAqi.value !== null)
      .map((loc) => ({
        ...loc,
        aqiVal: loc.latestAqi!.value,
        aqiCat: loc.latestAqi!.category as AQICategory,
        dominant: loc.latestAqi!.dominantPollutant,
      }));
  }, [rawStations]);

  // Apply regional filter
  const regionalStations = useMemo(() => {
    if (selectedRegion === 'all') return validStations;

    if (scope === 'india') {
      if (selectedRegion === 'gangetic') {
        return validStations.filter((s) =>
          [
            'Prayagraj',
            'Lucknow',
            'Varanasi',
            'Kanpur',
            'Patna',
            'Delhi',
            'Agra',
            'Amritsar',
            'Noida',
            'Ghaziabad',
            'Meerut',
          ].some((city) => s.name.includes(city) || (s.locality && s.locality.includes(city)))
        );
      }

      if (selectedRegion === 'south') {
        return validStations.filter((s) =>
          [
            'Bengaluru',
            'Chennai',
            'Hyderabad',
            'Thiruvananthapuram',
            'Kochi',
            'Coimbatore',
            'Belagavi',
            'Hubballi',
            'Mangaluru',
            'Vijayawada',
          ].some((city) => s.name.includes(city) || (s.locality && s.locality.includes(city)))
        );
      }

      if (selectedRegion === 'west') {
        return validStations.filter((s) =>
          [
            'Mumbai',
            'Pune',
            'Ahmedabad',
            'Jaipur',
            'Surat',
            'Nagpur',
            'Kolhapur',
            'Nashik',
            'Jodhpur',
            'Kota',
          ].some((city) => s.name.includes(city) || (s.locality && s.locality.includes(city)))
        );
      }
    } else {
      // Global region filters
      if (selectedRegion === 'north_america') {
        return validStations.filter((s) => ['US', 'CA', 'MX'].includes(s.country?.code));
      }
      if (selectedRegion === 'europe') {
        return validStations.filter((s) => ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(s.country?.code));
      }
      if (selectedRegion === 'asia_pacific') {
        return validStations.filter((s) => ['JP', 'AU', 'SG', 'TH', 'KR'].includes(s.country?.code));
      }
      if (selectedRegion === 'middle_east_africa') {
        return validStations.filter((s) => ['AE', 'ZA', 'GH', 'KW', 'QA'].includes(s.country?.code));
      }
    }

    return validStations;
  }, [validStations, selectedRegion, scope]);

  const cleanestStations = useMemo(() => {
    return [...regionalStations].sort((a, b) => a.aqiVal - b.aqiVal).slice(0, 10);
  }, [regionalStations]);

  const mostPollutedStations = useMemo(() => {
    return [...regionalStations].sort((a, b) => b.aqiVal - a.aqiVal).slice(0, 10);
  }, [regionalStations]);

  const displayList = activeTab === 'cleanest' ? cleanestStations : mostPollutedStations;

  const handleSelectStation = (id: number) => {
    setSelectedLocation(id);
    navigate('/');
  };

  const handleScopeChange = (newScope: 'india' | 'global') => {
    setScope(newScope);
    setSelectedRegion('all');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* High-Level Scope Switcher (India vs Global) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold">
              {scope === 'india' ? 'National Air Quality Leaderboard' : 'Global Air Quality Leaderboard'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {scope === 'india'
              ? 'Real-time statutory CPCB rankings of India’s cleanest air zones and severe pollution hotspots'
              : 'Real-time international air quality comparison across major world capitals and mega-cities'}
          </p>
        </div>

        {/* Scope Pill Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl border border-border shrink-0 shadow-2xs">
          <button
            onClick={() => handleScopeChange('india')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'india'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🇮🇳</span>
            <span>India (CPCB)</span>
          </button>
          <button
            onClick={() => handleScopeChange('global')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'global'
                ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Rest of the World</span>
          </button>
        </div>
      </div>

      {/* Sub-Region Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Region Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {scope === 'india' ? (
            <>
              {[
                { id: 'all', label: 'All India' },
                { id: 'gangetic', label: 'Indo-Gangetic Belt' },
                { id: 'south', label: 'Southern India' },
                { id: 'west', label: 'Western India' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRegion === r.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { id: 'all', label: 'All Continents' },
                { id: 'north_america', label: 'North America (US/CA)' },
                { id: 'europe', label: 'Europe (UK/DE/FR)' },
                { id: 'asia_pacific', label: 'Asia-Pacific (JP/AU/SG)' },
                { id: 'middle_east_africa', label: 'Middle East & Africa' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRegion === r.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Cleanest vs Polluted Category Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('cleanest')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-colors ${
            activeTab === 'cleanest'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{scope === 'india' ? 'Top 10 Cleanest Indian Air Zones' : 'Top Cleanest World Stations'}</span>
        </button>
        <button
          onClick={() => setActiveTab('polluted')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-colors ${
            activeTab === 'polluted'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{scope === 'india' ? 'Top 10 Severe Indian Hotspots' : 'Highest Global Pollution Hotspots'}</span>
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {isLoading && (
          <AirLoadingWidget
            variant="card"
            title={scope === 'india' ? 'Ranking Indian Monitoring Stations' : 'Indexing Global World Telemetry'}
            subtitle="Harmonizing real-time ground observations into statutory rankings..."
          />
        )}

        {!isLoading && displayList.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border space-y-2">
            <Globe2 className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No active telemetry found for this filter</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {scope === 'india'
                ? 'Try selecting "All India" to view monitors nationwide.'
                : 'Select "All Continents" to explore the worldwide international network.'}
            </p>
          </div>
        )}

        {!isLoading &&
          displayList.map((station, index) => {
            const color = getAQIColorHex(station.aqiCat);
            const isCleanTab = activeTab === 'cleanest';
            const flag = COUNTRY_FLAGS[station.country?.code] || '🌐';

            return (
              <Card
                key={station.openaqId}
                className="transition-all hover:shadow-md hover:border-primary/40 overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1">
                    {/* Rank Badge with Medal accents */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                        index === 0
                          ? isCleanTab
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                          : index === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base" title={station.country?.name || 'Country'}>
                          {flag}
                        </span>
                        <h3 className="font-bold text-base text-foreground leading-tight">
                          {station.name}
                        </h3>
                        {index === 0 && (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isCleanTab
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {scope === 'india'
                              ? isCleanTab
                                ? 'National Clean Leader'
                                : 'Highest National AQI'
                              : isCleanTab
                              ? 'Global Clean Leader'
                              : 'Highest Global AQI'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {[station.locality, station.country?.name].filter(Boolean).join(', ')}
                        </span>
                        <span>•</span>
                        <span>{station.provider?.name || 'CPCB / Official Monitor'}</span>
                        {station.dominant && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              Dominant: <strong className="uppercase">{station.dominant}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AQI Score & Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono tracking-tight" style={{ color }}>
                        {station.aqiVal}
                      </div>
                      <div
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white inline-block shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {station.aqiCat}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSelectStation(station.openaqId)}
                      className="group shadow-xs"
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

      {/* Official Footnote */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Regulatory Data Integrity Notice:
        </p>
        <p>
          Rankings are calculated dynamically from authentic physical ground monitoring stations indexed via OpenAQ and calibrated under the statutory 24-hour mathematical framework. National and International data streams are independently segmented to prevent regional skew.
        </p>
      </div>
    </div>
  );
}
