# Exam Timetable Auto Generation Module

## Core entities

- Subject
- Exam
- TimetableRun
- ExamSession
- StudentExamEligibility

## Suggested endpoints

- `POST /subjects`
- `GET /subjects`
- `PATCH /subjects/:id`
- `DELETE /subjects/:id`
- `POST /timetable-runs/generate`
- `GET /timetable-runs/:id`
- `PATCH /exam-sessions/:id`
- `DELETE /timetable-runs/:id`

## Business rules

- Avoid student exam clashes.
- Respect max exams per day.
- Track generation metadata in TimetableRun for auditability.
