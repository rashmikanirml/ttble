import { NextFunction, Request, Response, Router } from "express";
import { StaffAllocationRepeatProrataService } from "../services/staff-allocation-repeat-prorata.service.js";

const service = new StaffAllocationRepeatProrataService();
export const staffAllocationRepeatProrataRouter = Router();

staffAllocationRepeatProrataRouter.post(
  "/staff-availability",
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
