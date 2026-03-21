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
