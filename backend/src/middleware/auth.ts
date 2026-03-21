import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../auth/jwt.js";

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
    res.status(401).json({ message: "Missing Bearer token" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.auth = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
