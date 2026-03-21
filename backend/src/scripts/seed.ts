import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

async function main() {
  const adminId = randomUUID();
  const staffId = randomUUID();
  const studentId = randomUUID();

  await db.query(
    `insert into users (id, full_name, email, password_hash, role, status)
     values ($1, 'Platform Admin', 'admin@ttble.local', 'admin123', 'admin', 'active')
     on conflict (email)
     do update set full_name = excluded.full_name, password_hash = excluded.password_hash, role = excluded.role, status = 'active'`,
    [adminId],
  );

  await db.query(
    `insert into users (id, full_name, email, password_hash, role, status)
     values ($1, 'Scheduling Staff', 'staff@ttble.local', 'staff123', 'staff', 'active')
     on conflict (email)
     do update set full_name = excluded.full_name, password_hash = excluded.password_hash, role = excluded.role, status = 'active'`,
    [staffId],
  );

  await db.query(
    `insert into users (id, full_name, email, password_hash, role, status)
     values ($1, 'Student One', 'student1@ttble.local', 'student123', 'student', 'active')
     on conflict (email)
     do update set full_name = excluded.full_name, password_hash = excluded.password_hash, role = excluded.role, status = 'active'`,
    [studentId],
  );

  const subjectId = randomUUID();
  await db.query(
    `insert into subjects (id, code, name, year_no, semester_no)
     values ($1, 'CS401', 'Advanced Scheduling Systems', 4, 1)
     on conflict (code)
     do update set name = excluded.name`,
    [subjectId],
  );

  const hallId = randomUUID();
  await db.query(
    `insert into halls (id, code, name, location, capacity, status)
     values ($1, 'H-01', 'Main Hall', 'Block A', 240, 'active')
     on conflict (code)
     do update set name = excluded.name, location = excluded.location, capacity = excluded.capacity, status = 'active'`,
    [hallId],
  );

  console.log("Seed data created/updated successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.end();
  });
