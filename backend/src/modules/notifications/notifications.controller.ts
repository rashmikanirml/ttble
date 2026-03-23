import { NextFunction, Request, Response, Router } from "express";
import { db } from "../../config/db.js";
import { AuthRequest, requireAuth } from "../../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const result = await db.query(
      `select id, kind, title, message, entity_key, payload_json, is_read, created_at, read_at
       from in_app_notifications
       where user_id = $1
       order by created_at desc
       limit 100`,
      [authReq.auth!.userId],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch("/notifications/:id/read", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const result = await db.query(
      `update in_app_notifications
       set is_read = true, read_at = now()
       where id = $1 and user_id = $2
       returning id, is_read, read_at`,
      [req.params.id, authReq.auth!.userId],
    );

    if (!result.rowCount) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});