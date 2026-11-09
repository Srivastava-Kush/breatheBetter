import { AQICategory } from '../utils/aqi-calculator';

export interface HealthRecommendation {
  category: AQICategory | 'Unknown';
  general: string;
  outdoor: string;
  sensitiveGroups: string;
  exercise: string;
  windows: string;
  masks: string;
  color: string;
  emoji: string;
}

const RECOMMENDATIONS: Record<string, HealthRecommendation> = {
  Good: {
    category: 'Good',
    general: 'Air quality is satisfactory and poses little or no health risk.',
    outdoor: 'Great day for outdoor activities!',
    sensitiveGroups: 'No special precautions needed.',
    exercise: 'Ideal conditions for jogging, cycling, and all outdoor sports.',
    windows: 'Open your windows to enjoy fresh air.',
    masks: 'No mask required.',
    color: '#009966',
    emoji: '😊',
  },
  Satisfactory: {
    category: 'Satisfactory',
    general: 'Air quality is acceptable. Some pollutants may cause mild concern for very sensitive individuals.',
    outdoor: 'Outdoor activities are generally fine.',
    sensitiveGroups: 'Very sensitive individuals (severe respiratory conditions) should monitor symptoms.',
    exercise: 'Suitable for most outdoor exercises. Sensitive individuals may consider moderating intensity.',
    windows: 'Ventilation is generally fine.',
    masks: 'Mask not required for most people.',
    color: '#55aa00',
    emoji: '🙂',
  },
  Moderate: {
    category: 'Moderate',
    general: 'Air quality may cause breathing discomfort to people with respiratory diseases such as asthma and other sensitive groups.',
    outdoor: 'Healthy individuals can continue outdoor activities. Sensitive groups should limit prolonged exposure.',
    sensitiveGroups: 'Children, elderly, and people with asthma or heart disease should reduce outdoor time.',
    exercise: 'Reduce strenuous outdoor exercises. Prefer morning hours when pollution is typically lower.',
    windows: 'Consider closing windows if you notice irritation.',
    masks: 'Consider N95 mask for sensitive individuals during outdoor activities.',
    color: '#ffde33',
    emoji: '😐',
  },
  Poor: {
    category: 'Poor',
    general: 'Breathing discomfort to most people on prolonged exposure. Serious health risks for sensitive groups.',
    outdoor: 'Limit prolonged outdoor exposure. Avoid high-traffic areas.',
    sensitiveGroups: 'Children, elderly, pregnant women, and those with respiratory/heart conditions should stay indoors.',
    exercise: 'Avoid outdoor exercises. Exercise indoors instead.',
    windows: 'Keep windows closed. Use air purifiers if available.',
    masks: 'Wear N95/N99 masks if outdoors is unavoidable.',
    color: '#ff7e00',
    emoji: '😷',
  },
  'Very Poor': {
    category: 'Very Poor',
    general: 'Respiratory illness on prolonged exposure. Effects noticeable even in healthy individuals.',
    outdoor: 'Avoid all unnecessary outdoor activity.',
    sensitiveGroups: 'Sensitive groups must stay indoors. Seek medical attention if breathing difficulties arise.',
    exercise: 'Do not exercise outdoors. Indoor activities only.',
    windows: 'Keep all windows and doors closed. Run air purifiers on highest setting.',
    masks: 'N95 or higher masks are strongly recommended if you must go outside.',
    color: '#cc0033',
    emoji: '🚫',
  },
  Severe: {
    category: 'Severe',
    general: 'Serious health impacts for everyone. Emergency-level pollution. Health alert.',
    outdoor: 'Stay indoors. Outdoor activities are dangerous for all.',
    sensitiveGroups: 'Emergency alert for all sensitive groups. Avoid any outdoor exposure.',
    exercise: 'All outdoor exercise prohibited. Only essential movements indoors.',
    windows: 'Seal windows if possible. Run HEPA air purifiers continuously.',
    masks: 'P100 or N99 respirator required if outdoor exposure is absolutely unavoidable.',
    color: '#7e0023',
    emoji: '⛔',
  },
  Unknown: {
    category: 'Unknown',
    general: 'Air quality data is currently unavailable for this location.',
    outdoor: 'No recommendations available without current air quality data.',
    sensitiveGroups: 'Please check official sources for health advisories.',
    exercise: 'Use caution when planning outdoor activities.',
    windows: 'Monitor local conditions.',
    masks: 'No guidance available.',
    color: '#9ca3af',
    emoji: '❓',
  },
};

export function getHealthRecommendation(
  category: AQICategory | 'Unknown'
): HealthRecommendation {
  return RECOMMENDATIONS[category] ?? RECOMMENDATIONS['Unknown']!;
}

export function getDominantPollutantDescription(pollutant: string): string {
  const descriptions: Record<string, string> = {
    pm25: 'Fine particulate matter (PM2.5) — tiny particles that can penetrate deep into the lungs and bloodstream.',
    pm10: 'Coarse particulate matter (PM10) — particles that can irritate the nose, throat, and lungs.',
    no2: 'Nitrogen Dioxide (NO2) — a gas from vehicle exhaust and industrial activity that can cause respiratory inflammation.',
    so2: 'Sulphur Dioxide (SO2) — primarily from industrial burning of fossil fuels; irritates airways.',
    co: 'Carbon Monoxide (CO) — an odourless gas from incomplete combustion; reduces oxygen delivery in the body.',
    o3: 'Ground-level Ozone (O3) — formed from reactions between sunlight and other pollutants; can cause chest pain and coughing.',
    nh3: 'Ammonia (NH3) — from agricultural and industrial sources; can irritate the respiratory tract.',
  };
  return descriptions[pollutant] ?? `${pollutant.toUpperCase()} — air quality pollutant.`;
}

