import React, { useState, useMemo } from 'react';
import { Trophy, AlertTriangle, ShieldCheck, MapPin, ArrowRight, ExternalLink, Filter } from 'lucide-react';
import { useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAQIColorHex } from '../utils';
import type { AQICategory } from '../types';

export function LeaderboardPage() {
  const { data, isLoading } = useLocations({ limit: 1000, country: 'IN' });
  const { setSelectedLocation } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'cleanest' | 'polluted'>('cleanest');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

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

    if (selectedRegion === 'gangetic') {
      // UP, Bihar, Delhi, Punjab, Haryana
      return validStations.filter((s) =>
        ['Prayagraj', 'Lucknow', 'Varanasi', 'Kanpur', 'Patna', 'Delhi', 'Agra', 'Amritsar', 'Noida', 'Ghaziabad', 'Meerut'].some(
          (city) => s.name.includes(city) || (s.locality && s.locality.includes(city))
        )
      );
    }

    if (selectedRegion === 'south') {
      // Karnataka, Tamil Nadu, Kerala, Andhra, Telangana
      return validStations.filter((s) =>
        ['Bengaluru', 'Chennai', 'Hyderabad', 'Thiruvananthapuram', 'Kochi', 'Coimbatore', 'Belagavi', 'Hubballi', 'Mangaluru', 'Vijayawada'].some(
          (city) => s.name.includes(city) || (s.locality && s.locality.includes(city))
        )
      );
    }

    if (selectedRegion === 'west') {
      // Maharashtra, Gujarat, Rajasthan
      return validStations.filter((s) =>
        ['Mumbai', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Nagpur', 'Kolhapur', 'Nashik', 'Jodhpur', 'Kota'].some(
          (city) => s.name.includes(city) || (s.locality && s.locality.includes(city))
        )
      );
    }

    return validStations;
  }, [validStations, selectedRegion]);

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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            National Air Quality Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time ranking of India's cleanest air zones and most severe pollution hotspots.
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            {[
              { id: 'all', label: 'All India' },
              { id: 'gangetic', label: 'Indo-Gangetic Belt' },
              { id: 'south', label: 'Southern India' },
              { id: 'west', label: 'Western India' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedRegion === r.id
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
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
          Top 10 Cleanest Air Zones
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
          Top 10 Severe Pollution Hotspots
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && displayList.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            No valid station data available for the selected region.
          </div>
        )}

        {!isLoading &&
          displayList.map((station, index) => {
            const color = getAQIColorHex(station.aqiCat);
            const isCleanTab = activeTab === 'cleanest';

            return (
              <Card
                key={station.openaqId}
                className="transition-all hover:shadow-md hover:border-primary/40"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 flex-1">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        index === 0
                          ? isCleanTab
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                          : index === 1
                          ? 'bg-amber-100 text-amber-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-foreground leading-tight">
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
                            {isCleanTab ? 'National Clean Leader' : 'Highest National AQI'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {station.locality || 'India'}
                        </span>
                        <span>•</span>
                        <span>{station.provider?.name || 'CPCB / SPCB'}</span>
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

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-black" style={{ color }}>
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
                      <span>Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Official Regulatory Note:</p>
        <p>
          Rankings are calculated dynamically from authentic real-time ground observations indexed via OpenAQ and processed under the CPCB 24-hour mathematical framework.
        </p>
      </div>
    </div>
  );
}

