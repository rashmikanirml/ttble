import { NextFunction, Request, Response, Router } from "express";
import { AuthRequest, requireAuth, requireRole } from "../../../middleware/auth.js";
import { ExamTimetableAutoGenerationService } from "../services/exam-timetable-auto-generation.service.js";

const service = new ExamTimetableAutoGenerationService();
export const examTimetableAutoGenerationRouter = Router();

examTimetableAutoGenerationRouter.post(
  "/exam-applications",
  requireAuth,
  requireRole(["student"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const created = await service.createStudentExamApplication(authReq.auth!.userId, req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/exam-applications",
  requireAuth,
  requireRole(["admin", "staff", "student"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const authReq = req as AuthRequest;
      const studentScope = authReq.auth?.role === "student" ? authReq.auth.userId : undefined;
      const applications = await service.listStudentExamApplications(status, studentScope);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.patch(
  "/exam-applications/:id/decision",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decided = await service.decideStudentExamApplication(req.params.id, req.body);
      if (!decided) {
        res.status(404).json({ message: "Exam application not found" });
        return;
      }
      res.json(decided);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/invigilation-applications",
  requireAuth,
  requireRole(["staff", "admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const created = await service.createInvigilationApplication(authReq.auth!.userId, req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/invigilation-applications",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const applications = await service.listInvigilationApplications(status);
      res.json(applications);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.patch(
  "/invigilation-applications/:id/decision",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decided = await service.decideInvigilationApplication(req.params.id, req.body);
      if (!decided) {
        res.status(404).json({ message: "Invigilation application not found" });
        return;
      }
      res.json(decided);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/subjects",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createSubject(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/subjects",
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const subjects = await service.listSubjects();
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.patch(
  "/subjects/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateSubject(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Subject not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.delete(
  "/subjects/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await service.deleteSubject(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Subject not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/exams",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createExam(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/exams",
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const exams = await service.listExams();
      res.json(exams);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.patch(
  "/exams/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateExam(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Exam not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.delete(
  "/exams/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await service.deleteExam(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Exam not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/generate-advanced",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const generated = await service.generateAdvancedTimetable(req.body);
      res.status(201).json(generated);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/:id/notify",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.notifyTimetablePublished(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/:id/reminders",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hoursBefore =
        typeof req.body?.hoursBefore === "number" && Number.isFinite(req.body.hoursBefore)
          ? req.body.hoursBefore
          : undefined;
      const result = await service.sendReminderNotifications({
        runId: req.params.id,
        hoursBefore,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/generate",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const generated = await service.generateTimetable(req.body);
      res.status(201).json(generated);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/timetable-runs/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getTimetableRunWithSessions(req.params.id);
      if (!data) {
        res.status(404).json({ message: "Timetable run not found" });
        return;
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.patch(
  "/exam-sessions/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateExamSession(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Exam session not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.get(
  "/timetable-runs/:id/ai-insights",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const insights = await service.getTimetableAiInsights(req.params.id);
      if (!insights) {
        res.status(404).json({ message: "Timetable run not found" });
        return;
      }
      res.json(insights);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/:id/approve",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const run = await service.approveTimetableRun(req.params.id, authReq.auth!.userId, req.body?.note);
      res.json(run);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/:id/publish",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await service.publishTimetableRun(req.params.id);
      res.json(run);
    } catch (error) {
      next(error);
    }
  },
);

examTimetableAutoGenerationRouter.post(
  "/timetable-runs/ai-simulate",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = service.simulateTimetablePlan(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
