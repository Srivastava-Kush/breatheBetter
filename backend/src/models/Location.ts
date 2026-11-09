import mongoose, { Document, Schema } from 'mongoose';

export interface ISensor {
  id: number;
  name: string;
  parameter: {
    id: number;
    name: string;
    units: string;
    displayName: string;
  };
}

export interface ILocation extends Document {
  openaqId: number;
  name: string;
  locality: string | null;
  timezone: string;
  country: {
    code: string;
    name: string;
  };
  owner: {
    id: number;
    name: string;
  } | null;
  provider: {
    id: number;
    name: string;
  } | null;
  isMobile: boolean;
  isMonitor: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensors: ISensor[];
  licenses: Array<{
    id?: number;
    name?: string;
    url?: string;
    attribution?: string;
  }>;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SensorSchema = new Schema<ISensor>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  parameter: {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    units: { type: String, required: true },
    displayName: { type: String, required: true },
  },
}, { _id: false });

const LocationSchema = new Schema<ILocation>(
  {
    openaqId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    locality: { type: String, default: null },
    timezone: { type: String, default: 'Asia/Kolkata' },
    country: {
      code: { type: String, required: true },
      name: { type: String, required: true },
    },
    owner: {
      id: { type: Number },
      name: { type: String },
    },
    provider: {
      id: { type: Number },
      name: { type: String },
    },
    isMobile: { type: Boolean, default: false },
    isMonitor: { type: Boolean, default: false },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    sensors: [SensorSchema],
    licenses: [{ type: Schema.Types.Mixed }],
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Geospatial index for nearby queries
LocationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
LocationSchema.index({ 'country.code': 1 });
LocationSchema.index({ name: 'text', locality: 'text' });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);

