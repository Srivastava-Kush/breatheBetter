import React, { useState } from 'react';
import { GitCompare, Plus, X, AlertCircle } from 'lucide-react';
import { useCompare, useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AQIGauge } from '../components/AQIGauge';
import { POLLUTANT_DISPLAY } from '../types';
import type { AQICategory } from '../types';

export function ComparePage() {
  const { compareLocationIds, addCompareLocation, removeCompareLocation, clearCompareLocations } = useAppStore();
  const { data: compareData, isLoading, error } = useCompare(compareLocationIds);
  const { data: locationsData } = useLocations({ limit: 100 });

  const comparisons = (compareData?.data as ComparisonItem[]) ?? [];
  const allLocations = locationsData?.data ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            Compare Locations
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare air quality across up to 5 monitoring stations
          </p>
        </div>
        {compareLocationIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompareLocations}>
            <X className="w-4 h-4" /> Clear all
          </Button>
        )}
      </div>

      {/* Add locations */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {allLocations.slice(0, 30).map((loc) => {
              const isAdded = compareLocationIds.includes(loc.openaqId);
              return (
                <button
                  key={loc.openaqId}
                  onClick={() => isAdded ? removeCompareLocation(loc.openaqId) : addCompareLocation(loc.openaqId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    isAdded
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {isAdded ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {loc.name.split(',')[0].trim()}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click stations to add/remove from comparison (max 5)
          </p>
        </CardContent>
      </Card>

      {compareLocationIds.length < 2 && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <AlertCircle className="w-5 h-5" />
          Select at least 2 locations to compare
        </div>
      )}

      {isLoading && compareLocationIds.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compareLocationIds.map((id) => (
            <div key={id} className="h-64 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Comparison cards */}
      {!isLoading && comparisons.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisons.map((comp) => (
            <Card key={comp.locationId}>
              <CardHeader>
                <CardTitle className="text-sm">{comp.stationName}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {comp.locality ?? comp.country?.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <AQIGauge
                  aqi={comp.aqi?.value ?? null}
                  category={(comp.aqi?.category ?? 'Unknown') as AQICategory}
                  size="sm"
                />

                {comp.aqi && !comp.aqi.isValid && (
                  <div className="text-xs text-muted-foreground text-center">
                    {comp.aqi.invalidReason}
                  </div>
                )}

                {/* Pollutant table */}
                <div className="space-y-2">
                  {Object.entries(comp.pollutants ?? {}).map(([key, reading]) => {
                    const display = POLLUTANT_DISPLAY[key];
                    if (!display) return null;
                    const r = reading as { value: number; unit: string };
                    return (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{display.label}</span>
                        <span className="font-medium">
                          {r.value.toFixed(1)} {display.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => removeCompareLocation(comp.locationId)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && comparisons.length >= 2 && (
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Only values with compatible units and measurement types are shown. 
          No cross-station averaging is performed. Each reading reflects that station's data independently.
        </p>
      )}
    </div>
  );
}

interface ComparisonItem {
  locationId: number;
  stationName: string;
  locality: string | null;
  country: { code: string; name: string };
  aqi: { value: number | null; category: string | null; isValid: boolean; invalidReason: string | null } | null;
  pollutants: Record<string, unknown>;
}

