export interface Subject {
  id: string;
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  examType: string;
  durationMinutes: number;
  studentCohort: string;
}

export interface ExamSession {
  id: string;
  timetableRunId: string;
  examId: string;
  hallId: string | null;
  examDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface TimetableGenerationResult {
  run: {
    id: string;
    dateStart: string;
    dateEnd: string;
    status: string;
  };
  sessions: ExamSession[];
}

export interface TimetableAdvancedGenerationResult {
  run: {
    id: string;
    dateStart: string;
    dateEnd: string;
    status: string;
  };
  sessions: ExamSession[];
  unassignedInvigilationExamIds: string[];
}

export interface TimetableAiInsights {
  runId: string;
  riskScore: number;
  schedulePressure: "low" | "medium" | "high";
  kpis: {
    totalSessions: number;
    totalDays: number;
    avgDurationMinutes: number;
    examsPerDay: number;
  };
  recommendations: string[];
}

export interface TimetableSimulationResult {
  feasible: boolean;
  confidenceScore: number;
  requiredDays: number;
  availableDays: number;
  schedulePressure: "low" | "medium" | "high";
  notes: string[];
}

export interface ExamApplication {
  id: string;
  examId: string;
  studentId: string;
  status: string;
  noticeText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvigilationApplication {
  id: string;
  examId: string;
  staffId: string;
  status: string;
  motivation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableNotificationResult {
  studentsNotified: number;
  invigilatorsNotified: number;
  skipped: number;
}

export interface TimetableReminderResult {
  remindersSent: number;
  skipped: number;
}
