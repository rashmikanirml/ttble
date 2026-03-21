import type {
  Exam,
  Subject,
  TimetableAiInsights,
  TimetableGenerationResult,
  TimetableSimulationResult,
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
