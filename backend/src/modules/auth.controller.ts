import { NextFunction, Request, Response, Router } from "express";
import { signAuthToken } from "../auth/jwt.js";
import { db } from "../config/db.js";
import { unauthorized } from "../lib/errors.js";
import { hashPassword, shouldUpgradePasswordHash, verifyPassword } from "../lib/security.js";
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
        throw unauthorized("Invalid credentials");
      }

      const user = result.rows[0];
      if (user.status !== "active") {
        throw unauthorized("User account is inactive");
      }

      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        throw unauthorized("Invalid credentials");
      }

      if (shouldUpgradePasswordHash(user.password_hash)) {
        const hashedPassword = await hashPassword(password);
        await db.query(`update users set password_hash = $1, updated_at = now() where id = $2`, [hashedPassword, user.id]);
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
