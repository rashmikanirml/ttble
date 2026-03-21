export type UserRole = "student" | "staff" | "admin";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  userId: string;
  yearNo: number;
  semesterNo: number;
  studentType: "normal" | "repeat" | "pro-rata";
  updatedAt: string;
}

export interface StaffProfile {
  userId: string;
  staffType: "invigilator" | "supervisor" | "LIC" | "support";
  availabilityNotes: string | null;
  updatedAt: string;
}
