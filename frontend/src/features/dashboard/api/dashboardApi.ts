import { apiFetch } from "../../../lib/api";
import { getAuthToken } from "../../../lib/auth";
import { generateAdvancedTimetable, notifyTimetable, sendTimetableReminders } from "../../exam-timetable-auto-generation/api/examTimetableApi";

export type DashboardResponse = {
  signedInAs: {
    userId: string;
    role: string;
    email: string;
  };
  kpis: {
    activeUsers: number;
    subjects: number;
    exams: number;
    timetableRuns: number;
    activeHalls: number;
    pendingApplications: number;
  };
};

export function getDashboardKpis(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/dashboard/kpis");
}

export type DataSummaryResponse = {
  message: string;
  generatedAt: string;
  counts: Record<string, Record<string, number>>;
};

export function getDataSummary(): Promise<DataSummaryResponse> {
  return apiFetch<DataSummaryResponse>("/dashboard/data-summary");
}

export type HallUtilizationReport = {
  from: string;
  to: string;
  halls: Array<{
    id: string;
    code: string;
    name: string;
    capacity: number;
    session_count: number;
    occupied_hours: string;
  }>;
  generatedAt: string;
};

export type StaffWorkloadReport = {
  from: string;
  to: string;
  staff: Array<{
    staff_id: string;
    full_name: string;
    email: string;
    assigned_sessions: number;
    assigned_hours: string;
  }>;
  generatedAt: string;
};

export type SystemSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

export type InAppNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  entity_key: string | null;
  payload_json: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export function getHallUtilization(from: string, to: string): Promise<HallUtilizationReport> {
  return apiFetch<HallUtilizationReport>(
    `/reports/hall-utilization?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

export function getStaffWorkload(from: string, to: string): Promise<StaffWorkloadReport> {
  return apiFetch<StaffWorkloadReport>(
    `/reports/staff-workload?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

async function downloadReport(path: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`http://localhost:4000/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Unable to download report");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportTimetableExcel(runId: string): Promise<void> {
  return downloadReport(
    `/reports/timetable/export/excel?runId=${encodeURIComponent(runId)}`,
    `ttble-timetable-${runId}.xlsx`,
  );
}

export function exportTimetablePdf(runId: string): Promise<void> {
  return downloadReport(
    `/reports/timetable/export/pdf?runId=${encodeURIComponent(runId)}`,
    `ttble-timetable-${runId}.pdf`,
  );
}

export function listSettings(): Promise<SystemSetting[]> {
  return apiFetch<SystemSetting[]>("/settings");
}

export function updateSetting(key: string, value: unknown, description?: string): Promise<SystemSetting> {
  return apiFetch<SystemSetting>(`/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value, description }),
  });
}

export function listNotifications(): Promise<InAppNotification[]> {
  return apiFetch<InAppNotification[]>("/notifications");
}

export function markNotificationRead(notificationId: string): Promise<{ id: string; is_read: boolean; read_at: string | null }> {
  return apiFetch<{ id: string; is_read: boolean; read_at: string | null }>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function runGeneratePublishRemind(payload: {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  maxExamsPerDay: number;
  reminderHours: number;
}): Promise<{
  runId: string;
  generatedSessions: number;
  studentsNotified: number;
  invigilatorsNotified: number;
  remindersSent: number;
  unassignedInvigilationExamIds: string[];
}> {
  const generated = await generateAdvancedTimetable({
    dateStart: payload.dateStart,
    dateEnd: payload.dateEnd,
    createdBy: payload.createdBy,
    maxExamsPerDay: payload.maxExamsPerDay,
    slotGapMinutes: 20,
  });

  const notifications = await notifyTimetable(generated.run.id);
  const reminders = await sendTimetableReminders(generated.run.id, payload.reminderHours);

  return {
    runId: generated.run.id,
    generatedSessions: generated.sessions.length,
    studentsNotified: notifications.studentsNotified,
    invigilatorsNotified: notifications.invigilatorsNotified,
    remindersSent: reminders.remindersSent,
    unassignedInvigilationExamIds: generated.unassignedInvigilationExamIds,
  };
}
