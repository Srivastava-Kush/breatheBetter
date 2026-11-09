import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAlert extends Document {
  locationId: number;
  stationName: string;
  aqiThreshold: number;
  condition: 'above' | 'below';
  pollutant: 'aqi' | 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';
  isActive: boolean;
  notificationTypes: Array<'in-app' | 'browser'>;
  lastTriggeredAt: Date | null;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserAlertSchema = new Schema<IUserAlert>(
  {
    locationId: { type: Number, required: true },
    stationName: { type: String, required: true },
    aqiThreshold: { type: Number, required: true, min: 0, max: 500 },
    condition: { type: String, enum: ['above', 'below'], default: 'above' },
    pollutant: {
      type: String,
      enum: ['aqi', 'pm25', 'pm10', 'no2', 'so2', 'co', 'o3'],
      default: 'aqi',
    },
    isActive: { type: Boolean, default: true },
    notificationTypes: [{ type: String, enum: ['in-app', 'browser'] }],
    lastTriggeredAt: { type: Date, default: null },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserAlertSchema.index({ locationId: 1, isActive: 1 });

export const UserAlert = mongoose.model<IUserAlert>('UserAlert', UserAlertSchema);

