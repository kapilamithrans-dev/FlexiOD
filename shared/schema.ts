import { z } from "zod";

// User roles
export const UserRole = {
  STUDENT: "student",
  STAFF: "staff",
  ADMIN: "admin",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// User schema
export const userSchema = z.object({
  _id: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["student", "staff", "admin"]),
  rollNumber: z.string().optional(), // For students
  department: z.string().optional(),
  subjects: z.array(z.string()).optional(), // For staff - subjects they teach
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "_id">;

// Subject schema
export const subjectSchema = z.object({
  _id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  department: z.string(),
});

export type Subject = z.infer<typeof subjectSchema>;

// Student-Staff mapping (which students are under which staff for which subject)
export const studentStaffMappingSchema = z.object({
  _id: z.string().optional(),
  studentId: z.string(),
  staffId: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
});

export type StudentStaffMapping = z.infer<typeof studentStaffMappingSchema>;

// Timetable entry
export const timetableEntrySchema = z.object({
  _id: z.string().optional(),
  studentId: z.string(),
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  period: z.number().min(1).max(10),
  subjectCode: z.string(),
  subjectName: z.string(),
  staffId: z.string(),
  staffName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export type TimetableEntry = z.infer<typeof timetableEntrySchema>;

// Staff duty schedule
export const staffDutyScheduleSchema = z.object({
  _id: z.string().optional(),
  staffId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  period: z.number().min(1).max(10),
  subjectCode: z.string(),
  subjectName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export type StaffDutySchedule = z.infer<typeof staffDutyScheduleSchema>;

// OD Request status
export const ODStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ODStatusType = (typeof ODStatus)[keyof typeof ODStatus];

// OD Request staff approval
export const staffApprovalSchema = z.object({
  staffId: z.string(),
  staffName: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  remarks: z.string().optional(),
  respondedAt: z.string().optional(),
});

export type StaffApproval = z.infer<typeof staffApprovalSchema>;

// OD Request schema
export const odRequestSchema = z.object({
  _id: z.string().optional(),
  studentId: z.string(),
  studentName: z.string(),
  studentRollNumber: z.string(),
  dates: z.array(z.string()), // Array of date strings (YYYY-MM-DD)
  reason: z.string().min(1, "Reason is required"),
  proofPdfPath: z.string().optional(),
  staffApprovals: z.array(staffApprovalSchema),
  overallStatus: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ODRequest = z.infer<typeof odRequestSchema>;
export type InsertODRequest = Omit<ODRequest, "_id" | "createdAt" | "updatedAt">;

// Attendance record
export const attendanceRecordSchema = z.object({
  _id: z.string().optional(),
  studentId: z.string(),
  staffId: z.string(),
  subjectCode: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent", "od"]),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// Attendance summary (computed)
export const attendanceSummarySchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  studentRollNumber: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
  totalClasses: z.number(),
  attended: z.number(),
  odCount: z.number(),
  percentage: z.number(),
});

export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = userSchema.omit({ _id: true }).extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;

// File upload response
export interface FileUploadResponse {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  errors?: string[];
}

// OD Request form
export const odRequestFormSchema = z.object({
  dates: z.array(z.date()).min(1, "Select at least one date"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  proofFile: z.any().optional(),
});

export type ODRequestFormData = z.infer<typeof odRequestFormSchema>;
