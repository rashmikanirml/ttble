export interface Subject {
  id: string;
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  examType: string;
  durationMinutes: number;
  studentCohort: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableRun {
  id: string;
  dateStart: string;
  dateEnd: string;
  rulesUsed: Record<string, unknown>;
  createdBy: string;
  status: string;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ExamStudentApplication {
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
