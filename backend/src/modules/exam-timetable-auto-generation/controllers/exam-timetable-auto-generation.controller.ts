import { NextFunction, Request, Response, Router } from "express";
import { ExamTimetableAutoGenerationService } from "../services/exam-timetable-auto-generation.service.js";

const service = new ExamTimetableAutoGenerationService();
export const examTimetableAutoGenerationRouter = Router();

examTimetableAutoGenerationRouter.post(
  "/subjects",
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
  "/timetable-runs/generate",
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
  "/timetable-runs/ai-simulate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = service.simulateTimetablePlan(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
