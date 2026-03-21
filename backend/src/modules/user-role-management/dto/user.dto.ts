import type { UserRole, UserStatus } from "../entities/user.entity.js";

export interface CreateUserDto {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpsertStudentProfileDto {
  userId: string;
  yearNo: number;
  semesterNo: number;
  studentType: "normal" | "repeat" | "pro-rata";
}

export interface UpsertStaffProfileDto {
  userId: string;
  staffType: "invigilator" | "supervisor" | "LIC" | "support";
  availabilityNotes?: string;
}
