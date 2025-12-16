import mongoose, { Schema, Document } from "mongoose";

interface Subject {
  subjectCode: string;
  subjectName: string; // adjust to your actual field if different
  totalClasses: number;
}

export interface ISemesterSettings extends Document {
  semesterStart: Date;
  semesterEnd: Date;
  subjects: Subject[];
}

const SubjectSchema = new Schema<Subject>({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true }, // adjust field names if needed
  totalClasses: { type: Number, required: true }
});

const SemesterSettingsSchema = new Schema<ISemesterSettings>(
  {
    semesterStart: { type: Date, required: true },
    semesterEnd: { type: Date, required: true },
    subjects: [SubjectSchema]
  },
  { timestamps: true }
);

export default mongoose.model<ISemesterSettings>("SemesterSettings", SemesterSettingsSchema);