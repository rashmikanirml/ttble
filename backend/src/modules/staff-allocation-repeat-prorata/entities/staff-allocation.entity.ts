export interface StaffAvailability {
  id: string;
  staffId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status: "available" | "unavailable";
  createdAt: string;
  updatedAt: string;
}

export interface StaffAssignment {
  id: string;
  examSessionId: string;
  staffId: string;
  roleInSession: "invigilator" | "supervisor" | "LIC" | "support";
  status: "assigned" | "confirmed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface RepeatProRataApplication {
  id: string;
  studentId: string;
  subjectId: string | null;
  examId: string | null;
  applicationType: "repeat" | "pro-rata";
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  applicationId: string;
  approverId: string;
  decision: "approved" | "rejected";
  decisionNote: string | null;
  createdAt: string;
}
