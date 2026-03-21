import type { Exam, Subject, TimetableGenerationResult } from "../types/models";

const API_BASE = "http://localhost:4000/api";

export async function listSubjects(): Promise<Subject[]> {
  const response = await fetch(`${API_BASE}/subjects`);
  if (!response.ok) {
    throw new Error("Failed to fetch subjects");
  }
  return response.json() as Promise<Subject[]>;
}

export async function createSubject(payload: {
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
}): Promise<Subject> {
  const response = await fetch(`${API_BASE}/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create subject");
  }
  return response.json() as Promise<Subject>;
}

export async function listExams(): Promise<Exam[]> {
  const response = await fetch(`${API_BASE}/exams`);
  if (!response.ok) {
    throw new Error("Failed to fetch exams");
  }
  return response.json() as Promise<Exam[]>;
}

export async function createExam(payload: {
  subjectId: string;
  examType: string;
  durationMinutes: number;
  studentCohort: string;
}): Promise<Exam> {
  const response = await fetch(`${API_BASE}/exams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create exam");
  }
  return response.json() as Promise<Exam>;
}

export async function generateTimetable(payload: {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  maxExamsPerDay?: number;
  startTime?: string;
}): Promise<TimetableGenerationResult> {
  const response = await fetch(`${API_BASE}/timetable-runs/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to generate timetable");
  }
  return response.json() as Promise<TimetableGenerationResult>;
}
