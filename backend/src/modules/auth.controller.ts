import { NextFunction, Request, Response, Router } from "express";
import { signAuthToken } from "../auth/jwt.js";
import { db } from "../config/db.js";
import { validateBody, validators } from "../middleware/validation.js";

export const authRouter = Router();

authRouter.post(
  "/auth/login",
  validateBody({
    email: validators.asString("email", 5, 255),
    password: validators.asString("password", 4, 255),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = String(req.body.email).toLowerCase();
      const password = String(req.body.password);

      const result = await db.query(
        `select id, email, role, password_hash, status
         from users where email = $1`,
        [email],
      );

      if (!result.rowCount) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const user = result.rows[0];
      if (user.status !== "active") {
        res.status(403).json({ message: "User account is inactive" });
        return;
      }

      if (user.password_hash !== password) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const token = signAuthToken({ userId: user.id, role: user.role, email: user.email });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
