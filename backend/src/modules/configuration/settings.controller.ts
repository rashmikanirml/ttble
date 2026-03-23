import { NextFunction, Request, Response, Router } from "express";
import { AuthRequest, requireAuth, requireRole } from "../../middleware/auth.js";
import { badRequest } from "../../lib/errors.js";
import { SystemSettingsService } from "../../services/system-settings.service.js";

const service = new SystemSettingsService();
export const settingsRouter = Router();

settingsRouter.get("/settings", requireAuth, requireRole(["admin", "staff"]), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await service.list();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

settingsRouter.put("/settings/:key", requireAuth, requireRole(["admin"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const key = req.params.key?.trim();
    if (!key) {
      throw badRequest("Setting key is required");
    }

    if (!Object.prototype.hasOwnProperty.call(req.body ?? {}, "value")) {
      throw badRequest("Request body must include a value field");
    }

    const updated = await service.upsert(
      {
        key,
        value: req.body.value,
        description: typeof req.body.description === "string" ? req.body.description : undefined,
      },
      authReq.auth!.userId,
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
});