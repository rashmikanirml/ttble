import cors from "cors";
import express from "express";
import { examTimetableAutoGenerationRouter } from "./modules/exam-timetable-auto-generation/index.js";
import { userRoleManagementRouter } from "./modules/user-role-management/index.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", userRoleManagementRouter);
app.use("/api", examTimetableAutoGenerationRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ message });
});
