import { NextFunction, Request, Response, Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import { validateBody, validators } from "../../../middleware/validation.js";
import { ExamHallResourceManagementService } from "../services/exam-hall-resource-management.service.js";

const service = new ExamHallResourceManagementService();
export const examHallResourceManagementRouter = Router();

examHallResourceManagementRouter.post("/halls", requireAuth, requireRole(["admin", "staff"]), validateBody({
  code: validators.asString("code", 2, 20),
  name: validators.asString("name", 3, 120),
  location: validators.asString("location", 2, 120),
  capacity: validators.asNumber("capacity", 1, 5000),
}), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await service.createHall(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.get("/halls", requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const halls = await service.listHalls();
    res.json(halls);
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.patch("/halls/:id", requireAuth, requireRole(["admin", "staff"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await service.updateHall(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: "Hall not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.delete("/halls/:id", requireAuth, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const archived = await service.archiveHall(req.params.id);
    if (!archived) {
      res.status(404).json({ message: "Hall not found or already inactive" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.put(
  "/halls/:id/facilities",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const facility = await service.upsertHallFacility(req.params.id, req.body);
      res.json(facility);
    } catch (error) {
      next(error);
    }
  },
);

examHallResourceManagementRouter.post(
  "/hall-bookings",
  requireAuth,
  requireRole(["admin", "staff"]),
  validateBody({
    hallId: validators.asString("hallId", 8, 64),
    examSessionId: validators.asString("examSessionId", 8, 64),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await service.createHallBooking(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },
);

examHallResourceManagementRouter.get(
  "/hall-bookings",
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await service.listHallBookings();
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  },
);

examHallResourceManagementRouter.patch(
  "/hall-bookings/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await service.updateHallBooking(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

examHallResourceManagementRouter.delete(
  "/hall-bookings/:id",
  requireAuth,
  requireRole(["admin", "staff"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cancelled = await service.cancelHallBooking(req.params.id);
      if (!cancelled) {
        res.status(404).json({ message: "Booking not found or already cancelled" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
