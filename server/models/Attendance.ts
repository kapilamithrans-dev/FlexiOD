import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceRecord extends Document {
  studentId: string;
  staffId: string;
  subjectCode: string;
  date: string;
  status: "present" | "absent" | "od";
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  studentId: { type: String, required: true, index: true },
  staffId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, required: true, enum: ["present", "absent", "od"] },
}, { timestamps: true });

AttendanceRecordSchema.index({ studentId: 1, staffId: 1, subjectCode: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema);
