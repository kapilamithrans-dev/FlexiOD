import mongoose, { Schema, Document } from "mongoose";

export interface IStaffApproval {
  staffId: string;
  staffName: string;
  subjectCode: string;
  subjectName: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  respondedAt?: Date;
}

export interface IODRequest extends Document {
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  dates: string[];
  reason: string;
  proofPdfPath?: string;
  staffApprovals: IStaffApproval[];
  overallStatus: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const StaffApprovalSchema = new Schema<IStaffApproval>({
  staffId: { type: String, required: true },
  staffName: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
  remarks: { type: String },
  respondedAt: { type: Date },
}, { _id: false });

const ODRequestSchema = new Schema<IODRequest>({
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentRollNumber: { type: String, required: true },
  dates: [{ type: String, required: true }],
  reason: { type: String, required: true },
  proofPdfPath: { type: String },
  staffApprovals: [StaffApprovalSchema],
  overallStatus: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

ODRequestSchema.index({ "staffApprovals.staffId": 1 });

export const ODRequest = mongoose.model<IODRequest>("ODRequest", ODRequestSchema);
