import { apiFetch } from "../../../lib/api";
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
