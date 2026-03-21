import type {
  Exam,
  ExamApplication,
  Subject,
  TimetableAiInsights,
  TimetableAdvancedGenerationResult,
  TimetableGenerationResult,
  TimetableNotificationResult,
  TimetableReminderResult,
  TimetableSimulationResult,
  InvigilationApplication,
} from "../types/models";
import { apiFetch } from "../../../lib/api";

export async function listSubjects(): Promise<Subject[]> {
  return apiFetch<Subject[]>("/subjects");
}

export async function createSubject(payload: {
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
}): Promise<Subject> {
  return apiFetch<Subject>("/subjects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listExams(): Promise<Exam[]> {
  return apiFetch<Exam[]>("/exams");
}

export async function createExam(payload: {
  subjectId: string;
  examType: string;
  durationMinutes: number;
  studentCohort: string;
}): Promise<Exam> {
  return apiFetch<Exam>("/exams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateTimetable(payload: {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  maxExamsPerDay?: number;
  startTime?: string;
}): Promise<TimetableGenerationResult> {
  return apiFetch<TimetableGenerationResult>("/timetable-runs/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTimetableAiInsights(runId: string): Promise<TimetableAiInsights> {
  return apiFetch<TimetableAiInsights>(`/timetable-runs/${runId}/ai-insights`);
}

export async function simulateTimetablePlan(payload: {
  dateStart: string;
  dateEnd: string;
  totalExams: number;
  maxExamsPerDay: number;
}): Promise<TimetableSimulationResult> {
  return apiFetch<TimetableSimulationResult>("/timetable-runs/ai-simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function applyForExam(payload: {
  examId: string;
  noticeText?: string;
}): Promise<ExamApplication> {
  return apiFetch<ExamApplication>("/exam-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listExamApplications(status?: string): Promise<ExamApplication[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ExamApplication[]>(`/exam-applications${suffix}`);
}

export async function applyForInvigilation(payload: {
  examId: string;
  motivation?: string;
}): Promise<InvigilationApplication> {
  return apiFetch<InvigilationApplication>("/invigilation-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listInvigilationApplications(status?: string): Promise<InvigilationApplication[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<InvigilationApplication[]>(`/invigilation-applications${suffix}`);
}

export async function generateAdvancedTimetable(payload: {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  maxExamsPerDay?: number;
  startTime?: string;
  slotGapMinutes?: number;
}): Promise<TimetableAdvancedGenerationResult> {
  return apiFetch<TimetableAdvancedGenerationResult>("/timetable-runs/generate-advanced", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function notifyTimetable(runId: string): Promise<TimetableNotificationResult> {
  return apiFetch<TimetableNotificationResult>(`/timetable-runs/${runId}/notify`, {
    method: "POST",
  });
}

export async function sendTimetableReminders(runId: string, hoursBefore = 24): Promise<TimetableReminderResult> {
  return apiFetch<TimetableReminderResult>(`/timetable-runs/${runId}/reminders`, {
    method: "POST",
    body: JSON.stringify({ hoursBefore }),
  });
}
