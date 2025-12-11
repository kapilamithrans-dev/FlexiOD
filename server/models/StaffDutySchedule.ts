import mongoose, { Schema, Document } from "mongoose";

export interface IStaffDutySchedule extends Document {
  staffId: string;
  dayOfWeek: number;
  period: number;
  subjectCode: string;
  subjectName: string;
  startTime: string;
  endTime: string;
}

const StaffDutyScheduleSchema = new Schema<IStaffDutySchedule>({
  staffId: { type: String, required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  period: { type: Number, required: true, min: 1, max: 10 },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { timestamps: true });

StaffDutyScheduleSchema.index({ staffId: 1, dayOfWeek: 1 });

export const StaffDutySchedule = mongoose.model<IStaffDutySchedule>("StaffDutySchedule", StaffDutyScheduleSchema);
