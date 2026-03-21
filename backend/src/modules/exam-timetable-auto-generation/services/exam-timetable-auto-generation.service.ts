import { randomUUID } from "node:crypto";
import { db } from "../../../config/db.js";
import type {
  CreateExamDto,
  CreateSubjectDto,
  GenerateTimetableDto,
  TimetableSimulationDto,
  UpdateExamDto,
  UpdateExamSessionDto,
  UpdateSubjectDto,
} from "../dto/exam-timetable.dto.js";
import type { Exam, ExamSession, Subject, TimetableRun } from "../entities/exam-timetable.entity.js";

function mapSubject(row: any): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    yearNo: row.year_no,
    semesterNo: row.semester_no,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExam(row: any): Exam {
  return {
    id: row.id,
    subjectId: row.subject_id,
    examType: row.exam_type,
    durationMinutes: row.duration_minutes,
    studentCohort: row.student_cohort,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRun(row: any): TimetableRun {
  return {
    id: row.id,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    rulesUsed: row.rules_used,
    createdBy: row.created_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapSession(row: any): ExamSession {
  return {
    id: row.id,
    timetableRunId: row.timetable_run_id,
    examId: row.exam_id,
    hallId: row.hall_id,
    examDate: row.exam_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function addMinutes(baseTime: string, minutesToAdd: number): string {
  const [hour, minute] = baseTime.split(":").map((part) => Number(part));
  const total = hour * 60 + minute + minutesToAdd;
  const newHour = Math.floor(total / 60) % 24;
  const newMinute = total % 60;
  return `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}:00`;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function minutesBetween(start: string, end: string): number {
  const [startH, startM] = start.split(":").map((part) => Number(part));
  const [endH, endM] = end.split(":").map((part) => Number(part));
  return endH * 60 + endM - (startH * 60 + startM);
}

function inclusiveDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export class ExamTimetableAutoGenerationService {
  async createSubject(input: CreateSubjectDto): Promise<Subject> {
    const result = await db.query(
      `insert into subjects (id, code, name, year_no, semester_no)
       values ($1, $2, $3, $4, $5)
       returning id, code, name, year_no, semester_no, created_at, updated_at`,
      [randomUUID(), input.code, input.name, input.yearNo, input.semesterNo],
    );

    return mapSubject(result.rows[0]);
  }

  async listSubjects(): Promise<Subject[]> {
    const result = await db.query(
      `select id, code, name, year_no, semester_no, created_at, updated_at
       from subjects
       order by code`,
    );
    return result.rows.map(mapSubject);
  }

  async updateSubject(id: string, input: UpdateSubjectDto): Promise<Subject | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (input.code !== undefined) {
      values.push(input.code);
      fields.push(`code = $${values.length}`);
    }

    if (input.name !== undefined) {
      values.push(input.name);
      fields.push(`name = $${values.length}`);
    }

    if (input.yearNo !== undefined) {
      values.push(input.yearNo);
      fields.push(`year_no = $${values.length}`);
    }

    if (input.semesterNo !== undefined) {
      values.push(input.semesterNo);
      fields.push(`semester_no = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, code, name, year_no, semester_no, created_at, updated_at from subjects where id = $1`,
        [id],
      );
      return current.rowCount ? mapSubject(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update subjects
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, code, name, year_no, semester_no, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapSubject(result.rows[0]) : null;
  }

  async deleteSubject(id: string): Promise<boolean> {
    const result = await db.query("delete from subjects where id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async createExam(input: CreateExamDto): Promise<Exam> {
    const result = await db.query(
      `insert into exams (id, subject_id, exam_type, duration_minutes, student_cohort)
       values ($1, $2, $3, $4, $5)
       returning id, subject_id, exam_type, duration_minutes, student_cohort, created_at, updated_at`,
      [randomUUID(), input.subjectId, input.examType, input.durationMinutes, input.studentCohort],
    );

    return mapExam(result.rows[0]);
  }

  async listExams(): Promise<Exam[]> {
    const result = await db.query(
      `select id, subject_id, exam_type, duration_minutes, student_cohort, created_at, updated_at
       from exams
       order by created_at desc`,
    );
    return result.rows.map(mapExam);
  }

  async updateExam(id: string, input: UpdateExamDto): Promise<Exam | null> {
    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (input.examType !== undefined) {
      values.push(input.examType);
      fields.push(`exam_type = $${values.length}`);
    }

    if (input.durationMinutes !== undefined) {
      values.push(input.durationMinutes);
      fields.push(`duration_minutes = $${values.length}`);
    }

    if (input.studentCohort !== undefined) {
      values.push(input.studentCohort);
      fields.push(`student_cohort = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, subject_id, exam_type, duration_minutes, student_cohort, created_at, updated_at from exams where id = $1`,
        [id],
      );
      return current.rowCount ? mapExam(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update exams
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, subject_id, exam_type, duration_minutes, student_cohort, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapExam(result.rows[0]) : null;
  }

  async deleteExam(id: string): Promise<boolean> {
    const result = await db.query("delete from exams where id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async generateTimetable(input: GenerateTimetableDto): Promise<{ run: TimetableRun; sessions: ExamSession[] }> {
    const examsResult = await db.query(
      `select id, duration_minutes from exams order by created_at asc`,
    );

    const runId = randomUUID();
    const maxExamsPerDay = input.maxExamsPerDay ?? 3;
    const startTime = input.startTime ?? "09:00";

    const client = await db.connect();
    try {
      await client.query("begin");

      const runResult = await client.query(
        `insert into timetable_runs (id, date_start, date_end, rules_used, created_by, status)
         values ($1, $2, $3, $4::jsonb, $5, 'active')
         returning id, date_start, date_end, rules_used, created_by, status, created_at`,
        [
          runId,
          input.dateStart,
          input.dateEnd,
          JSON.stringify({ maxExamsPerDay, startTime }),
          input.createdBy,
        ],
      );

      const sessions: ExamSession[] = [];
      const currentDate = new Date(input.dateStart);
      const endDate = new Date(input.dateEnd);
      let examsOnDay = 0;

      for (const examRow of examsResult.rows) {
        if (currentDate > endDate) {
          throw new Error("Date range is too small for all exams.");
        }

        if (examsOnDay >= maxExamsPerDay) {
          currentDate.setDate(currentDate.getDate() + 1);
          examsOnDay = 0;
        }

        if (currentDate > endDate) {
          throw new Error("Date range is too small for all exams.");
        }

        const offsetMinutes = examsOnDay * 180;
        const start = addMinutes(startTime, offsetMinutes);
        const end = addMinutes(startTime, offsetMinutes + Number(examRow.duration_minutes));

        const sessionResult = await client.query(
          `insert into exam_sessions (
            id,
            timetable_run_id,
            exam_id,
            hall_id,
            exam_date,
            start_time,
            end_time,
            status
           )
           values ($1, $2, $3, null, $4, $5, $6, 'scheduled')
           returning id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status, created_at, updated_at`,
          [randomUUID(), runId, examRow.id, toDateString(currentDate), start, end],
        );

        sessions.push(mapSession(sessionResult.rows[0]));
        examsOnDay += 1;
      }

      await client.query("commit");
      return {
        run: mapRun(runResult.rows[0]),
        sessions,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getTimetableRunWithSessions(id: string): Promise<{ run: TimetableRun; sessions: ExamSession[] } | null> {
    const runResult = await db.query(
      `select id, date_start, date_end, rules_used, created_by, status, created_at
       from timetable_runs
       where id = $1`,
      [id],
    );

    if (!runResult.rowCount) {
      return null;
    }

    const sessionsResult = await db.query(
      `select id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status, created_at, updated_at
       from exam_sessions
       where timetable_run_id = $1
       order by exam_date, start_time`,
      [id],
    );

    return {
      run: mapRun(runResult.rows[0]),
      sessions: sessionsResult.rows.map(mapSession),
    };
  }

  async updateExamSession(id: string, input: UpdateExamSessionDto): Promise<ExamSession | null> {
    const fields: string[] = [];
    const values: Array<string | null> = [];

    if (input.examDate !== undefined) {
      values.push(input.examDate);
      fields.push(`exam_date = $${values.length}`);
    }

    if (input.startTime !== undefined) {
      values.push(input.startTime);
      fields.push(`start_time = $${values.length}`);
    }

    if (input.endTime !== undefined) {
      values.push(input.endTime);
      fields.push(`end_time = $${values.length}`);
    }

    if (input.hallId !== undefined) {
      values.push(input.hallId);
      fields.push(`hall_id = $${values.length}`);
    }

    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status, created_at, updated_at
         from exam_sessions where id = $1`,
        [id],
      );
      return current.rowCount ? mapSession(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update exam_sessions
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapSession(result.rows[0]) : null;
  }

  async getTimetableAiInsights(runId: string): Promise<{
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
  } | null> {
    const runResult = await db.query(
      `select id, date_start, date_end from timetable_runs where id = $1`,
      [runId],
    );

    if (!runResult.rowCount) {
      return null;
    }

    const sessionsResult = await db.query(
      `select es.exam_date, es.start_time, es.end_time, e.duration_minutes
       from exam_sessions es
       join exams e on e.id = es.exam_id
       where es.timetable_run_id = $1
       order by es.exam_date, es.start_time`,
      [runId],
    );

    const sessions = sessionsResult.rows;
    const totalSessions = sessions.length;
    const totalDays = Math.max(1, inclusiveDays(runResult.rows[0].date_start, runResult.rows[0].date_end));
    const examsPerDay = Number((totalSessions / totalDays).toFixed(2));

    const durationTotal = sessions.reduce((sum: number, row: any) => sum + Number(row.duration_minutes), 0);
    const avgDurationMinutes = totalSessions ? Math.round(durationTotal / totalSessions) : 0;

    const sessionsByDay = new Map<string, Array<{ start: string; end: string }>>();
    for (const row of sessions) {
      const day = row.exam_date as string;
      if (!sessionsByDay.has(day)) {
        sessionsByDay.set(day, []);
      }
      sessionsByDay.get(day)!.push({ start: row.start_time, end: row.end_time });
    }

    let tightTransitionCount = 0;
    let overloadedDays = 0;

    for (const [, daySessions] of sessionsByDay) {
      if (daySessions.length >= 4) {
        overloadedDays += 1;
      }
      daySessions.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < daySessions.length; i += 1) {
        const gap = minutesBetween(daySessions[i - 1].end, daySessions[i].start);
        if (gap < 20) {
          tightTransitionCount += 1;
        }
      }
    }

    let riskScore = 20;
    riskScore += Math.min(35, overloadedDays * 8);
    riskScore += Math.min(25, tightTransitionCount * 5);
    if (avgDurationMinutes > 150) {
      riskScore += 12;
    }
    riskScore = Math.max(0, Math.min(100, riskScore));

    const schedulePressure = riskScore >= 70 ? "high" : riskScore >= 45 ? "medium" : "low";
    const recommendations: string[] = [];

    if (overloadedDays > 0) {
      recommendations.push("Redistribute sessions to reduce days with 4 or more exams.");
    }
    if (tightTransitionCount > 0) {
      recommendations.push("Increase buffer time between sessions to at least 20 minutes.");
    }
    if (avgDurationMinutes > 150) {
      recommendations.push("Prioritize longer exams in morning slots to reduce fatigue risk.");
    }
    if (!recommendations.length) {
      recommendations.push("Current schedule quality looks healthy. Monitor hall and staff assignment constraints.");
    }

    return {
      runId,
      riskScore,
      schedulePressure,
      kpis: {
        totalSessions,
        totalDays,
        avgDurationMinutes,
        examsPerDay,
      },
      recommendations,
    };
  }

  simulateTimetablePlan(input: TimetableSimulationDto): {
    feasible: boolean;
    confidenceScore: number;
    requiredDays: number;
    availableDays: number;
    schedulePressure: "low" | "medium" | "high";
    notes: string[];
  } {
    const availableDays = Math.max(0, inclusiveDays(input.dateStart, input.dateEnd));
    const maxPerDay = Math.max(1, input.maxExamsPerDay);
    const requiredDays = Math.ceil(input.totalExams / maxPerDay);
    const feasible = requiredDays <= availableDays;

    const ratio = availableDays > 0 ? requiredDays / availableDays : 2;
    const pressure = ratio > 0.9 ? "high" : ratio > 0.65 ? "medium" : "low";

    let confidenceScore = 95;
    confidenceScore -= Math.round(Math.max(0, ratio - 0.5) * 70);
    if (!feasible) {
      confidenceScore = Math.max(5, confidenceScore - 35);
    }
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    const notes: string[] = [];
    if (!feasible) {
      notes.push("Date range is insufficient for the requested exam volume.");
    }
    if (pressure === "high") {
      notes.push("Schedule pressure is high. Consider extending the date range or raising max exams/day.");
    }
    if (pressure === "low") {
      notes.push("Plan has healthy time buffers and should be easier to optimize.");
    }

    return {
      feasible,
      confidenceScore,
      requiredDays,
      availableDays,
      schedulePressure: pressure,
      notes,
    };
  }
}
