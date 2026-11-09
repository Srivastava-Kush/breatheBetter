import { Request, Response } from 'express';
import { getLocationById } from '../services/location.service';
import { getLatestAQI, getLatestPollutants } from '../services/aqi.service';
import { getLocationHistory } from '../services/history.service';
import { logger } from '../utils/logger';

interface InsightReport {
  stationName: string;
  summary: string;
  trend: 'improving' | 'worsening' | 'stable';
  trendDescription: string;
  peakHour: string | null;
  pmRatio: {
    ratio: number | null;
    interpretation: string;
  };
  keyFindings: string[];
  generatedAt: string;
}

export async function generateLocationInsights(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const [location, aqiSnap, latestPollutants, history24h] = await Promise.all([
      getLocationById(locationId),
      getLatestAQI(locationId),
      getLatestPollutants(locationId),
      getLocationHistory(locationId, { hours: 24, pollutant: 'pm25' }),
    ]);

    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    const pm25 = latestPollutants?.['pm25']?.value ?? null;
    const pm10 = latestPollutants?.['pm10']?.value ?? null;
    const currentAqi = aqiSnap?.isValid ? aqiSnap.aqi : null;
    const category = aqiSnap?.isValid ? aqiSnap.category : 'Unknown';

    // 1. Calculate PM2.5 / PM10 ratio
    let pmRatio: number | null = null;
    let pmInterpretation = 'Insufficient particulate data to determine pollution composition.';
    if (pm25 !== null && pm10 !== null && pm10 > 0) {
      pmRatio = parseFloat((pm25 / pm10).toFixed(2));
      if (pmRatio > 0.65) {
        pmInterpretation = `High PM2.5/PM10 ratio (${(pmRatio * 100).toFixed(0)}%) indicates combustion-dominated pollution: vehicular exhaust, biomass/waste burning, and industrial discharge.`;
      } else if (pmRatio > 0.4) {
        pmInterpretation = `Balanced PM2.5/PM10 ratio (${(pmRatio * 100).toFixed(0)}%) reflects a combination of combustion emissions and mechanical dust.`;
      } else {
        pmInterpretation = `Low PM2.5/PM10 ratio (${(pmRatio * 100).toFixed(0)}%) indicates coarse dust dominance: construction activity, road dust resuspension, and soil erosion.`;
      }
    }

    // 2. Analyze 24h trend
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    let trendDescription = 'Air quality levels have remained steady over the past 24 hours.';
    let peakHourStr: string | null = null;

    if (Array.isArray(history24h) && history24h.length >= 6) {
      const sorted = [...history24h].sort(
        (a, b) => new Date(a.measurementUtc).getTime() - new Date(b.measurementUtc).getTime()
      );

      const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
      const lastThird = sorted.slice(-Math.floor(sorted.length / 3));

      const avgFirst = firstThird.reduce((acc, cur) => acc + cur.value, 0) / firstThird.length;
      const avgLast = lastThird.reduce((acc, cur) => acc + cur.value, 0) / lastThird.length;

      const diffPct = ((avgLast - avgFirst) / (avgFirst || 1)) * 100;

      if (diffPct > 15) {
        trend = 'worsening';
        trendDescription = `PM2.5 concentrations have increased by ${Math.round(diffPct)}% over the last 24 hours.`;
      } else if (diffPct < -15) {
        trend = 'improving';
        trendDescription = `PM2.5 concentrations have decreased by ${Math.round(Math.abs(diffPct))}% compared to earlier readings.`;
      }

      // Find peak hour
      let maxVal = -1;
      let maxTime: Date | null = null;
      for (const item of sorted) {
        if (item.value > maxVal) {
          maxVal = item.value;
          maxTime = new Date(item.measurementUtc);
        }
      }
      if (maxTime) {
        peakHourStr = maxTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        });
      }
    }

    // 3. Compile Key Findings
    const keyFindings: string[] = [];

    if (currentAqi !== null) {
      keyFindings.push(`Current air quality is categorized as ${category} (AQI: ${currentAqi}) driven primarily by ${aqiSnap?.dominantPollutant?.toUpperCase() || 'particulate matter'}.`);
    }

    if (peakHourStr) {
      keyFindings.push(`Highest pollution spike over the last 24h occurred around ${peakHourStr}.`);
    }

    if (pmRatio !== null) {
      keyFindings.push(pmInterpretation);
    }

    if (latestPollutants?.['no2']?.value && latestPollutants['no2'].value > 80) {
      keyFindings.push(`Elevated Nitrogen Dioxide (NO₂: ${latestPollutants['no2'].value.toFixed(1)} µg/m³) indicates heavy nearby traffic congestion or diesel generator activity.`);
    }

    if (latestPollutants?.['so2']?.value && latestPollutants['so2'].value > 40) {
      keyFindings.push(`Sulphur Dioxide (SO₂: ${latestPollutants['so2'].value.toFixed(1)} µg/m³) is moderately elevated, pointing to industrial or thermal activity.`);
    }

    if (keyFindings.length === 0) {
      keyFindings.push('Observation records are updating. Check back shortly for updated pattern analysis.');
    }

    const summary = currentAqi !== null
      ? `Air quality at ${location.name} is currently ${category} with an AQI of ${currentAqi}. Conditions are ${trend} compared to the previous 24 hours.`
      : `Air quality observations for ${location.name} are currently being gathered.`;

    const report: InsightReport = {
      stationName: location.name,
      summary,
      trend,
      trendDescription,
      peakHour: peakHourStr,
      pmRatio: {
        ratio: pmRatio,
        interpretation: pmInterpretation,
      },
      keyFindings,
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('generateLocationInsights error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate pollution insights' });
  }
}
