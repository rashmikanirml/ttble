import type {
  RepeatProRataApplication,
  StaffCalendarItem,
  StaffAssignment,
  StaffAvailability,
} from "../types/models";
import { apiFetch } from "../../../lib/api";

export async function listAvailability(): Promise<StaffAvailability[]> {
  return apiFetch<StaffAvailability[]>("/staff-availability");
}

export async function createAvailability(payload: {
  staffId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status?: "available" | "unavailable";
}): Promise<StaffAvailability> {
  return apiFetch<StaffAvailability>("/staff-availability", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAssignments(): Promise<StaffAssignment[]> {
  return apiFetch<StaffAssignment[]>("/staff-assignments");
}

export async function createAssignment(payload: {
  examSessionId: string;
  staffId: string;
  roleInSession: "invigilator" | "supervisor" | "LIC" | "support";
  status?: "assigned" | "confirmed" | "cancelled";
}): Promise<StaffAssignment> {
  return apiFetch<StaffAssignment>("/staff-assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listApplications(): Promise<RepeatProRataApplication[]> {
  return apiFetch<RepeatProRataApplication[]>("/repeat-prorata-applications");
}

export async function createApplication(payload: {
  studentId: string;
  subjectId?: string;
  examId?: string;
  applicationType: "repeat" | "pro-rata";
  reason?: string;
}): Promise<RepeatProRataApplication> {
  return apiFetch<RepeatProRataApplication>("/repeat-prorata-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function decideApplication(
  applicationId: string,
  payload: { approverId: string; decision: "approved" | "rejected"; decisionNote?: string },
): Promise<void> {
  await apiFetch<void>(`/repeat-prorata-applications/${applicationId}/decision`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getMyStaffCalendar(from?: string, to?: string): Promise<StaffCalendarItem[]> {
  const params = new URLSearchParams();
  if (from) {
    params.set("from", from);
  }
  if (to) {
    params.set("to", to);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<StaffCalendarItem[]>(`/staff-calendar/mine${suffix}`);
}
