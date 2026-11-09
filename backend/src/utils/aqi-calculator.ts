/**
 * CPCB National AQI Calculator
 *
 * India's Central Pollution Control Board (CPCB) methodology.
 * Reference: CPCB National AQI methodology document.
 *
 * IMPORTANT:
 * - Overall AQI = maximum of all valid sub-indices
 * - Minimum 3 valid sub-indices required (must include PM2.5 or PM10)
 * - Minimum 16 of 24 hourly data points needed for 24-hr average
 * - Display as: "BreatheBetter AQI — Calculated using CPCB methodology"
 */

export type AQIPollutant = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | 'nh3';

export interface AQIBreakpoint {
  cLow: number;    // Concentration low
  cHigh: number;   // Concentration high
  iLow: number;    // Index low
  iHigh: number;   // Index high
  category: AQICategory;
}

export type AQICategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface PollutantSubIndex {
  pollutant: AQIPollutant;
  concentration: number;
  unit: string;
  subIndex: number;
  category: AQICategory;
  averagingPeriodHours: number;
  dataPointsUsed: number;
  isValid: boolean;
  invalidReason?: string;
}

export interface AQIResult {
  aqi: number;
  category: AQICategory;
  dominantPollutant: AQIPollutant;
  subIndices: PollutantSubIndex[];
  isValid: boolean;
  invalidReason: string | null;
  calculationStandard: 'CPCB';
  displayLabel: string;
}

// ---------------------------------------------------------------------------
// CPCB Breakpoint Tables
// All concentrations in µg/m³ except CO (mg/m³)
// ---------------------------------------------------------------------------

const PM25_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 30,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 30,   cHigh: 60,   iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 60,   cHigh: 90,   iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 90,   cHigh: 120,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 120,  cHigh: 250,  iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 250,  cHigh: 380,  iLow: 401, iHigh: 500, category: 'Severe' },
];

const PM10_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 50,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 50,   cHigh: 100,  iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 100,  cHigh: 250,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 250,  cHigh: 350,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 350,  cHigh: 430,  iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 430,  cHigh: 600,  iLow: 401, iHigh: 500, category: 'Severe' },
];

const NO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 40,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 40,   cHigh: 80,   iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 80,   cHigh: 180,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 180,  cHigh: 280,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 280,  cHigh: 400,  iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 400,  cHigh: 800,  iLow: 401, iHigh: 500, category: 'Severe' },
];

const SO2_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 40,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 40,   cHigh: 80,   iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 80,   cHigh: 380,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 380,  cHigh: 800,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 800,  cHigh: 1600, iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 1600, cHigh: 3200, iLow: 401, iHigh: 500, category: 'Severe' },
];

// CO in mg/m³
const CO_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,   cHigh: 1,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 1,   cHigh: 2,   iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 2,   cHigh: 10,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 10,  cHigh: 17,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 17,  cHigh: 34,  iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 34,  cHigh: 408, iLow: 401, iHigh: 500, category: 'Severe' },
];

const O3_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 50,   iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 50,   cHigh: 100,  iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 100,  cHigh: 168,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 168,  cHigh: 208,  iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 208,  cHigh: 748,  iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 748,  cHigh: 1000, iLow: 401, iHigh: 500, category: 'Severe' },
];

const NH3_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0,    cHigh: 200,  iLow: 0,   iHigh: 50,  category: 'Good' },
  { cLow: 200,  cHigh: 400,  iLow: 51,  iHigh: 100, category: 'Satisfactory' },
  { cLow: 400,  cHigh: 800,  iLow: 101, iHigh: 200, category: 'Moderate' },
  { cLow: 800,  cHigh: 1200, iLow: 201, iHigh: 300, category: 'Poor' },
  { cLow: 1200, cHigh: 1800, iLow: 301, iHigh: 400, category: 'Very Poor' },
  { cLow: 1800, cHigh: 2400, iLow: 401, iHigh: 500, category: 'Severe' },
];

export const POLLUTANT_BREAKPOINTS: Record<AQIPollutant, AQIBreakpoint[]> = {
  pm25: PM25_BREAKPOINTS,
  pm10: PM10_BREAKPOINTS,
  no2: NO2_BREAKPOINTS,
  so2: SO2_BREAKPOINTS,
  co: CO_BREAKPOINTS,
  o3: O3_BREAKPOINTS,
  nh3: NH3_BREAKPOINTS,
};

/** Averaging period in hours for each pollutant */
export const POLLUTANT_AVERAGING_PERIOD: Record<AQIPollutant, number> = {
  pm25: 24,
  pm10: 24,
  no2: 24,
  so2: 24,
  co: 8,
  o3: 8,
  nh3: 24,
};

/** Expected unit for each pollutant (after normalization) */
const POLLUTANT_UNITS: Record<AQIPollutant, string[]> = {
  pm25: ['µg/m³', 'ug/m3', 'μg/m³'],
  pm10: ['µg/m³', 'ug/m3', 'μg/m³'],
  no2: ['µg/m³', 'ug/m3', 'μg/m³'],
  so2: ['µg/m³', 'ug/m3', 'μg/m³'],
  co:  ['mg/m³', 'mg/m3'],
  o3:  ['µg/m³', 'ug/m3', 'μg/m³'],
  nh3: ['µg/m³', 'ug/m3', 'μg/m³'],
};

// ---------------------------------------------------------------------------
// Core calculation helpers
// ---------------------------------------------------------------------------

/**
 * Linear interpolation between two breakpoints.
 * AQI = ((IHigh - ILow) / (CHigh - CLow)) * (Cp - CLow) + ILow
 */
function interpolate(concentration: number, bp: AQIBreakpoint): number {
  if (bp.cHigh === bp.cLow) return bp.iLow;
  const index =
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
  return Math.round(index);
}

/**
 * Find the matching breakpoint for a concentration value.
 */
function findBreakpoint(concentration: number, breakpoints: AQIBreakpoint[]): AQIBreakpoint | null {
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      return bp;
    }
  }
  // Concentration exceeds highest breakpoint — clamp to Severe
  const last = breakpoints[breakpoints.length - 1];
  if (concentration > (last?.cHigh ?? Infinity)) {
    return { ...last!, cHigh: concentration, iHigh: 500, category: 'Severe' };
  }
  return null;
}

/**
 * Validate that the unit is acceptable for the pollutant.
 */
function isValidUnit(pollutant: AQIPollutant, unit: string): boolean {
  const acceptable = POLLUTANT_UNITS[pollutant];
  return acceptable.some((u) => unit.toLowerCase().replace(/\s/g, '') === u.toLowerCase().replace(/\s/g, ''));
}

/**
 * Calculate sub-index for a single pollutant.
 */
export function calculateSubIndex(
  pollutant: AQIPollutant,
  concentration: number,
  unit: string,
  dataPointsUsed: number,
  requiredDataPoints: number
): PollutantSubIndex {
  const averagingPeriodHours = POLLUTANT_AVERAGING_PERIOD[pollutant];

  if (!isValidUnit(pollutant, unit)) {
    return {
      pollutant,
      concentration,
      unit,
      subIndex: 0,
      category: 'Good',
      averagingPeriodHours,
      dataPointsUsed,
      isValid: false,
      invalidReason: `Invalid unit "${unit}" for ${pollutant}`,
    };
  }

  if (dataPointsUsed < requiredDataPoints) {
    return {
      pollutant,
      concentration,
      unit,
      subIndex: 0,
      category: 'Good',
      averagingPeriodHours,
      dataPointsUsed,
      isValid: false,
      invalidReason: `Insufficient data: ${dataPointsUsed}/${requiredDataPoints} data points`,
    };
  }

  if (concentration < 0 || !isFinite(concentration)) {
    return {
      pollutant,
      concentration,
      unit,
      subIndex: 0,
      category: 'Good',
      averagingPeriodHours,
      dataPointsUsed,
      isValid: false,
      invalidReason: `Invalid concentration value: ${concentration}`,
    };
  }

  const breakpoints = POLLUTANT_BREAKPOINTS[pollutant];
  const bp = findBreakpoint(concentration, breakpoints);

  if (!bp) {
    return {
      pollutant,
      concentration,
      unit,
      subIndex: 0,
      category: 'Good',
      averagingPeriodHours,
      dataPointsUsed,
      isValid: false,
      invalidReason: `Concentration ${concentration} outside breakpoint table`,
    };
  }

  const subIndex = interpolate(concentration, bp);

  return {
    pollutant,
    concentration,
    unit,
    subIndex,
    category: bp.category,
    averagingPeriodHours,
    dataPointsUsed,
    isValid: true,
  };
}

// ---------------------------------------------------------------------------
// Overall AQI
// ---------------------------------------------------------------------------

const MIN_REQUIRED_SUBINDICES = 3;
const MIN_REQUIRED_DATA_COMPLETENESS = 16; // of 24 hourly readings

/**
 * Calculate overall CPCB AQI from a set of pollutant averages.
 *
 * @param pollutantData - Map from pollutant name to { value, unit, dataPoints }
 */
export function calculateCPCBAQI(
  pollutantData: Partial<
    Record<AQIPollutant, { value: number; unit: string; dataPointsUsed: number }>
  >
): AQIResult {
  const subIndices: PollutantSubIndex[] = [];

  for (const [pollutant, data] of Object.entries(pollutantData) as [
    AQIPollutant,
    { value: number; unit: string; dataPointsUsed: number }
  ][]) {
    if (!data) continue;

    const avgPeriod = POLLUTANT_AVERAGING_PERIOD[pollutant];
    const requiredPoints = pollutant === 'co' || pollutant === 'o3'
      ? Math.ceil(MIN_REQUIRED_DATA_COMPLETENESS * (avgPeriod / 24))
      : MIN_REQUIRED_DATA_COMPLETENESS;

    const subIndex = calculateSubIndex(
      pollutant,
      data.value,
      data.unit,
      data.dataPointsUsed,
      requiredPoints
    );
    subIndices.push(subIndex);
  }

  const validSubIndices = subIndices.filter((s) => s.isValid);

  // Must include PM2.5 or PM10
  const hasParticulateMatter =
    validSubIndices.some((s) => s.pollutant === 'pm25') ||
    validSubIndices.some((s) => s.pollutant === 'pm10');

  if (validSubIndices.length < MIN_REQUIRED_SUBINDICES || !hasParticulateMatter) {
    const reason = !hasParticulateMatter
      ? 'PM2.5 or PM10 measurement required for AQI calculation'
      : `Only ${validSubIndices.length} valid sub-indices (minimum ${MIN_REQUIRED_SUBINDICES} required)`;

    return {
      aqi: 0,
      category: 'Good',
      dominantPollutant: 'pm25',
      subIndices,
      isValid: false,
      invalidReason: reason,
      calculationStandard: 'CPCB',
      displayLabel: 'AQI unavailable — insufficient valid pollutant data',
    };
  }

  // Overall AQI = maximum sub-index
  const dominant = validSubIndices.reduce((prev, curr) =>
    curr.subIndex > prev.subIndex ? curr : prev
  );

  return {
    aqi: dominant.subIndex,
    category: dominant.category,
    dominantPollutant: dominant.pollutant,
    subIndices,
    isValid: true,
    invalidReason: null,
    calculationStandard: 'CPCB',
    displayLabel: 'BreatheBetter AQI — Calculated using CPCB methodology',
  };
}

// ---------------------------------------------------------------------------
// AQI Color and display helpers
// ---------------------------------------------------------------------------

export const AQI_COLORS: Record<AQICategory, string> = {
  'Good': '#009966',
  'Satisfactory': '#55aa00',
  'Moderate': '#ffde33',
  'Poor': '#ff7e00',
  'Very Poor': '#cc0033',
  'Severe': '#7e0023',
};

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getAQIColor(aqi: number): string {
  return AQI_COLORS[getAQICategory(aqi)];
}

