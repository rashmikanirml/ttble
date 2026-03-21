# User & Role Management Module

## Core entities

- User
- StudentProfile
- StaffProfile
- RolePermission

## Suggested endpoints

- `POST /users` create user
- `GET /users` list users
- `GET /users/:id` get user
- `PATCH /users/:id` update user
- `DELETE /users/:id` deactivate user
- `POST /students` create student profile
- `PATCH /students/:id` update student profile
- `POST /staff` create staff profile
- `PATCH /staff/:id` update staff profile

## Business rules

- Enforce role-based access for admin operations.
- Use soft delete for users and staff records.
- Keep student repeat/pro-rata state consistent with exam eligibility.
