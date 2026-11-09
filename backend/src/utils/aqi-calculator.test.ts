/**
 * Automated unit tests for the CPCB AQI Calculator.
 * Tests all breakpoint boundaries and category transitions.
 */

import {
  calculateSubIndex,
  calculateCPCBAQI,
  getAQICategory,
  getAQIColor,
} from './aqi-calculator';

describe('AQI Calculator — Breakpoint boundaries', () => {
  // PM2.5
  describe('PM2.5 sub-index', () => {
    it('Good: 0 µg/m³ → sub-index 0', () => {
      const result = calculateSubIndex('pm25', 0, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Good');
      expect(result.subIndex).toBe(0);
    });

    it('Good/Satisfactory boundary: 30 µg/m³', () => {
      const result = calculateSubIndex('pm25', 30, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Good');
      expect(result.subIndex).toBeLessThanOrEqual(50);
    });

    it('Satisfactory: 45 µg/m³', () => {
      const result = calculateSubIndex('pm25', 45, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Satisfactory');
      expect(result.subIndex).toBeGreaterThan(50);
      expect(result.subIndex).toBeLessThanOrEqual(100);
    });

    it('Moderate: 75 µg/m³', () => {
      const result = calculateSubIndex('pm25', 75, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Moderate');
      expect(result.subIndex).toBeGreaterThan(100);
      expect(result.subIndex).toBeLessThanOrEqual(200);
    });

    it('Poor: 105 µg/m³', () => {
      const result = calculateSubIndex('pm25', 105, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Poor');
      expect(result.subIndex).toBeGreaterThan(200);
      expect(result.subIndex).toBeLessThanOrEqual(300);
    });

    it('Very Poor: 185 µg/m³', () => {
      const result = calculateSubIndex('pm25', 185, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Very Poor');
      expect(result.subIndex).toBeGreaterThan(300);
      expect(result.subIndex).toBeLessThanOrEqual(400);
    });

    it('Severe: 300 µg/m³', () => {
      const result = calculateSubIndex('pm25', 300, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Severe');
      expect(result.subIndex).toBeGreaterThan(400);
    });
  });

  // PM10
  describe('PM10 sub-index', () => {
    it('Good: 25 µg/m³', () => {
      const result = calculateSubIndex('pm10', 25, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Good');
    });

    it('Satisfactory: 75 µg/m³', () => {
      const result = calculateSubIndex('pm10', 75, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Satisfactory');
    });

    it('Severe: 500 µg/m³', () => {
      const result = calculateSubIndex('pm10', 500, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Severe');
    });
  });

  // CO (mg/m³)
  describe('CO sub-index', () => {
    it('Good: 0.5 mg/m³', () => {
      const result = calculateSubIndex('co', 0.5, 'mg/m³', 8, 6);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Good');
    });

    it('Moderate: 5 mg/m³', () => {
      const result = calculateSubIndex('co', 5, 'mg/m³', 8, 6);
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('Moderate');
    });
  });

  // Invalid inputs
  describe('Invalid inputs', () => {
    it('rejects wrong unit for PM2.5', () => {
      const result = calculateSubIndex('pm25', 50, 'ppb', 24, 16);
      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toContain('Invalid unit');
    });

    it('rejects negative concentration', () => {
      const result = calculateSubIndex('pm25', -5, 'µg/m³', 24, 16);
      expect(result.isValid).toBe(false);
    });

    it('rejects insufficient data points', () => {
      const result = calculateSubIndex('pm25', 50, 'µg/m³', 10, 16);
      expect(result.isValid).toBe(false);
      expect(result.invalidReason).toContain('Insufficient data');
    });
  });
});

describe('AQI Calculator — Overall CPCB AQI', () => {
  it('returns invalid when only 2 sub-indices available', () => {
    const result = calculateCPCBAQI({
      pm25: { value: 50, unit: 'µg/m³', dataPointsUsed: 20 },
      pm10: { value: 80, unit: 'µg/m³', dataPointsUsed: 20 },
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toContain('valid sub-indices');
  });

  it('returns invalid when PM2.5 and PM10 both missing', () => {
    const result = calculateCPCBAQI({
      no2: { value: 50, unit: 'µg/m³', dataPointsUsed: 20 },
      so2: { value: 60, unit: 'µg/m³', dataPointsUsed: 20 },
      o3: { value: 70, unit: 'µg/m³', dataPointsUsed: 8 },
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toContain('PM2.5 or PM10');
  });

  it('calculates valid AQI from 3+ pollutants including PM2.5', () => {
    const result = calculateCPCBAQI({
      pm25: { value: 75, unit: 'µg/m³', dataPointsUsed: 20 },
      pm10: { value: 150, unit: 'µg/m³', dataPointsUsed: 20 },
      no2: { value: 60, unit: 'µg/m³', dataPointsUsed: 20 },
    });
    expect(result.isValid).toBe(true);
    expect(result.aqi).toBeGreaterThan(100);
    expect(result.calculationStandard).toBe('CPCB');
    expect(result.displayLabel).toContain('BreatheBetter AQI');
  });

  it('dominant pollutant is the one with the highest sub-index', () => {
    const result = calculateCPCBAQI({
      pm25: { value: 200, unit: 'µg/m³', dataPointsUsed: 20 },
      pm10: { value: 50, unit: 'µg/m³', dataPointsUsed: 20 },
      no2: { value: 20, unit: 'µg/m³', dataPointsUsed: 20 },
    });
    expect(result.isValid).toBe(true);
    expect(result.dominantPollutant).toBe('pm25');
  });
});

describe('AQI Color and Category helpers', () => {
  it('returns Good for AQI 0–50', () => {
    expect(getAQICategory(0)).toBe('Good');
    expect(getAQICategory(50)).toBe('Good');
  });

  it('returns Satisfactory for AQI 51–100', () => {
    expect(getAQICategory(51)).toBe('Satisfactory');
    expect(getAQICategory(100)).toBe('Satisfactory');
  });

  it('returns Severe for AQI > 400', () => {
    expect(getAQICategory(401)).toBe('Severe');
    expect(getAQICategory(500)).toBe('Severe');
  });

  it('returns correct hex color for each category', () => {
    expect(getAQIColor(25)).toBe('#009966');
    expect(getAQIColor(250)).toBe('#ff7e00');
    expect(getAQIColor(350)).toBe('#cc0033');
  });
});

