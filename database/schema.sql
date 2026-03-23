-- PostgreSQL starter schema for exam timetable management system
-- Uses soft-delete/status fields for operational safety.

create table if not exists users (
  id uuid primary key,
  full_name varchar(150) not null,
  email varchar(255) unique not null,
  password_hash text not null,
  role varchar(30) not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_profiles (
  user_id uuid primary key references users(id),
  year_no int not null,
  semester_no int not null,
  student_type varchar(20) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_profiles (
  user_id uuid primary key references users(id),
  staff_type varchar(30) not null,
  availability_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key,
  code varchar(20) unique not null,
  name varchar(200) not null,
  year_no int not null,
  semester_no int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exams (
  id uuid primary key,
  subject_id uuid not null references subjects(id),
  exam_type varchar(30) not null,
  duration_minutes int not null,
  student_cohort varchar(50) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists timetable_runs (
  id uuid primary key,
  date_start date not null,
  date_end date not null,
  rules_used jsonb not null,
  created_by uuid not null references users(id),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists halls (
  id uuid primary key,
  code varchar(30) unique not null,
  name varchar(150) not null,
  location varchar(255) not null,
  capacity int not null,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exam_sessions (
  id uuid primary key,
  timetable_run_id uuid not null references timetable_runs(id),
  exam_id uuid not null references exams(id),
  hall_id uuid references halls(id),
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  status varchar(20) not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hall_facilities (
  hall_id uuid primary key references halls(id),
  has_ac boolean not null default false,
  has_computers boolean not null default false,
  has_accessibility_support boolean not null default false,
  has_special_needs_support boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists hall_bookings (
  id uuid primary key,
  hall_id uuid not null references halls(id),
  exam_session_id uuid not null references exam_sessions(id),
  status varchar(20) not null default 'booked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_exam_eligibility (
  student_id uuid not null references users(id),
  exam_id uuid not null references exams(id),
  eligibility_type varchar(20) not null,
  primary key (student_id, exam_id)
);

create table if not exists exam_student_applications (
  id uuid primary key,
  exam_id uuid not null references exams(id),
  student_id uuid not null references users(id),
  status varchar(20) not null default 'pending',
  notice_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table if not exists staff_availability (
  id uuid primary key,
  staff_id uuid not null references users(id),
  available_date date not null,
  start_time time not null,
  end_time time not null,
  status varchar(20) not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_assignments (
  id uuid primary key,
  exam_session_id uuid not null references exam_sessions(id),
  staff_id uuid not null references users(id),
  role_in_session varchar(30) not null,
  status varchar(20) not null default 'assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invigilation_applications (
  id uuid primary key,
  exam_id uuid not null references exams(id),
  staff_id uuid not null references users(id),
  status varchar(20) not null default 'pending',
  motivation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, staff_id)
);

create table if not exists notification_logs (
  id uuid primary key,
  kind varchar(30) not null,
  recipient varchar(255) not null,
  entity_key varchar(120) not null,
  channel varchar(30) not null,
  payload_json jsonb not null,
  external_ref varchar(255),
  sent_at timestamptz not null default now(),
  unique (kind, recipient, entity_key)
);

create table if not exists repeat_prorata_applications (
  id uuid primary key,
  student_id uuid not null references users(id),
  subject_id uuid references subjects(id),
  exam_id uuid references exams(id),
  application_type varchar(20) not null,
  reason text,
  status varchar(20) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key,
  application_id uuid not null references repeat_prorata_applications(id),
  approver_id uuid not null references users(id),
  decision varchar(20) not null,
  decision_note text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  actor_user_id uuid references users(id),
  actor_role varchar(30),
  action varchar(150) not null,
  method varchar(10) not null,
  route varchar(255) not null,
  status_code int not null,
  request_body jsonb not null default '{}'::jsonb,
  response_time_ms int not null,
  ip_address varchar(120),
  user_agent varchar(255),
  created_at timestamptz not null default now()
);

create table if not exists in_app_notifications (
  id uuid primary key,
  user_id uuid not null references users(id),
  kind varchar(50) not null,
  title varchar(200) not null,
  message text not null,
  entity_key varchar(120),
  payload_json jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists system_settings (
  key varchar(120) primary key,
  value_json jsonb not null,
  description text,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table if not exists timetable_approvals (
  id uuid primary key,
  timetable_run_id uuid not null references timetable_runs(id) on delete cascade,
  approver_id uuid not null references users(id),
  decision varchar(20) not null,
  note text,
  created_at timestamptz not null default now(),
  unique (timetable_run_id, approver_id)
);

create unique index if not exists uq_hall_bookings_exam_session on hall_bookings(exam_session_id);
create unique index if not exists uq_staff_assignments_session_staff on staff_assignments(exam_session_id, staff_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_in_app_notifications_user_created on in_app_notifications(user_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_users_role') then
    alter table users
      add constraint chk_users_role check (role in ('student', 'staff', 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_users_status') then
    alter table users
      add constraint chk_users_status check (status in ('active', 'inactive'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_timetable_runs_status') then
    alter table timetable_runs
      add constraint chk_timetable_runs_status check (status in ('draft', 'approved', 'published', 'archived', 'active'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_exam_sessions_status') then
    alter table exam_sessions
      add constraint chk_exam_sessions_status check (status in ('scheduled', 'published', 'cancelled', 'rescheduled'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_exam_sessions_time') then
    alter table exam_sessions
      add constraint chk_exam_sessions_time check (end_time > start_time);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_exams_duration_positive') then
    alter table exams
      add constraint chk_exams_duration_positive check (duration_minutes > 0);
  end if;
end $$;

insert into system_settings (key, value_json, description)
values
  ('maxExamsPerDay', '3'::jsonb, 'Maximum number of exams per day for auto generation'),
  ('slotGapMinutes', '20'::jsonb, 'Gap between exam slots in minutes'),
  ('minHallCapacity', '20'::jsonb, 'Minimum capacity for halls used in generation')
on conflict (key) do nothing;
