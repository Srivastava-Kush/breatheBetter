import mongoose, { Document, Schema } from 'mongoose';

export interface ISubIndex {
  pollutant: string;
  value: number;
  subIndex: number;
  unit: string;
  averagingPeriodHours: number;
  dataPointsUsed: number;
}

export interface IAQISnapshot extends Document {
  locationId: number;
  stationName: string;
  calculationStandard: 'CPCB';
  aqi: number;
  category: string;
  dominantPollutant: string;
  subIndices: ISubIndex[];
  inputObservationIds: mongoose.Types.ObjectId[];
  calculatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  isValid: boolean;
  invalidReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubIndexSchema = new Schema<ISubIndex>({
  pollutant: { type: String, required: true },
  value: { type: Number, required: true },
  subIndex: { type: Number, required: true },
  unit: { type: String, required: true },
  averagingPeriodHours: { type: Number, required: true },
  dataPointsUsed: { type: Number, required: true },
}, { _id: false });

const AQISnapshotSchema = new Schema<IAQISnapshot>(
  {
    locationId: { type: Number, required: true, index: true },
    stationName: { type: String, required: true },
    calculationStandard: { type: String, enum: ['CPCB'], default: 'CPCB' },
    aqi: { type: Number, required: true },
    category: { type: String, required: true },
    dominantPollutant: { type: String, default: null },
    subIndices: [SubIndexSchema],
    inputObservationIds: [{ type: Schema.Types.ObjectId, ref: 'Observation' }],
    calculatedAt: { type: Date, default: Date.now },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    isValid: { type: Boolean, default: true },
    invalidReason: { type: String, default: null },
  },
  { timestamps: true }
);

AQISnapshotSchema.index({ locationId: 1, calculatedAt: -1 });
AQISnapshotSchema.index({ calculatedAt: -1 });

export const AQISnapshot = mongoose.model<IAQISnapshot>('AQISnapshot', AQISnapshotSchema);

