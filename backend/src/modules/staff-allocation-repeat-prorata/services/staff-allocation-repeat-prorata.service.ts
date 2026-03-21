import { randomUUID } from "node:crypto";
import { db } from "../../../config/db.js";
import type {
  CreateRepeatProRataApplicationDto,
  CreateStaffAssignmentDto,
  CreateStaffAvailabilityDto,
  DecisionApplicationDto,
  UpdateStaffAssignmentDto,
  UpdateStaffAvailabilityDto,
} from "../dto/staff-allocation.dto.js";
import type {
  Approval,
  RepeatProRataApplication,
  StaffAssignment,
  StaffAvailability,
} from "../entities/staff-allocation.entity.js";

function mapAvailability(row: any): StaffAvailability {
  return {
    id: row.id,
    staffId: row.staff_id,
    availableDate: row.available_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAssignment(row: any): StaffAssignment {
  return {
    id: row.id,
    examSessionId: row.exam_session_id,
    staffId: row.staff_id,
    roleInSession: row.role_in_session,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApplication(row: any): RepeatProRataApplication {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    examId: row.exam_id,
    applicationType: row.application_type,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row: any): Approval {
  return {
    id: row.id,
    applicationId: row.application_id,
    approverId: row.approver_id,
    decision: row.decision,
    decisionNote: row.decision_note,
    createdAt: row.created_at,
  };
}

export class StaffAllocationRepeatProrataService {
  async createAvailability(input: CreateStaffAvailabilityDto): Promise<StaffAvailability> {
    const overlap = await db.query(
      `select id
       from staff_availability
       where staff_id = $1
         and available_date = $2
         and status = 'available'
         and not (end_time <= $3 or start_time >= $4)
       limit 1`,
      [input.staffId, input.availableDate, input.startTime, input.endTime],
    );

    if (overlap.rowCount) {
      throw new Error("Availability slot overlaps with existing availability");
    }

    const result = await db.query(
      `insert into staff_availability (id, staff_id, available_date, start_time, end_time, status)
       values ($1, $2, $3, $4, $5, $6)
       returning id, staff_id, available_date, start_time, end_time, status, created_at, updated_at`,
      [
        randomUUID(),
        input.staffId,
        input.availableDate,
        input.startTime,
        input.endTime,
        input.status ?? "available",
      ],
    );

    return mapAvailability(result.rows[0]);
  }

  async listAvailability(staffId?: string): Promise<StaffAvailability[]> {
    const values: string[] = [];
    let whereClause = "";

    if (staffId) {
      values.push(staffId);
      whereClause = "where staff_id = $1";
    }

    const result = await db.query(
      `select id, staff_id, available_date, start_time, end_time, status, created_at, updated_at
       from staff_availability
       ${whereClause}
       order by available_date, start_time`,
      values,
    );

    return result.rows.map(mapAvailability);
  }

  async updateAvailability(id: string, input: UpdateStaffAvailabilityDto): Promise<StaffAvailability | null> {
    const fields: string[] = [];
    const values: string[] = [];

    if (input.availableDate !== undefined) {
      values.push(input.availableDate);
      fields.push(`available_date = $${values.length}`);
    }

    if (input.startTime !== undefined) {
      values.push(input.startTime);
      fields.push(`start_time = $${values.length}`);
    }

    if (input.endTime !== undefined) {
      values.push(input.endTime);
      fields.push(`end_time = $${values.length}`);
    }

    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, staff_id, available_date, start_time, end_time, status, created_at, updated_at
         from staff_availability where id = $1`,
        [id],
      );
      return current.rowCount ? mapAvailability(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update staff_availability
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, staff_id, available_date, start_time, end_time, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapAvailability(result.rows[0]) : null;
  }

  async deleteAvailability(id: string): Promise<boolean> {
    const result = await db.query("delete from staff_availability where id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async createAssignment(input: CreateStaffAssignmentDto): Promise<StaffAssignment> {
    const sessionTimeResult = await db.query(
      `select exam_date, start_time, end_time from exam_sessions where id = $1`,
      [input.examSessionId],
    );

    if (!sessionTimeResult.rowCount) {
      throw new Error("Exam session not found");
    }

    const session = sessionTimeResult.rows[0];

    const availabilityResult = await db.query(
      `select id
       from staff_availability
       where staff_id = $1
         and available_date = $2
         and status = 'available'
         and start_time <= $3
         and end_time >= $4
       limit 1`,
      [input.staffId, session.exam_date, session.start_time, session.end_time],
    );

    if (!availabilityResult.rowCount) {
      throw new Error("Staff is not available for this exam session");
    }

    const overlapAssignment = await db.query(
      `select sa.id
       from staff_assignments sa
       join exam_sessions es on es.id = sa.exam_session_id
       where sa.staff_id = $1
         and sa.status <> 'cancelled'
         and es.exam_date = $2
         and not (es.end_time <= $3 or es.start_time >= $4)
       limit 1`,
      [input.staffId, session.exam_date, session.start_time, session.end_time],
    );

    if (overlapAssignment.rowCount) {
      throw new Error("Staff already assigned for an overlapping exam session");
    }

    const result = await db.query(
      `insert into staff_assignments (id, exam_session_id, staff_id, role_in_session, status)
       values ($1, $2, $3, $4, $5)
       returning id, exam_session_id, staff_id, role_in_session, status, created_at, updated_at`,
      [randomUUID(), input.examSessionId, input.staffId, input.roleInSession, input.status ?? "assigned"],
    );

    return mapAssignment(result.rows[0]);
  }

  async listAssignments(staffId?: string): Promise<StaffAssignment[]> {
    const values: string[] = [];
    let whereClause = "";

    if (staffId) {
      values.push(staffId);
      whereClause = "where staff_id = $1";
    }

    const result = await db.query(
      `select id, exam_session_id, staff_id, role_in_session, status, created_at, updated_at
       from staff_assignments
       ${whereClause}
       order by created_at desc`,
      values,
    );

    return result.rows.map(mapAssignment);
  }

  async updateAssignment(id: string, input: UpdateStaffAssignmentDto): Promise<StaffAssignment | null> {
    const fields: string[] = [];
    const values: string[] = [];

    if (input.staffId !== undefined) {
      values.push(input.staffId);
      fields.push(`staff_id = $${values.length}`);
    }

    if (input.roleInSession !== undefined) {
      values.push(input.roleInSession);
      fields.push(`role_in_session = $${values.length}`);
    }

    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, exam_session_id, staff_id, role_in_session, status, created_at, updated_at
         from staff_assignments where id = $1`,
        [id],
      );
      return current.rowCount ? mapAssignment(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update staff_assignments
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, exam_session_id, staff_id, role_in_session, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapAssignment(result.rows[0]) : null;
  }

  async cancelAssignment(id: string): Promise<boolean> {
    const result = await db.query(
      `update staff_assignments
       set status = 'cancelled', updated_at = now()
       where id = $1 and status <> 'cancelled'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createApplication(input: CreateRepeatProRataApplicationDto): Promise<RepeatProRataApplication> {
    const result = await db.query(
      `insert into repeat_prorata_applications (
         id, student_id, subject_id, exam_id, application_type, reason, status
       )
       values ($1, $2, $3, $4, $5, $6, 'pending')
       returning id, student_id, subject_id, exam_id, application_type, reason, status, created_at, updated_at`,
      [
        randomUUID(),
        input.studentId,
        input.subjectId ?? null,
        input.examId ?? null,
        input.applicationType,
        input.reason ?? null,
      ],
    );

    return mapApplication(result.rows[0]);
  }

  async listApplications(studentId?: string): Promise<RepeatProRataApplication[]> {
    const values: string[] = [];
    let whereClause = "";

    if (studentId) {
      values.push(studentId);
      whereClause = "where student_id = $1";
    }

    const result = await db.query(
      `select id, student_id, subject_id, exam_id, application_type, reason, status, created_at, updated_at
       from repeat_prorata_applications
       ${whereClause}
       order by created_at desc`,
      values,
    );

    return result.rows.map(mapApplication);
  }

  async decideApplication(applicationId: string, input: DecisionApplicationDto): Promise<{ application: RepeatProRataApplication; approval: Approval } | null> {
    const client = await db.connect();
    try {
      await client.query("begin");

      const appResult = await client.query(
        `select id, student_id, subject_id, exam_id, application_type, reason, status, created_at, updated_at
         from repeat_prorata_applications
         where id = $1
         for update`,
        [applicationId],
      );

      if (!appResult.rowCount) {
        await client.query("rollback");
        return null;
      }

      if (appResult.rows[0].status !== "pending") {
        throw new Error("Only pending applications can be decided");
      }

      const newStatus = input.decision === "approved" ? "approved" : "rejected";

      const updatedResult = await client.query(
        `update repeat_prorata_applications
         set status = $1, updated_at = now()
         where id = $2
         returning id, student_id, subject_id, exam_id, application_type, reason, status, created_at, updated_at`,
        [newStatus, applicationId],
      );

      const approvalResult = await client.query(
        `insert into approvals (id, application_id, approver_id, decision, decision_note)
         values ($1, $2, $3, $4, $5)
         returning id, application_id, approver_id, decision, decision_note, created_at`,
        [randomUUID(), applicationId, input.approverId, input.decision, input.decisionNote ?? null],
      );

      await client.query("commit");

      return {
        application: mapApplication(updatedResult.rows[0]),
        approval: mapApproval(approvalResult.rows[0]),
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async withdrawApplication(applicationId: string): Promise<boolean> {
    const result = await db.query(
      `update repeat_prorata_applications
       set status = 'withdrawn', updated_at = now()
       where id = $1 and status = 'pending'`,
      [applicationId],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
