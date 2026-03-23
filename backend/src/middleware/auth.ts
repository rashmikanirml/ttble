import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../auth/jwt.js";
import { forbidden, unauthorized } from "../lib/errors.js";

export type AuthRequest = Request & {
  auth?: {
    userId: string;
    role: string;
    email: string;
  };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    next(unauthorized("Missing Bearer token"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch (error) {
    next(unauthorized("Invalid or expired token"));
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(unauthorized("Authentication required"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(forbidden("Insufficient permissions"));
      return;
    }

    next();
  };
}
