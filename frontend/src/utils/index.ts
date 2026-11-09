import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AQICategory, FreshnessStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAQIColorHex(category: AQICategory | null | undefined): string {
  const colors: Record<string, string> = {
    'Good': '#009966',
    'Satisfactory': '#55aa00',
    'Moderate': '#ffde33',
    'Poor': '#ff7e00',
    'Very Poor': '#cc0033',
    'Severe': '#7e0023',
    'Unknown': '#9ca3af',
  };
  return colors[category ?? 'Unknown'] ?? '#9ca3af';
}

export function getAQICSSClass(category: AQICategory | null | undefined): string {
  const classes: Record<string, string> = {
    'Good': 'aqi-good',
    'Satisfactory': 'aqi-satisfactory',
    'Moderate': 'aqi-moderate',
    'Poor': 'aqi-poor',
    'Very Poor': 'aqi-very-poor',
    'Severe': 'aqi-severe',
    'Unknown': 'aqi-unknown',
  };
  return classes[category ?? 'Unknown'] ?? 'aqi-unknown';
}

export function getFreshnessColor(status: FreshnessStatus): string {
  const colors: Record<FreshnessStatus, string> = {
    'Recent': '#22c55e',
    'Delayed': '#eab308',
    'Possibly stale': '#f97316',
    'Stale': '#ef4444',
    'Unknown': '#9ca3af',
  };
  return colors[status] ?? '#9ca3af';
}

export function formatAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return 'Unknown';
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const hours = Math.floor(ageMinutes / 60);
  const mins = ageMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateTime(utc: string | null): string {
  if (!utc) return 'N/A';
  return new Date(utc).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPollutantValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)} ${unit}`;
}

export function getAQIBarWidth(aqi: number | null): number {
  if (!aqi) return 0;
  return Math.min((aqi / 500) * 100, 100);
}

