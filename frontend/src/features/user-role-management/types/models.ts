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

export interface CreateUserPayload {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}
