export interface CreateStaffAvailabilityDto {
  staffId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status?: "available" | "unavailable";
}

export interface UpdateStaffAvailabilityDto {
  availableDate?: string;
  startTime?: string;
  endTime?: string;
  status?: "available" | "unavailable";
}

export interface CreateStaffAssignmentDto {
  examSessionId: string;
  staffId: string;
  roleInSession: "invigilator" | "supervisor" | "LIC" | "support";
  status?: "assigned" | "confirmed" | "cancelled";
}

export interface UpdateStaffAssignmentDto {
  staffId?: string;
  roleInSession?: "invigilator" | "supervisor" | "LIC" | "support";
  status?: "assigned" | "confirmed" | "cancelled";
}

export interface CreateRepeatProRataApplicationDto {
  studentId: string;
  subjectId?: string;
  examId?: string;
  applicationType: "repeat" | "pro-rata";
  reason?: string;
}

export interface DecisionApplicationDto {
  approverId: string;
  decision: "approved" | "rejected";
  decisionNote?: string;
}
