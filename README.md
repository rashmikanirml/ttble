# Exam Timetable Project Skeleton

This repository is prepared for a web-based exam timetable system using:

- TypeScript
- React frontend
- Node.js backend (NestJS-friendly module layout)
- PostgreSQL (Neon)

## Database setup

The database URL is configured in `.env` with `DATABASE_URL`.

Reference files:

- `.env`
- `.env.example`
- `backend/src/config/database.ts`

## Professional Enhancements Implemented

### Core system layer

- JWT authentication with RBAC checks
- Password hashing with bcrypt (legacy password auto-upgrade on next login)
- Audit logging for all mutating API calls (`audit_logs`)
- In-app notifications (`in_app_notifications`) and external notification logging
- Structured error handling with typed API error responses

### Reporting and analytics

- Timetable report endpoint
- Hall utilization analytics endpoint
- Staff workload analytics endpoint
- Export timetable reports to Excel (`.xlsx`) and PDF

### Workflow and status management

- Timetable run lifecycle: `draft -> approved -> published -> archived`
- Approval flow with `timetable_approvals`
- Publish flow enforces approval first
- Business rules enforce no direct edits to published timetable sessions

### Configuration / rules engine

- Dynamic settings via `system_settings`
- Built-in scheduling rules:
	- `maxExamsPerDay`
	- `slotGapMinutes`
	- `minHallCapacity`
- Admin endpoint to update rules at runtime

### Data integrity

- Additional indexes and unique constraints for bookings/assignments
- Added check constraints for status values and time/duration validity
- Existing transactional generation preserved for consistency

### Testing strategy

- Unit test baseline added for workflow/business rules
- Run with: `npm --prefix backend run test:unit`

### Deployment / DevOps

- Optional Docker setup:
	- `backend/Dockerfile`
	- `frontend/Dockerfile`
	- `docker-compose.yml`

## Useful Commands

- Run full stack dev: `npm run dev`
- Apply schema migration: `npm --prefix backend run migrate`
- Seed demo data: `npm --prefix backend run seed`
- Build backend: `npm --prefix backend run build`
- Run backend unit tests: `npm --prefix backend run test:unit`

## Component folders

Frontend features:

- `frontend/src/features/user-role-management`
- `frontend/src/features/exam-timetable-auto-generation`
- `frontend/src/features/exam-hall-resource-management`
- `frontend/src/features/staff-allocation-repeat-prorata`

Backend modules:

- `backend/src/modules/user-role-management`
- `backend/src/modules/exam-timetable-auto-generation`
- `backend/src/modules/exam-hall-resource-management`
- `backend/src/modules/staff-allocation-repeat-prorata`

Database starter schema:

- `database/schema.sql`

## Additional documentation

- `ARCHITECTURE.md` for stack and module mapping
- `frontend/src/features/README.md` for frontend feature conventions
- `backend/src/modules/README.md` for backend module conventions
