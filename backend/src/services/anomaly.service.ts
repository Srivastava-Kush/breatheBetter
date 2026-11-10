import { getLocationHistory } from './history.service';
import { getLocationById } from './location.service';
import { logger } from '../utils/logger';

export interface PollutionAnomaly {
  id: string;
  timestamp: string;
  pollutant: string;
  observedValue: number;
  expectedBaseline: number;
  zScore: number;
  type: 'SPIKE_SURGE' | 'ELEVATED_STAGNATION' | 'SENSOR_ANOMALY';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  explanation: string;
}

export interface AnomalyReport {
  locationId: number;
  stationName: string;
  analyzedHours: number;
  dataPointsEvaluated: number;
  totalAnomaliesDetected: number;
  status: 'normal' | 'anomalous_spikes_detected' | 'severe_irregularity';
  anomalies: PollutionAnomaly[];
}

/**
 * Statistical Anomaly Detection Engine.
 * Evaluates rolling Z-scores and rate-of-change derivatives on historical observations.
 */
export async function detectPollutionAnomalies(
  locationId: number,
  hours = 72,
  pollutant = 'pm25'
): Promise<AnomalyReport | null> {
  try {
    const [location, points] = await Promise.all([
      getLocationById(locationId),
      getLocationHistory(locationId, { hours, pollutant }),
    ]);

    if (!location) return null;

    if (!points || points.length < 5) {
      return {
        locationId,
        stationName: location.name,
        analyzedHours: hours,
        dataPointsEvaluated: points?.length || 0,
        totalAnomaliesDetected: 0,
        status: 'normal',
        anomalies: [],
      };
    }

    // Calculate statistical parameters
    const values: number[] = points.map((p: any) => Number(p.value) || 0);
    const mean = values.reduce((sum: number, v: number) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum: number, v: number) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1 || 1);
    const stdDev = Math.sqrt(variance) || 1;

    const anomalies: PollutionAnomaly[] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const val = Number(pt.value) || 0;
      const z = (val - mean) / stdDev;

      // Rate of change compared to previous hour
      const prevVal = i > 0 ? Number(points[i - 1].value) || val : val;
      const deltaRatio = prevVal > 0 ? (val - prevVal) / prevVal : 0;

      // 1. Critical Sudden Spike (Z-Score > 2.5 or > 2.0 with > 80% jump)
      if (z > 2.2 || (z > 1.8 && deltaRatio > 0.8)) {
        const severity = z > 3.0 ? 'critical' : z > 2.4 ? 'high' : 'medium';
        anomalies.push({
          id: `anom-${pt.sensorId}-${new Date(pt.measurementUtc).getTime()}`,
          timestamp: new Date(pt.measurementUtc).toISOString(),
          pollutant: pt.pollutant.toUpperCase(),
          observedValue: Math.round(val * 10) / 10,
          expectedBaseline: Math.round(mean * 10) / 10,
          zScore: Math.round(z * 100) / 100,
          type: 'SPIKE_SURGE',
          severity,
          title: `Sudden ${pt.pollutant.toUpperCase()} Concentration Surge (+${Math.round(deltaRatio * 100)}%)`,
          explanation: `Observed ${Math.round(val)} µg/m³ significantly exceeded the baseline (${Math.round(mean)} µg/m³ by ${z.toFixed(1)}σ). Suggests an episodic local emission event, sudden biomass burning, or transient industrial plume.`,
        });
      }
      // 2. Sensor Flatline / Zero Drop (reading drops abruptly to near 0 while surrounding points were high)
      else if (val <= 1 && prevVal > 40) {
        anomalies.push({
          id: `sensor-${pt.sensorId}-${new Date(pt.measurementUtc).getTime()}`,
          timestamp: new Date(pt.measurementUtc).toISOString(),
          pollutant: pt.pollutant.toUpperCase(),
          observedValue: val,
          expectedBaseline: Math.round(mean * 10) / 10,
          zScore: Math.round(z * 100) / 100,
          type: 'SENSOR_ANOMALY',
          severity: 'medium',
          title: 'Abrupt Sensor Drop / Potential Calibration Lag',
          explanation: `Reading abruptly dropped to ${val} µg/m³ from ${prevVal} µg/m³. Likely indicates sensor zero-drift calibration cycle or momentary communication packet loss.`,
        });
      }
    }

    return {
      locationId,
      stationName: location.name,
      analyzedHours: hours,
      dataPointsEvaluated: points.length,
      totalAnomaliesDetected: anomalies.length,
      status:
        anomalies.some((a) => a.severity === 'critical')
          ? 'severe_irregularity'
          : anomalies.length > 0
          ? 'anomalous_spikes_detected'
          : 'normal',
      anomalies,
    };
  } catch (error) {
    logger.error(`Anomaly detection failed for location ${locationId}:`, error);
    return null;
  }
}
