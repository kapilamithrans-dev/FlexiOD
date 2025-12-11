import mongoose, { Schema, Document } from "mongoose";

export interface IStudentStaffMapping extends Document {
  studentId: string;
  staffId: string;
  subjectCode: string;
  subjectName: string;
}

const StudentStaffMappingSchema = new Schema<IStudentStaffMapping>({
  studentId: { type: String, required: true, index: true },
  staffId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
}, { timestamps: true });

StudentStaffMappingSchema.index({ studentId: 1, staffId: 1, subjectCode: 1 }, { unique: true });

export const StudentStaffMapping = mongoose.model<IStudentStaffMapping>("StudentStaffMapping", StudentStaffMappingSchema);
