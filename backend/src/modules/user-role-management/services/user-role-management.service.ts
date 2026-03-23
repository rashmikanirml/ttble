import { randomUUID } from "node:crypto";
import { db } from "../../../config/db.js";
import { hashPassword } from "../../../lib/security.js";
import type {
  CreateUserDto,
  UpdateUserDto,
  UpsertStaffProfileDto,
  UpsertStudentProfileDto,
} from "../dto/user.dto.js";
import type { StaffProfile, StudentProfile, User } from "../entities/user.entity.js";

function toUser(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRoleManagementService {
  async listUsers(role?: string, status?: string): Promise<User[]> {
    const values: string[] = [];
    const conditions: string[] = [];

    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

    const result = await db.query(
      `select id, full_name, email, role, status, created_at, updated_at
       from users
       ${whereClause}
       order by created_at desc`,
      values,
    );

    return result.rows.map(toUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.query(
      `select id, full_name, email, role, status, created_at, updated_at
       from users
       where id = $1`,
      [id],
    );

    return result.rowCount ? toUser(result.rows[0]) : null;
  }

  async createUser(input: CreateUserDto): Promise<User> {
    const id = randomUUID();
    const passwordHash = await hashPassword(input.passwordHash);
    const result = await db.query(
      `insert into users (id, full_name, email, password_hash, role, status)
       values ($1, $2, $3, $4, $5, 'active')
       returning id, full_name, email, role, status, created_at, updated_at`,
      [id, input.fullName, input.email.toLowerCase(), passwordHash, input.role],
    );

    return toUser(result.rows[0]);
  }

  async updateUser(id: string, input: UpdateUserDto): Promise<User | null> {
    const fields: string[] = [];
    const values: string[] = [];

    if (input.fullName !== undefined) {
      values.push(input.fullName);
      fields.push(`full_name = $${values.length}`);
    }

    if (input.email !== undefined) {
      values.push(input.email.toLowerCase());
      fields.push(`email = $${values.length}`);
    }

    if (input.role !== undefined) {
      values.push(input.role);
      fields.push(`role = $${values.length}`);
    }

    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if ((input as UpdateUserDto & { passwordHash?: string }).passwordHash !== undefined) {
      const hashed = await hashPassword((input as UpdateUserDto & { passwordHash?: string }).passwordHash as string);
      values.push(hashed);
      fields.push(`password_hash = $${values.length}`);
    }

    if (!fields.length) {
      return this.getUserById(id);
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update users
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, full_name, email, role, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? toUser(result.rows[0]) : null;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const result = await db.query(
      `update users
       set status = 'inactive', updated_at = now()
       where id = $1 and status <> 'inactive'`,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async upsertStudentProfile(input: UpsertStudentProfileDto): Promise<StudentProfile> {
    const result = await db.query(
      `insert into student_profiles (user_id, year_no, semester_no, student_type)
       values ($1, $2, $3, $4)
       on conflict (user_id)
       do update set
         year_no = excluded.year_no,
         semester_no = excluded.semester_no,
         student_type = excluded.student_type,
         updated_at = now()
       returning user_id, year_no, semester_no, student_type, updated_at`,
      [input.userId, input.yearNo, input.semesterNo, input.studentType],
    );

    const row = result.rows[0];
    return {
      userId: row.user_id,
      yearNo: row.year_no,
      semesterNo: row.semester_no,
      studentType: row.student_type,
      updatedAt: row.updated_at,
    };
  }

  async upsertStaffProfile(input: UpsertStaffProfileDto): Promise<StaffProfile> {
    const result = await db.query(
      `insert into staff_profiles (user_id, staff_type, availability_notes)
       values ($1, $2, $3)
       on conflict (user_id)
       do update set
         staff_type = excluded.staff_type,
         availability_notes = excluded.availability_notes,
         updated_at = now()
       returning user_id, staff_type, availability_notes, updated_at`,
      [input.userId, input.staffType, input.availabilityNotes ?? null],
    );

    const row = result.rows[0];
    return {
      userId: row.user_id,
      staffType: row.staff_type,
      availabilityNotes: row.availability_notes,
      updatedAt: row.updated_at,
    };
  }
}
