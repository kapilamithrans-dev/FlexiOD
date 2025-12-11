import mongoose, { Schema, Document } from "mongoose";

export interface ITimetableEntry extends Document {
  studentId: string;
  dayOfWeek: number;
  period: number;
  subjectCode: string;
  subjectName: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
}

const TimetableEntrySchema = new Schema<ITimetableEntry>({
  studentId: { type: String, required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  period: { type: Number, required: true, min: 1, max: 10 },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  staffId: { type: String, required: true, index: true },
  staffName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: true });

TimetableEntrySchema.index({ studentId: 1, dayOfWeek: 1 });

export const TimetableEntry = mongoose.model<ITimetableEntry>("TimetableEntry", TimetableEntrySchema);
