import type {
  RepeatProRataApplication,
  StaffAssignment,
  StaffAvailability,
} from "../types/models";

const API_BASE = "http://localhost:4000/api";

export async function listAvailability(): Promise<StaffAvailability[]> {
  const response = await fetch(`${API_BASE}/staff-availability`);
  if (!response.ok) {
    throw new Error("Failed to fetch availability");
  }
  return response.json() as Promise<StaffAvailability[]>;
}

export async function createAvailability(payload: {
  staffId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status?: "available" | "unavailable";
}): Promise<StaffAvailability> {
  const response = await fetch(`${API_BASE}/staff-availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create availability");
  }
  return response.json() as Promise<StaffAvailability>;
}

export async function listAssignments(): Promise<StaffAssignment[]> {
  const response = await fetch(`${API_BASE}/staff-assignments`);
  if (!response.ok) {
    throw new Error("Failed to fetch assignments");
  }
  return response.json() as Promise<StaffAssignment[]>;
}

export async function createAssignment(payload: {
  examSessionId: string;
  staffId: string;
  roleInSession: "invigilator" | "supervisor" | "LIC" | "support";
  status?: "assigned" | "confirmed" | "cancelled";
}): Promise<StaffAssignment> {
  const response = await fetch(`${API_BASE}/staff-assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create assignment");
  }
  return response.json() as Promise<StaffAssignment>;
}

export async function listApplications(): Promise<RepeatProRataApplication[]> {
  const response = await fetch(`${API_BASE}/repeat-prorata-applications`);
  if (!response.ok) {
    throw new Error("Failed to fetch applications");
  }
  return response.json() as Promise<RepeatProRataApplication[]>;
}

export async function createApplication(payload: {
  studentId: string;
  subjectId?: string;
  examId?: string;
  applicationType: "repeat" | "pro-rata";
  reason?: string;
}): Promise<RepeatProRataApplication> {
  const response = await fetch(`${API_BASE}/repeat-prorata-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create application");
  }
  return response.json() as Promise<RepeatProRataApplication>;
}

export async function decideApplication(
  applicationId: string,
  payload: { approverId: string; decision: "approved" | "rejected"; decisionNote?: string },
): Promise<void> {
  const response = await fetch(`${API_BASE}/repeat-prorata-applications/${applicationId}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update decision");
  }
}
