# Staff Allocation & Repeat/Pro-Rata Management Module

## Core entities

- StaffAvailability
- StaffAssignment
- RepeatProRataApplication
- Approval

## Suggested endpoints

- `POST /staff-availability`
- `GET /staff-availability`
- `PATCH /staff-availability/:id`
- `DELETE /staff-availability/:id`
- `POST /staff-assignments`
- `GET /staff-assignments`
- `PATCH /staff-assignments/:id`
- `DELETE /staff-assignments/:id`
- `POST /repeat-prorata-applications`
- `PATCH /repeat-prorata-applications/:id/decision`

## Business rules

- Allocation must only use available staff.
- LIC approval status controls downstream timetable and hall updates.
- Application withdrawal allowed only before final approval.
