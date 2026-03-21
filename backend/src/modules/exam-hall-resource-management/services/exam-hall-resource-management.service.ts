import { randomUUID } from "node:crypto";
import { db } from "../../../config/db.js";
import type {
  CreateHallBookingDto,
  CreateHallDto,
  UpdateHallBookingDto,
  UpdateHallDto,
  UpsertHallFacilityDto,
} from "../dto/exam-hall.dto.js";
import type { Hall, HallBooking, HallFacility } from "../entities/exam-hall.entity.js";

function mapHall(row: any): Hall {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    location: row.location,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFacility(row: any): HallFacility {
  return {
    hallId: row.hall_id,
    hasAc: row.has_ac,
    hasComputers: row.has_computers,
    hasAccessibilitySupport: row.has_accessibility_support,
    hasSpecialNeedsSupport: row.has_special_needs_support,
    updatedAt: row.updated_at,
  };
}

function mapBooking(row: any): HallBooking {
  return {
    id: row.id,
    hallId: row.hall_id,
    examSessionId: row.exam_session_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ExamHallResourceManagementService {
  async createHall(input: CreateHallDto): Promise<Hall> {
    const result = await db.query(
      `insert into halls (id, code, name, location, capacity, status)
       values ($1, $2, $3, $4, $5, 'active')
       returning id, code, name, location, capacity, status, created_at, updated_at`,
      [randomUUID(), input.code, input.name, input.location, input.capacity],
    );

    return mapHall(result.rows[0]);
  }

  async listHalls(): Promise<Array<Hall & { facilities: HallFacility | null }>> {
    const result = await db.query(
      `select
          h.id,
          h.code,
          h.name,
          h.location,
          h.capacity,
          h.status,
          h.created_at,
          h.updated_at,
          f.hall_id,
          f.has_ac,
          f.has_computers,
          f.has_accessibility_support,
          f.has_special_needs_support,
          f.updated_at as facilities_updated_at
       from halls h
       left join hall_facilities f on f.hall_id = h.id
       order by h.code`,
    );

    return result.rows.map((row: any) => ({
      ...mapHall(row),
      facilities: row.hall_id
        ? {
            hallId: row.hall_id,
            hasAc: row.has_ac,
            hasComputers: row.has_computers,
            hasAccessibilitySupport: row.has_accessibility_support,
            hasSpecialNeedsSupport: row.has_special_needs_support,
            updatedAt: row.facilities_updated_at,
          }
        : null,
    }));
  }

  async updateHall(id: string, input: UpdateHallDto): Promise<Hall | null> {
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
    if (input.location !== undefined) {
      values.push(input.location);
      fields.push(`location = $${values.length}`);
    }
    if (input.capacity !== undefined) {
      values.push(input.capacity);
      fields.push(`capacity = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, code, name, location, capacity, status, created_at, updated_at from halls where id = $1`,
        [id],
      );
      return current.rowCount ? mapHall(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update halls
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, code, name, location, capacity, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapHall(result.rows[0]) : null;
  }

  async archiveHall(id: string): Promise<boolean> {
    const result = await db.query(
      `update halls set status = 'inactive', updated_at = now() where id = $1 and status <> 'inactive'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async upsertHallFacility(hallId: string, input: UpsertHallFacilityDto): Promise<HallFacility> {
    const result = await db.query(
      `insert into hall_facilities (
          hall_id,
          has_ac,
          has_computers,
          has_accessibility_support,
          has_special_needs_support,
          updated_at
       )
       values ($1, $2, $3, $4, $5, now())
       on conflict (hall_id)
       do update set
         has_ac = excluded.has_ac,
         has_computers = excluded.has_computers,
         has_accessibility_support = excluded.has_accessibility_support,
         has_special_needs_support = excluded.has_special_needs_support,
         updated_at = now()
       returning hall_id, has_ac, has_computers, has_accessibility_support, has_special_needs_support, updated_at`,
      [
        hallId,
        input.hasAc ?? false,
        input.hasComputers ?? false,
        input.hasAccessibilitySupport ?? false,
        input.hasSpecialNeedsSupport ?? false,
      ],
    );

    return mapFacility(result.rows[0]);
  }

  async createHallBooking(input: CreateHallBookingDto): Promise<HallBooking> {
    const sessionResult = await db.query(
      `select id, exam_date, start_time, end_time
       from exam_sessions where id = $1`,
      [input.examSessionId],
    );

    if (!sessionResult.rowCount) {
      throw new Error("Exam session not found");
    }

    const session = sessionResult.rows[0];

    const clashResult = await db.query(
      `select hb.id
       from hall_bookings hb
       join exam_sessions es on es.id = hb.exam_session_id
       where hb.hall_id = $1
         and hb.status = 'booked'
         and es.exam_date = $2
         and not (es.end_time <= $3 or es.start_time >= $4)
       limit 1`,
      [input.hallId, session.exam_date, session.start_time, session.end_time],
    );

    if (clashResult.rowCount) {
      throw new Error("Hall clash detected for the selected session time");
    }

    const client = await db.connect();
    try {
      await client.query("begin");

      const bookingResult = await client.query(
        `insert into hall_bookings (id, hall_id, exam_session_id, status)
         values ($1, $2, $3, 'booked')
         returning id, hall_id, exam_session_id, status, created_at, updated_at`,
        [randomUUID(), input.hallId, input.examSessionId],
      );

      await client.query(
        `update exam_sessions set hall_id = $1, updated_at = now() where id = $2`,
        [input.hallId, input.examSessionId],
      );

      await client.query("commit");
      return mapBooking(bookingResult.rows[0]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async listHallBookings(): Promise<HallBooking[]> {
    const result = await db.query(
      `select id, hall_id, exam_session_id, status, created_at, updated_at
       from hall_bookings
       order by created_at desc`,
    );
    return result.rows.map(mapBooking);
  }

  async updateHallBooking(id: string, input: UpdateHallBookingDto): Promise<HallBooking | null> {
    const fields: string[] = [];
    const values: Array<string> = [];

    if (input.status !== undefined) {
      values.push(input.status);
      fields.push(`status = $${values.length}`);
    }

    if (input.hallId !== undefined) {
      values.push(input.hallId);
      fields.push(`hall_id = $${values.length}`);
    }

    if (!fields.length) {
      const current = await db.query(
        `select id, hall_id, exam_session_id, status, created_at, updated_at from hall_bookings where id = $1`,
        [id],
      );
      return current.rowCount ? mapBooking(current.rows[0]) : null;
    }

    fields.push("updated_at = now()");
    values.push(id);

    const result = await db.query(
      `update hall_bookings
       set ${fields.join(", ")}
       where id = $${values.length}
       returning id, hall_id, exam_session_id, status, created_at, updated_at`,
      values,
    );

    return result.rowCount ? mapBooking(result.rows[0]) : null;
  }

  async cancelHallBooking(id: string): Promise<boolean> {
    const result = await db.query(
      `update hall_bookings set status = 'cancelled', updated_at = now() where id = $1 and status <> 'cancelled'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
