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
