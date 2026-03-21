# Suggested Stack and Component Split

## Stack selected from your requirements

- Language: TypeScript
- Frontend: React (Vite or Next.js) + UI library
- Backend: Node.js + NestJS (preferred) or Express
- Database: PostgreSQL (Neon)

## Environment

- `DATABASE_URL` is configured in `.env`.
- Backend should load this from `backend/src/config/database.ts`.

## Component mapping

### 1) User & Role Management

- Frontend feature: `frontend/src/features/user-role-management`
- Backend module: `backend/src/modules/user-role-management`

### 2) Exam Timetable Auto Generation

- Frontend feature: `frontend/src/features/exam-timetable-auto-generation`
- Backend module: `backend/src/modules/exam-timetable-auto-generation`

### 3) Exam Hall & Resource Management

- Frontend feature: `frontend/src/features/exam-hall-resource-management`
- Backend module: `backend/src/modules/exam-hall-resource-management`

### 4) Staff Allocation & Repeat/Pro-Rata Management

- Frontend feature: `frontend/src/features/staff-allocation-repeat-prorata`
- Backend module: `backend/src/modules/staff-allocation-repeat-prorata`

## Delivery notes

- Keep each component independent at folder level to simplify team ownership.
- Implement validations at API layer and DB constraints for consistency.
- Prefer status fields over hard delete where records have historical value.
