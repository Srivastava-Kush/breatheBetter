import React from 'react';
import { POLLUTANT_DISPLAY } from '../../types';
import { formatPollutantValue } from '../../utils';
import type { PollutantReading } from '../../types';
import { FreshnessBadge } from './FreshnessBadge';

interface PollutantCardProps {
  pollutant: string;
  reading: PollutantReading;
  compact?: boolean;
}

const POLLUTANT_THRESHOLDS: Record<string, { good: number; moderate: number; poor: number }> = {
  pm25: { good: 30, moderate: 60, poor: 90 },
  pm10: { good: 50, moderate: 100, poor: 250 },
  no2:  { good: 40, moderate: 80, poor: 180 },
  so2:  { good: 40, moderate: 80, poor: 380 },
  co:   { good: 1, moderate: 2, poor: 10 },
  o3:   { good: 50, moderate: 100, poor: 168 },
  nh3:  { good: 200, moderate: 400, poor: 800 },
};

function getLevel(pollutant: string, value: number): 'good' | 'moderate' | 'poor' | 'severe' {
  const thresholds = POLLUTANT_THRESHOLDS[pollutant];
  if (!thresholds) return 'good';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.moderate) return 'moderate';
  if (value <= thresholds.poor) return 'poor';
  return 'severe';
}

const LEVEL_COLORS = {
  good: 'text-[#009966] bg-[#009966]/10',
  moderate: 'text-[#ffde33] bg-[#ffde33]/10',
  poor: 'text-[#ff7e00] bg-[#ff7e00]/10',
  severe: 'text-[#cc0033] bg-[#cc0033]/10',
};

export function PollutantCard({ pollutant, reading, compact = false }: PollutantCardProps) {
  const display = POLLUTANT_DISPLAY[pollutant] ?? { label: pollutant.toUpperCase(), unit: reading.unit };
  const level = getLevel(pollutant, reading.value);
  const colorClass = LEVEL_COLORS[level];

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="text-sm font-medium">{display.label}</span>
        <span className={`text-sm font-semibold px-2 py-0.5 rounded ${colorClass}`}>
          {reading.value.toFixed(1)} {display.unit}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {display.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </div>
      <div className="text-2xl font-bold">
        {reading.value.toFixed(1)}{' '}
        <span className="text-sm font-normal text-muted-foreground">{display.unit}</span>
      </div>
      <FreshnessBadge
        status={reading.freshnessStatus}
        ageMinutes={reading.ageMinutes}
        measurementUtc={reading.measurementUtc}
      />
    </div>
  );
}

