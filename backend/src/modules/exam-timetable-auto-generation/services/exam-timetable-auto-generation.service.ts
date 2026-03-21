import { randomUUID } from "node:crypto";
import { db } from "../../../config/db.js";
import type {
  CreateExamStudentApplicationDto,
  CreateExamDto,
  CreateInvigilationApplicationDto,
  DecideExamStudentApplicationDto,
  DecideInvigilationApplicationDto,
  GenerateAdvancedTimetableDto,
  CreateSubjectDto,
  GenerateTimetableDto,
  SendReminderNotificationsDto,
  TimetableSimulationDto,
  UpdateExamDto,
  UpdateExamSessionDto,
  UpdateSubjectDto,
} from "../dto/exam-timetable.dto.js";
import type {
  Exam,
  ExamSession,
  ExamStudentApplication,
  InvigilationApplication,
  Subject,
  TimetableRun,
} from "../entities/exam-timetable.entity.js";

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

function mapExamStudentApplication(row: any): ExamStudentApplication {
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    status: row.status,
    noticeText: row.notice_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvigilationApplication(row: any): InvigilationApplication {
  return {
    id: row.id,
    examId: row.exam_id,
    staffId: row.staff_id,
    status: row.status,
    motivation: row.motivation,
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

function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return !(endA <= startB || startA >= endB);
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

  async createStudentExamApplication(studentId: string, input: CreateExamStudentApplicationDto): Promise<ExamStudentApplication> {
    const isStudent = await db.query(
      `select id from users where id = $1 and role = 'student' and status = 'active' limit 1`,
      [studentId],
    );

    if (!isStudent.rowCount) {
      throw new Error("Only active students can apply for exams");
    }

    const examExists = await db.query(`select id from exams where id = $1 limit 1`, [input.examId]);
    if (!examExists.rowCount) {
      throw new Error("Exam not found");
    }

    const result = await db.query(
      `insert into exam_student_applications (id, exam_id, student_id, status, notice_text)
       values ($1, $2, $3, 'pending', $4)
       on conflict (exam_id, student_id)
       do update set
         status = 'pending',
         notice_text = excluded.notice_text,
         updated_at = now()
       returning id, exam_id, student_id, status, notice_text, created_at, updated_at`,
      [randomUUID(), input.examId, studentId, input.noticeText ?? null],
    );

    return mapExamStudentApplication(result.rows[0]);
  }

  async listStudentExamApplications(status?: string): Promise<ExamStudentApplication[]> {
    const values: string[] = [];
    let where = "";
    if (status) {
      values.push(status);
      where = `where status = $${values.length}`;
    }

    const result = await db.query(
      `select id, exam_id, student_id, status, notice_text, created_at, updated_at
       from exam_student_applications
       ${where}
       order by created_at desc`,
      values,
    );

    return result.rows.map(mapExamStudentApplication);
  }

  async decideStudentExamApplication(id: string, input: DecideExamStudentApplicationDto): Promise<ExamStudentApplication | null> {
    const result = await db.query(
      `update exam_student_applications
       set status = $1, updated_at = now()
       where id = $2
       returning id, exam_id, student_id, status, notice_text, created_at, updated_at`,
      [input.status, id],
    );

    return result.rowCount ? mapExamStudentApplication(result.rows[0]) : null;
  }

  async createInvigilationApplication(staffId: string, input: CreateInvigilationApplicationDto): Promise<InvigilationApplication> {
    const isStaff = await db.query(
      `select id from users where id = $1 and role in ('staff', 'admin') and status = 'active' limit 1`,
      [staffId],
    );

    if (!isStaff.rowCount) {
      throw new Error("Only active staff can apply for invigilation");
    }

    const examExists = await db.query(`select id from exams where id = $1 limit 1`, [input.examId]);
    if (!examExists.rowCount) {
      throw new Error("Exam not found");
    }

    const result = await db.query(
      `insert into invigilation_applications (id, exam_id, staff_id, status, motivation)
       values ($1, $2, $3, 'pending', $4)
       on conflict (exam_id, staff_id)
       do update set
         status = 'pending',
         motivation = excluded.motivation,
         updated_at = now()
       returning id, exam_id, staff_id, status, motivation, created_at, updated_at`,
      [randomUUID(), input.examId, staffId, input.motivation ?? null],
    );

    return mapInvigilationApplication(result.rows[0]);
  }

  async listInvigilationApplications(status?: string): Promise<InvigilationApplication[]> {
    const values: string[] = [];
    let where = "";
    if (status) {
      values.push(status);
      where = `where status = $${values.length}`;
    }

    const result = await db.query(
      `select id, exam_id, staff_id, status, motivation, created_at, updated_at
       from invigilation_applications
       ${where}
       order by created_at desc`,
      values,
    );

    return result.rows.map(mapInvigilationApplication);
  }

  async decideInvigilationApplication(id: string, input: DecideInvigilationApplicationDto): Promise<InvigilationApplication | null> {
    const result = await db.query(
      `update invigilation_applications
       set status = $1, updated_at = now()
       where id = $2
       returning id, exam_id, staff_id, status, motivation, created_at, updated_at`,
      [input.status, id],
    );

    return result.rowCount ? mapInvigilationApplication(result.rows[0]) : null;
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

  async generateAdvancedTimetable(
    input: GenerateAdvancedTimetableDto,
  ): Promise<{ run: TimetableRun; sessions: ExamSession[]; unassignedInvigilationExamIds: string[] }> {
    const startTime = input.startTime ?? "09:00";
    const maxExamsPerDay = Math.max(1, input.maxExamsPerDay ?? 3);
    const slotGapMinutes = Math.max(0, input.slotGapMinutes ?? 20);
    const slotStrideMinutes = 180 + slotGapMinutes;

    const approvedExamApplications = await db.query(
      `select a.exam_id, a.student_id, e.duration_minutes
       from exam_student_applications a
       join exams e on e.id = a.exam_id
       where a.status = 'approved'`,
    );

    if (!approvedExamApplications.rowCount) {
      throw new Error("No approved student exam applications found.");
    }

    const hallResult = await db.query(
      `select id, capacity from halls where status = 'active' order by capacity asc`,
    );
    if (!hallResult.rowCount) {
      throw new Error("No active halls are available for timetable generation.");
    }

    const hallRows = hallResult.rows as Array<{ id: string; capacity: number }>;

    const existingHallSessionsResult = await db.query(
      `select hall_id, exam_date, start_time, end_time
       from exam_sessions
       where hall_id is not null and status <> 'cancelled' and exam_date between $1 and $2`,
      [input.dateStart, input.dateEnd],
    );

    const approvedInvigilationAppsResult = await db.query(
      `select exam_id, staff_id
       from invigilation_applications
       where status = 'approved'`,
    );

    const availabilityResult = await db.query(
      `select staff_id, available_date, start_time, end_time
       from staff_availability
       where status = 'available' and available_date between $1 and $2`,
      [input.dateStart, input.dateEnd],
    );

    const existingStaffAssignmentsResult = await db.query(
      `select sa.staff_id, es.exam_date, es.start_time, es.end_time
       from staff_assignments sa
       join exam_sessions es on es.id = sa.exam_session_id
       where sa.status <> 'cancelled' and es.exam_date between $1 and $2`,
      [input.dateStart, input.dateEnd],
    );

    const examPlans = new Map<string, { examId: string; durationMinutes: number; studentIds: Set<string> }>();
    for (const row of approvedExamApplications.rows as Array<{ exam_id: string; student_id: string; duration_minutes: number }>) {
      const existing = examPlans.get(row.exam_id) ?? {
        examId: row.exam_id,
        durationMinutes: Number(row.duration_minutes),
        studentIds: new Set<string>(),
      };
      existing.studentIds.add(row.student_id);
      examPlans.set(row.exam_id, existing);
    }

    const sortedPlans = [...examPlans.values()].sort((a, b) => b.studentIds.size - a.studentIds.size);

    const hallBusy = [...existingHallSessionsResult.rows].map((row: any) => ({
      hallId: row.hall_id as string,
      examDate: String(row.exam_date).slice(0, 10),
      startTime: row.start_time as string,
      endTime: row.end_time as string,
    }));

    const studentSchedules = new Map<string, Array<{ examDate: string; startTime: string; endTime: string }>>();
    const invigilatorsByExam = new Map<string, string[]>();

    for (const row of approvedInvigilationAppsResult.rows as Array<{ exam_id: string; staff_id: string }>) {
      const current = invigilatorsByExam.get(row.exam_id) ?? [];
      current.push(row.staff_id);
      invigilatorsByExam.set(row.exam_id, current);
    }

    const availabilityByStaff = new Map<string, Array<{ examDate: string; startTime: string; endTime: string }>>();
    for (const row of availabilityResult.rows as Array<{ staff_id: string; available_date: string; start_time: string; end_time: string }>) {
      const current = availabilityByStaff.get(row.staff_id) ?? [];
      current.push({
        examDate: String(row.available_date).slice(0, 10),
        startTime: row.start_time,
        endTime: row.end_time,
      });
      availabilityByStaff.set(row.staff_id, current);
    }

    const staffSchedules = new Map<string, Array<{ examDate: string; startTime: string; endTime: string }>>();
    for (const row of existingStaffAssignmentsResult.rows as Array<{ staff_id: string; exam_date: string; start_time: string; end_time: string }>) {
      const current = staffSchedules.get(row.staff_id) ?? [];
      current.push({
        examDate: String(row.exam_date).slice(0, 10),
        startTime: row.start_time,
        endTime: row.end_time,
      });
      staffSchedules.set(row.staff_id, current);
    }

    const days: string[] = [];
    let cursor = new Date(input.dateStart);
    const endDate = new Date(input.dateEnd);
    while (cursor <= endDate) {
      days.push(toDateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const client = await db.connect();
    try {
      await client.query("begin");

      const runId = randomUUID();
      const runResult = await client.query(
        `insert into timetable_runs (id, date_start, date_end, rules_used, created_by, status)
         values ($1, $2, $3, $4::jsonb, $5, 'active')
         returning id, date_start, date_end, rules_used, created_by, status, created_at`,
        [
          runId,
          input.dateStart,
          input.dateEnd,
          JSON.stringify({ mode: "advanced", startTime, maxExamsPerDay, slotGapMinutes }),
          input.createdBy,
        ],
      );

      const sessions: ExamSession[] = [];
      const unassignedInvigilationExamIds: string[] = [];

      for (const plan of sortedPlans) {
        let selected:
          | {
              examDate: string;
              startTime: string;
              endTime: string;
              hallId: string;
            }
          | undefined;

        for (const day of days) {
          for (let slot = 0; slot < maxExamsPerDay; slot += 1) {
            const candidateStart = addMinutes(startTime, slot * slotStrideMinutes);
            const candidateEnd = addMinutes(candidateStart, plan.durationMinutes);

            let hasStudentClash = false;
            for (const studentId of plan.studentIds) {
              const schedule = studentSchedules.get(studentId) ?? [];
              const clash = schedule.some(
                (item) => item.examDate === day && overlaps(item.startTime, item.endTime, candidateStart, candidateEnd),
              );
              if (clash) {
                hasStudentClash = true;
                break;
              }
            }

            if (hasStudentClash) {
              continue;
            }

            const freeHall = hallRows.find((hall) => {
              const busy = hallBusy.some(
                (item) =>
                  item.hallId === hall.id &&
                  item.examDate === day &&
                  overlaps(item.startTime, item.endTime, candidateStart, candidateEnd),
              );
              return !busy;
            });

            if (!freeHall) {
              continue;
            }

            selected = {
              examDate: day,
              startTime: candidateStart,
              endTime: candidateEnd,
              hallId: freeHall.id,
            };
            break;
          }

          if (selected) {
            break;
          }
        }

        if (!selected) {
          throw new Error(`Unable to place exam ${plan.examId} without clashes in the selected window.`);
        }

        const sessionResult = await client.query(
          `insert into exam_sessions (
             id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status
           )
           values ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
           returning id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status, created_at, updated_at`,
          [randomUUID(), runId, plan.examId, selected.hallId, selected.examDate, selected.startTime, selected.endTime],
        );

        const session = mapSession(sessionResult.rows[0]);
        sessions.push(session);

        await client.query(
          `insert into hall_bookings (id, hall_id, exam_session_id, status)
           values ($1, $2, $3, 'booked')
           on conflict do nothing`,
          [randomUUID(), selected.hallId, session.id],
        );

        hallBusy.push({
          hallId: selected.hallId,
          examDate: selected.examDate,
          startTime: selected.startTime,
          endTime: selected.endTime,
        });

        for (const studentId of plan.studentIds) {
          const schedule = studentSchedules.get(studentId) ?? [];
          schedule.push({
            examDate: selected.examDate,
            startTime: selected.startTime,
            endTime: selected.endTime,
          });
          studentSchedules.set(studentId, schedule);
        }

        const examInvigilators = invigilatorsByExam.get(plan.examId) ?? [];
        let assignedStaffId: string | null = null;

        for (const staffId of examInvigilators) {
          const staffAvailability = availabilityByStaff.get(staffId) ?? [];
          const available = staffAvailability.some(
            (slot) =>
              slot.examDate === selected.examDate &&
              slot.startTime <= selected.startTime &&
              slot.endTime >= selected.endTime,
          );

          if (!available) {
            continue;
          }

          const staffSchedule = staffSchedules.get(staffId) ?? [];
          const hasClash = staffSchedule.some(
            (item) =>
              item.examDate === selected.examDate &&
              overlaps(item.startTime, item.endTime, selected!.startTime, selected!.endTime),
          );

          if (hasClash) {
            continue;
          }

          assignedStaffId = staffId;
          break;
        }

        if (assignedStaffId) {
          await client.query(
            `insert into staff_assignments (id, exam_session_id, staff_id, role_in_session, status)
             values ($1, $2, $3, 'invigilator', 'assigned')`,
            [randomUUID(), session.id, assignedStaffId],
          );

          const schedule = staffSchedules.get(assignedStaffId) ?? [];
          schedule.push({
            examDate: selected.examDate,
            startTime: selected.startTime,
            endTime: selected.endTime,
          });
          staffSchedules.set(assignedStaffId, schedule);
        } else {
          unassignedInvigilationExamIds.push(plan.examId);
        }
      }

      await client.query("commit");
      return {
        run: mapRun(runResult.rows[0]),
        sessions,
        unassignedInvigilationExamIds,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async sendFreeNotification(
    kind: string,
    recipient: string,
    entityKey: string,
    title: string,
    message: string,
    payload: Record<string, unknown>,
  ): Promise<{ sent: boolean; externalRef?: string }> {
    const duplicate = await db.query(
      `select id from notification_logs where kind = $1 and recipient = $2 and entity_key = $3 limit 1`,
      [kind, recipient, entityKey],
    );

    if (duplicate.rowCount) {
      return { sent: false };
    }

    const ntfyBaseUrl = (process.env.NTFY_BASE_URL ?? "https://ntfy.sh").replace(/\/$/, "");
    const ntfyTopicPrefix = process.env.NTFY_TOPIC_PREFIX ?? "ttble-demo";
    const safeRecipient = recipient.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const topic = `${ntfyTopicPrefix}-${safeRecipient}`;

    let externalRef = "";
    const response = await fetch(`${ntfyBaseUrl}/${topic}`, {
      method: "POST",
      headers: {
        Title: title,
        Tags: "memo,calendar",
      },
      body: message,
    });

    if (!response.ok) {
      throw new Error(`Notification send failed for ${recipient}`);
    }

    externalRef = await response.text();

    await db.query(
      `insert into notification_logs (id, kind, recipient, entity_key, channel, payload_json, external_ref)
       values ($1, $2, $3, $4, 'ntfy', $5::jsonb, $6)`,
      [randomUUID(), kind, recipient, entityKey, JSON.stringify(payload), externalRef.slice(0, 250)],
    );

    return { sent: true, externalRef };
  }

  async notifyTimetablePublished(runId: string): Promise<{ studentsNotified: number; invigilatorsNotified: number; skipped: number }> {
    const sessions = await db.query(
      `select es.id as session_id, es.exam_date, es.start_time, es.end_time,
              s.code as subject_code, s.name as subject_name, h.name as hall_name, e.id as exam_id
       from exam_sessions es
       join exams e on e.id = es.exam_id
       join subjects s on s.id = e.subject_id
       left join halls h on h.id = es.hall_id
       where es.timetable_run_id = $1
       order by es.exam_date, es.start_time`,
      [runId],
    );

    if (!sessions.rowCount) {
      throw new Error("Timetable run has no sessions");
    }

    const studentTargets = await db.query(
      `select distinct u.email, u.full_name, a.student_id, a.exam_id
       from exam_student_applications a
       join users u on u.id = a.student_id
       where a.status = 'approved' and a.exam_id = any($1::uuid[])`,
      [sessions.rows.map((row: any) => row.exam_id)],
    );

    const staffTargets = await db.query(
      `select distinct u.email, u.full_name, sa.staff_id, es.id as session_id
       from staff_assignments sa
       join users u on u.id = sa.staff_id
       join exam_sessions es on es.id = sa.exam_session_id
       where es.timetable_run_id = $1 and sa.status <> 'cancelled'`,
      [runId],
    );

    let studentsNotified = 0;
    let invigilatorsNotified = 0;
    let skipped = 0;

    const sessionsByExam = new Map<string, any>();
    for (const row of sessions.rows as any[]) {
      sessionsByExam.set(row.exam_id, row);
    }

    for (const row of studentTargets.rows as any[]) {
      const session = sessionsByExam.get(row.exam_id);
      if (!session) {
        skipped += 1;
        continue;
      }

      const result = await this.sendFreeNotification(
        "timetable-published-student",
        row.email,
        `${runId}:${row.exam_id}`,
        "Exam Timetable Published",
        `Hello ${row.full_name}, your exam ${session.subject_code} (${session.subject_name}) is scheduled on ${String(session.exam_date).slice(0, 10)} from ${session.start_time} to ${session.end_time} at ${session.hall_name ?? "TBA"}.`,
        {
          runId,
          examId: row.exam_id,
          audience: "student",
        },
      );
      if (result.sent) {
        studentsNotified += 1;
      } else {
        skipped += 1;
      }
    }

    for (const row of staffTargets.rows as any[]) {
      const session = sessions.rows.find((item: any) => item.session_id === row.session_id);
      if (!session) {
        skipped += 1;
        continue;
      }

      const result = await this.sendFreeNotification(
        "timetable-published-invigilator",
        row.email,
        `${runId}:${row.session_id}`,
        "Invigilation Assignment Published",
        `Hello ${row.full_name}, you are assigned to invigilate ${session.subject_code} (${session.subject_name}) on ${String(session.exam_date).slice(0, 10)} from ${session.start_time} to ${session.end_time} at ${session.hall_name ?? "TBA"}.`,
        {
          runId,
          sessionId: row.session_id,
          audience: "invigilator",
        },
      );
      if (result.sent) {
        invigilatorsNotified += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      studentsNotified,
      invigilatorsNotified,
      skipped,
    };
  }

  async sendReminderNotifications(input: SendReminderNotificationsDto): Promise<{ remindersSent: number; skipped: number }> {
    const hoursBefore = input.hoursBefore ?? 24;
    const upcomingSessions = await db.query(
      `select es.id as session_id, es.exam_id, es.exam_date, es.start_time, es.end_time, s.code as subject_code
       from exam_sessions es
       join exams e on e.id = es.exam_id
       join subjects s on s.id = e.subject_id
       where es.timetable_run_id = $1
         and (es.exam_date + es.start_time) between now() and now() + (($2::text || ' hours')::interval)
         and es.status <> 'cancelled'
       order by es.exam_date, es.start_time`,
      [input.runId, hoursBefore],
    );

    let remindersSent = 0;
    let skipped = 0;

    for (const session of upcomingSessions.rows as any[]) {
      const students = await db.query(
        `select distinct u.email, u.full_name
         from exam_student_applications a
         join users u on u.id = a.student_id
         where a.status = 'approved' and a.exam_id = $1`,
        [session.exam_id],
      );

      const staff = await db.query(
        `select distinct u.email, u.full_name
         from staff_assignments sa
         join users u on u.id = sa.staff_id
         where sa.exam_session_id = $1 and sa.status <> 'cancelled'`,
        [session.session_id],
      );

      for (const student of students.rows as any[]) {
        const result = await this.sendFreeNotification(
          "student-reminder",
          student.email,
          String(session.session_id),
          "Exam Reminder",
          `Reminder: ${session.subject_code} exam starts at ${session.start_time} on ${String(session.exam_date).slice(0, 10)}.`,
          { runId: input.runId, sessionId: session.session_id, audience: "student" },
        );
        if (result.sent) {
          remindersSent += 1;
        } else {
          skipped += 1;
        }
      }

      for (const lecturer of staff.rows as any[]) {
        const result = await this.sendFreeNotification(
          "invigilator-reminder",
          lecturer.email,
          String(session.session_id),
          "Invigilation Reminder",
          `Reminder: You have invigilation duty for ${session.subject_code} at ${session.start_time} on ${String(session.exam_date).slice(0, 10)}.`,
          { runId: input.runId, sessionId: session.session_id, audience: "invigilator" },
        );
        if (result.sent) {
          remindersSent += 1;
        } else {
          skipped += 1;
        }
      }
    }

    return { remindersSent, skipped };
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
