import { NextFunction, Request, Response, Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import { validateBody, validators } from "../../../middleware/validation.js";
import { StaffAllocationRepeatProrataService } from "../services/staff-allocation-repeat-prorata.service.js";

const service = new StaffAllocationRepeatProrataService();
export const staffAllocationRepeatProrataRouter = Router();

staffAllocationRepeatProrataRouter.post(
  "/staff-availability",
  requireAuth,
  requireRole(["admin", "staff"]),
  validateBody({
    staffId: validators.asString("staffId", 8, 64),
    availableDate: validators.asString("availableDate", 10, 10),
    startTime: validators.asString("startTime", 4, 8),
    endTime: validators.asString("endTime", 4, 8),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createAvailability(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.get(
  "/staff-availability",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = typeof req.query.staffId === "string" ? req.query.staffId : undefined;
      const list = await service.listAvailability(staffId);
      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.patch(
  "/staff-availability/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateAvailability(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Availability not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.delete(
  "/staff-availability/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await service.deleteAvailability(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Availability not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.post(
  "/staff-assignments",
  requireAuth,
  requireRole(["admin", "staff"]),
  validateBody({
    examSessionId: validators.asString("examSessionId", 8, 64),
    staffId: validators.asString("staffId", 8, 64),
    roleInSession: validators.asEnum("roleInSession", ["invigilator", "supervisor", "LIC", "support"]),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createAssignment(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.get(
  "/staff-assignments",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const staffId = typeof req.query.staffId === "string" ? req.query.staffId : undefined;
      const list = await service.listAssignments(staffId);
      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.patch(
  "/staff-assignments/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateAssignment(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Assignment not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.delete(
  "/staff-assignments/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cancelled = await service.cancelAssignment(req.params.id);
      if (!cancelled) {
        res.status(404).json({ message: "Assignment not found or already cancelled" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.post(
  "/repeat-prorata-applications",
  requireAuth,
  requireRole(["student", "admin", "staff"]),
  validateBody({
    studentId: validators.asString("studentId", 8, 64),
    applicationType: validators.asEnum("applicationType", ["repeat", "pro-rata"]),
    subjectId: validators.optional(validators.asString("subjectId", 8, 64)),
    examId: validators.optional(validators.asString("examId", 8, 64)),
    reason: validators.optional(validators.asString("reason", 6, 400)),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createApplication(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.get(
  "/repeat-prorata-applications",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = typeof req.query.studentId === "string" ? req.query.studentId : undefined;
      const list = await service.listApplications(studentId);
      res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.patch(
  "/repeat-prorata-applications/:id/decision",
  requireAuth,
  requireRole(["admin", "staff"]),
  validateBody({
    approverId: validators.asString("approverId", 8, 64),
    decision: validators.asEnum("decision", ["approved", "rejected"]),
    decisionNote: validators.optional(validators.asString("decisionNote", 2, 400)),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decided = await service.decideApplication(req.params.id, req.body);
      if (!decided) {
        res.status(404).json({ message: "Application not found" });
        return;
      }
      res.json(decided);
    } catch (error) {
      next(error);
    }
  },
);

staffAllocationRepeatProrataRouter.delete(
  "/repeat-prorata-applications/:id",
  requireAuth,
  requireRole(["student", "admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const withdrawn = await service.withdrawApplication(req.params.id);
      if (!withdrawn) {
        res.status(400).json({ message: "Only pending applications can be withdrawn" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
