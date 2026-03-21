export interface StaffAvailability {
  id: string;
  staffId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status: "available" | "unavailable";
}

export interface StaffAssignment {
  id: string;
  examSessionId: string;
  staffId: string;
  roleInSession: "invigilator" | "supervisor" | "LIC" | "support";
  status: "assigned" | "confirmed" | "cancelled";
}

export interface RepeatProRataApplication {
  id: string;
  studentId: string;
  subjectId: string | null;
  examId: string | null;
  applicationType: "repeat" | "pro-rata";
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
}
