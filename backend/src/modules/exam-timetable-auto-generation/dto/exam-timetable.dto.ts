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
