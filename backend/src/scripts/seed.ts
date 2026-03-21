import { db } from "../config/db.js";

const IDS = {
  users: {
    admin: "11111111-1111-4111-8111-111111111111",
    staff1: "22222222-2222-4222-8222-222222222222",
    staff2: "33333333-3333-4333-8333-333333333333",
    student1: "44444444-4444-4444-8444-444444444444",
    student2: "55555555-5555-4555-8555-555555555555",
  },
  subjects: {
    cs401: "66666666-6666-4666-8666-666666666666",
    cs402: "77777777-7777-4777-8777-777777777777",
    se301: "88888888-8888-4888-8888-888888888888",
  },
  exams: {
    exam1: "99999999-9999-4999-8999-999999999991",
    exam2: "99999999-9999-4999-8999-999999999992",
    exam3: "99999999-9999-4999-8999-999999999993",
  },
  run: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sessions: {
    s1: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    s2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    s3: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  },
  halls: {
    h1: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    h2: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  },
  bookings: {
    b1: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
    b2: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
  },
  availability: {
    a1: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
    a2: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2",
    a3: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3",
  },
  assignments: {
    as1: "ffffffff-ffff-4fff-8fff-fffffffffff1",
    as2: "ffffffff-ffff-4fff-8fff-fffffffffff2",
  },
  applications: {
    app1: "12121212-1212-4121-8121-121212121211",
    app2: "12121212-1212-4121-8121-121212121212",
  },
  examStudentApplications: {
    esa1: "56565656-5656-4565-8565-565656565651",
    esa2: "56565656-5656-4565-8565-565656565652",
    esa3: "56565656-5656-4565-8565-565656565653",
    esa4: "56565656-5656-4565-8565-565656565654",
  },
  invigilationApplications: {
    ia1: "78787878-7878-4787-8787-787878787871",
    ia2: "78787878-7878-4787-8787-787878787872",
    ia3: "78787878-7878-4787-8787-787878787873",
  },
  approvals: {
    ap1: "34343434-3434-4343-8343-343434343431",
  },
};

async function upsertUser(input: {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "student";
}) {
  const result = await db.query(
    `insert into users (id, full_name, email, password_hash, role, status)
     values ($1, $2, $3, $4, $5, 'active')
     on conflict (email)
     do update set
       full_name = excluded.full_name,
       password_hash = excluded.password_hash,
       role = excluded.role,
       status = 'active',
       updated_at = now()
     returning id`,
    [input.id, input.fullName, input.email.toLowerCase(), input.password, input.role],
  );

  return result.rows[0].id as string;
}

async function upsertSubject(input: {
  id: string;
  code: string;
  name: string;
  yearNo: number;
  semesterNo: number;
}) {
  const result = await db.query(
    `insert into subjects (id, code, name, year_no, semester_no)
     values ($1, $2, $3, $4, $5)
     on conflict (code)
     do update set
       name = excluded.name,
       year_no = excluded.year_no,
       semester_no = excluded.semester_no,
       updated_at = now()
     returning id`,
    [input.id, input.code, input.name, input.yearNo, input.semesterNo],
  );

  return result.rows[0].id as string;
}

async function upsertHall(input: {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
}) {
  const result = await db.query(
    `insert into halls (id, code, name, location, capacity, status)
     values ($1, $2, $3, $4, $5, 'active')
     on conflict (code)
     do update set
       name = excluded.name,
       location = excluded.location,
       capacity = excluded.capacity,
       status = excluded.status,
       updated_at = now()
     returning id`,
    [input.id, input.code, input.name, input.location, input.capacity],
  );

  return result.rows[0].id as string;
}

async function main() {
  const adminId = await upsertUser({
    id: IDS.users.admin,
    fullName: "Platform Admin",
    email: "admin@ttble.local",
    password: "admin123",
    role: "admin",
  });

  const staffOneId = await upsertUser({
    id: IDS.users.staff1,
    fullName: "Scheduling Staff One",
    email: "staff@ttble.local",
    password: "staff123",
    role: "staff",
  });

  const staffTwoId = await upsertUser({
    id: IDS.users.staff2,
    fullName: "Scheduling Staff Two",
    email: "staff2@ttble.local",
    password: "staff123",
    role: "staff",
  });

  const studentOneId = await upsertUser({
    id: IDS.users.student1,
    fullName: "Student One",
    email: "student1@ttble.local",
    password: "student123",
    role: "student",
  });

  const studentTwoId = await upsertUser({
    id: IDS.users.student2,
    fullName: "Student Two",
    email: "student2@ttble.local",
    password: "student123",
    role: "student",
  });

  await db.query(
    `insert into student_profiles (user_id, year_no, semester_no, student_type)
     values
       ($1, 4, 1, 'normal'),
       ($2, 4, 1, 'repeat')
     on conflict (user_id)
     do update set
       year_no = excluded.year_no,
       semester_no = excluded.semester_no,
       student_type = excluded.student_type,
       updated_at = now()`,
    [studentOneId, studentTwoId],
  );

  await db.query(
    `insert into staff_profiles (user_id, staff_type, availability_notes)
     values
       ($1, 'invigilator', 'Morning sessions preferred'),
       ($2, 'supervisor', 'Can cover extended sessions')
     on conflict (user_id)
     do update set
       staff_type = excluded.staff_type,
       availability_notes = excluded.availability_notes,
       updated_at = now()`,
    [staffOneId, staffTwoId],
  );

  const cs401Id = await upsertSubject({
    id: IDS.subjects.cs401,
    code: "CS401",
    name: "Advanced Scheduling Systems",
    yearNo: 4,
    semesterNo: 1,
  });

  const cs402Id = await upsertSubject({
    id: IDS.subjects.cs402,
    code: "CS402",
    name: "Distributed Software Architecture",
    yearNo: 4,
    semesterNo: 1,
  });

  const se301Id = await upsertSubject({
    id: IDS.subjects.se301,
    code: "SE301",
    name: "Software Quality Assurance",
    yearNo: 3,
    semesterNo: 2,
  });

  await db.query(
    `insert into exams (id, subject_id, exam_type, duration_minutes, student_cohort)
     values
       ($1, $4, 'final', 120, 'all'),
       ($2, $5, 'final', 150, 'all'),
       ($3, $6, 'midterm', 90, 'year-3')
     on conflict (id)
     do update set
       subject_id = excluded.subject_id,
       exam_type = excluded.exam_type,
       duration_minutes = excluded.duration_minutes,
       student_cohort = excluded.student_cohort,
       updated_at = now()`,
    [IDS.exams.exam1, IDS.exams.exam2, IDS.exams.exam3, cs401Id, cs402Id, se301Id],
  );

  await db.query(
    `insert into timetable_runs (id, date_start, date_end, rules_used, created_by, status)
     values ($1, '2026-04-10', '2026-04-15', '{"maxExamsPerDay":3,"bufferMinutes":20}'::jsonb, $2, 'active')
     on conflict (id)
     do update set
       date_start = excluded.date_start,
       date_end = excluded.date_end,
       rules_used = excluded.rules_used,
       created_by = excluded.created_by,
       status = excluded.status`,
    [IDS.run, adminId],
  );

  const hallOneId = await upsertHall({
    id: IDS.halls.h1,
    code: "H-01",
    name: "Main Hall",
    location: "Block A",
    capacity: 240,
  });

  const hallTwoId = await upsertHall({
    id: IDS.halls.h2,
    code: "H-02",
    name: "Innovation Hall",
    location: "Block B",
    capacity: 180,
  });

  await db.query(
    `insert into exam_sessions (id, timetable_run_id, exam_id, hall_id, exam_date, start_time, end_time, status)
     values
       ($1, $4, $7, $10, '2026-04-10', '09:00', '11:00', 'scheduled'),
       ($2, $5, $8, $11, '2026-04-10', '12:00', '14:30', 'scheduled'),
       ($3, $6, $9, $10, '2026-04-11', '10:00', '11:30', 'scheduled')
     on conflict (id)
     do update set
       timetable_run_id = excluded.timetable_run_id,
       exam_id = excluded.exam_id,
       hall_id = excluded.hall_id,
       exam_date = excluded.exam_date,
       start_time = excluded.start_time,
       end_time = excluded.end_time,
       status = excluded.status,
       updated_at = now()`,
    [
      IDS.sessions.s1,
      IDS.sessions.s2,
      IDS.sessions.s3,
      IDS.run,
      IDS.run,
      IDS.run,
      IDS.exams.exam1,
      IDS.exams.exam2,
      IDS.exams.exam3,
      hallOneId,
      hallTwoId,
    ],
  );

  await db.query(
    `insert into hall_facilities (hall_id, has_ac, has_computers, has_accessibility_support, has_special_needs_support)
     values
       ($1, true, true, true, true),
       ($2, true, false, true, false)
     on conflict (hall_id)
     do update set
       has_ac = excluded.has_ac,
       has_computers = excluded.has_computers,
       has_accessibility_support = excluded.has_accessibility_support,
       has_special_needs_support = excluded.has_special_needs_support,
       updated_at = now()`,
    [hallOneId, hallTwoId],
  );

  await db.query(
    `insert into hall_bookings (id, hall_id, exam_session_id, status)
     values
       ($1, $3, $5, 'booked'),
       ($2, $4, $6, 'booked')
     on conflict (id)
     do update set
       hall_id = excluded.hall_id,
       exam_session_id = excluded.exam_session_id,
       status = excluded.status,
       updated_at = now()`,
    [IDS.bookings.b1, IDS.bookings.b2, hallOneId, hallTwoId, IDS.sessions.s1, IDS.sessions.s2],
  );

  await db.query(
    `insert into student_exam_eligibility (student_id, exam_id, eligibility_type)
     values
       ($1, $3, 'normal'),
       ($1, $4, 'normal'),
       ($2, $3, 'repeat'),
       ($2, $5, 'pro-rata')
     on conflict (student_id, exam_id)
     do update set
       eligibility_type = excluded.eligibility_type`,
    [studentOneId, studentTwoId, IDS.exams.exam1, IDS.exams.exam2, IDS.exams.exam3],
  );

  await db.query(
    `insert into exam_student_applications (id, exam_id, student_id, status, notice_text)
     values
       ($1, $5, $8, 'approved', 'I confirm participation for final exam session.'),
       ($2, $6, $8, 'approved', 'Need this exam for semester completion.'),
       ($3, $5, $9, 'approved', 'Repeat attempt after approved repeat application.'),
       ($4, $7, $9, 'pending', 'Requesting seat for the midterm due to overlap issues.')
     on conflict (exam_id, student_id)
     do update set
       status = excluded.status,
       notice_text = excluded.notice_text,
       updated_at = now()`,
    [
      IDS.examStudentApplications.esa1,
      IDS.examStudentApplications.esa2,
      IDS.examStudentApplications.esa3,
      IDS.examStudentApplications.esa4,
      IDS.exams.exam1,
      IDS.exams.exam2,
      IDS.exams.exam3,
      studentOneId,
      studentTwoId,
    ],
  );

  await db.query(
    `insert into invigilation_applications (id, exam_id, staff_id, status, motivation)
     values
       ($1, $4, $7, 'approved', 'Experienced in managing large halls.'),
       ($2, $5, $8, 'approved', 'Available for long duration exams.'),
       ($3, $6, $7, 'pending', 'Can support as reserve invigilator.')
     on conflict (exam_id, staff_id)
     do update set
       status = excluded.status,
       motivation = excluded.motivation,
       updated_at = now()`,
    [
      IDS.invigilationApplications.ia1,
      IDS.invigilationApplications.ia2,
      IDS.invigilationApplications.ia3,
      IDS.exams.exam1,
      IDS.exams.exam2,
      IDS.exams.exam3,
      staffOneId,
      staffTwoId,
    ],
  );

  await db.query(
    `insert into staff_availability (id, staff_id, available_date, start_time, end_time, status)
     values
       ($1, $4, '2026-04-10', '08:30', '15:00', 'available'),
       ($2, $5, '2026-04-10', '08:30', '17:00', 'available'),
       ($3, $4, '2026-04-11', '09:00', '13:00', 'available')
     on conflict (id)
     do update set
       staff_id = excluded.staff_id,
       available_date = excluded.available_date,
       start_time = excluded.start_time,
       end_time = excluded.end_time,
       status = excluded.status,
       updated_at = now()`,
    [IDS.availability.a1, IDS.availability.a2, IDS.availability.a3, staffOneId, staffTwoId],
  );

  await db.query(
    `insert into staff_assignments (id, exam_session_id, staff_id, role_in_session, status)
     values
       ($1, $3, $5, 'invigilator', 'confirmed'),
       ($2, $4, $6, 'supervisor', 'assigned')
     on conflict (id)
     do update set
       exam_session_id = excluded.exam_session_id,
       staff_id = excluded.staff_id,
       role_in_session = excluded.role_in_session,
       status = excluded.status,
       updated_at = now()`,
    [IDS.assignments.as1, IDS.assignments.as2, IDS.sessions.s1, IDS.sessions.s2, staffOneId, staffTwoId],
  );

  await db.query(
    `insert into repeat_prorata_applications (id, student_id, subject_id, exam_id, application_type, reason, status)
     values
       ($1, $3, $5, $7, 'repeat', 'Missed due to medical leave', 'approved'),
       ($2, $4, $6, $8, 'pro-rata', 'Part-time registration overlap', 'pending')
     on conflict (id)
     do update set
       student_id = excluded.student_id,
       subject_id = excluded.subject_id,
       exam_id = excluded.exam_id,
       application_type = excluded.application_type,
       reason = excluded.reason,
       status = excluded.status,
       updated_at = now()`,
    [IDS.applications.app1, IDS.applications.app2, studentTwoId, studentOneId, cs401Id, se301Id, IDS.exams.exam1, IDS.exams.exam3],
  );

  await db.query(
    `insert into approvals (id, application_id, approver_id, decision, decision_note)
     values ($1, $2, $3, 'approved', 'Reviewed and accepted by LIC')
     on conflict (id)
     do update set
       application_id = excluded.application_id,
       approver_id = excluded.approver_id,
       decision = excluded.decision,
       decision_note = excluded.decision_note`,
    [IDS.approvals.ap1, IDS.applications.app1, adminId],
  );

  console.log("Seed data created/updated for all components successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.end();
  });
