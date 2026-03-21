export interface CreateSubjectDto {
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
}

export interface UpdateSubjectDto {
  code?: string;
  name?: string;
  yearNo?: number;
  semesterNo?: number;
}

export interface CreateExamDto {
  subjectId: string;
  examType: string;
  durationMinutes: number;
  studentCohort: string;
}

export interface UpdateExamDto {
  examType?: string;
  durationMinutes?: number;
  studentCohort?: string;
}

export interface GenerateTimetableDto {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  maxExamsPerDay?: number;
  startTime?: string;
}

export interface UpdateExamSessionDto {
  examDate?: string;
  startTime?: string;
  endTime?: string;
  hallId?: string | null;
  status?: string;
}

export interface TimetableSimulationDto {
  dateStart: string;
  dateEnd: string;
  totalExams: number;
  maxExamsPerDay: number;
}

export interface CreateExamStudentApplicationDto {
  examId: string;
  noticeText?: string;
}

export interface DecideExamStudentApplicationDto {
  status: "approved" | "rejected";
}

export interface CreateInvigilationApplicationDto {
  examId: string;
  motivation?: string;
}

export interface DecideInvigilationApplicationDto {
  status: "approved" | "rejected";
}

export interface GenerateAdvancedTimetableDto {
  dateStart: string;
  dateEnd: string;
  createdBy: string;
  startTime?: string;
  maxExamsPerDay?: number;
  slotGapMinutes?: number;
}

export interface SendReminderNotificationsDto {
  runId: string;
  hoursBefore?: number;
}
