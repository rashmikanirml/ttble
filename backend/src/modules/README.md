# Backend Module Layout

Each business component has its own module folder with:

- `controllers/` for HTTP layer
- `services/` for business rules and orchestration
- `dto/` for request/response payload schemas
- `entities/` for persistence model interfaces/classes

Component modules:

- `user-role-management`
- `exam-timetable-auto-generation`
- `exam-hall-resource-management`
- `staff-allocation-repeat-prorata`
