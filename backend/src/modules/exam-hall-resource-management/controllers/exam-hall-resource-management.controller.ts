import { NextFunction, Request, Response, Router } from "express";
import { ExamHallResourceManagementService } from "../services/exam-hall-resource-management.service.js";

const service = new ExamHallResourceManagementService();
export const examHallResourceManagementRouter = Router();

examHallResourceManagementRouter.post("/halls", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await service.createHall(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.get("/halls", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const halls = await service.listHalls();
    res.json(halls);
  } catch (error) {
    next(error);
  }
});

examHallResourceManagementRouter.patch("/halls/:id", async (req: Request, res: Response, next: NextFunction) => {
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

examHallResourceManagementRouter.delete("/halls/:id", async (req: Request, res: Response, next: NextFunction) => {
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
