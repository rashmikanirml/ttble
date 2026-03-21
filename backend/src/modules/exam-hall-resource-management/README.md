# Exam Hall & Resource Management Module

## Core entities

- Hall
- HallFacility
- HallBooking

## Suggested endpoints

- `POST /halls`
- `GET /halls`
- `PATCH /halls/:id`
- `DELETE /halls/:id`
- `POST /hall-bookings`
- `GET /hall-bookings`
- `PATCH /hall-bookings/:id`
- `DELETE /hall-bookings/:id`

## Business rules

- Prevent overlapping hall bookings.
- Ensure assigned hall capacity is enough for exam candidate count.
- Prefer archive over hard delete for halls with historical usage.
