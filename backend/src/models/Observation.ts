import mongoose, { Document, Schema } from 'mongoose';

export interface IObservation extends Document {
  source: string;
  locationId: number;
  sensorId: number;
  stationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pollutant: string;
  value: number;
  unit: string;
  measurementUtc: Date;
  measurementLocal: string;
  fetchedAt: Date;
  measurementType: 'ground_observation' | 'hourly_average' | 'raw' | 'forecast';
  ageMinutes: number | null;
  freshnessStatus: 'Recent' | 'Delayed' | 'Possibly stale' | 'Stale' | 'Unknown';
  createdAt: Date;
  updatedAt: Date;
}

const ObservationSchema = new Schema<IObservation>(
  {
    source: { type: String, default: 'OpenAQ' },
    locationId: { type: Number, required: true, index: true },
    sensorId: { type: Number, required: true, index: true },
    stationName: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    pollutant: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    measurementUtc: { type: Date, required: true },
    measurementLocal: { type: String, required: true },
    fetchedAt: { type: Date, default: Date.now },
    measurementType: {
      type: String,
      enum: ['ground_observation', 'hourly_average', 'raw', 'forecast'],
      default: 'ground_observation',
    },
    ageMinutes: { type: Number, default: null },
    freshnessStatus: {
      type: String,
      enum: ['Recent', 'Delayed', 'Possibly stale', 'Stale', 'Unknown'],
      default: 'Unknown',
    },
  },
  { timestamps: true }
);

// Compound indexes
ObservationSchema.index({ locationId: 1, pollutant: 1, measurementUtc: -1 });
ObservationSchema.index({ sensorId: 1, measurementUtc: -1 });
ObservationSchema.index({ measurementUtc: -1 });

// Prevent duplicate observations for same sensor at same timestamp
ObservationSchema.index(
  { sensorId: 1, measurementUtc: 1, measurementType: 1 },
  { unique: true, background: true }
);

export const Observation = mongoose.model<IObservation>('Observation', ObservationSchema);

