import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth.controller.js";
import { settingsRouter } from "./modules/configuration/settings.controller.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.controller.js";
import { examHallResourceManagementRouter } from "./modules/exam-hall-resource-management/index.js";
import { examTimetableAutoGenerationRouter } from "./modules/exam-timetable-auto-generation/index.js";
import { notificationsRouter } from "./modules/notifications/notifications.controller.js";
import { reportingRouter } from "./modules/reporting/reporting.controller.js";
import { staffAllocationRepeatProrataRouter } from "./modules/staff-allocation-repeat-prorata/index.js";
import { userRoleManagementRouter } from "./modules/user-role-management/index.js";
import { auditMiddleware } from "./middleware/audit.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(auditMiddleware);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRouter);
app.use("/api", dashboardRouter);
app.use("/api", userRoleManagementRouter);
app.use("/api", examTimetableAutoGenerationRouter);
app.use("/api", examHallResourceManagementRouter);
app.use("/api", staffAllocationRepeatProrataRouter);
app.use("/api", reportingRouter);
app.use("/api", settingsRouter);
app.use("/api", notificationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
