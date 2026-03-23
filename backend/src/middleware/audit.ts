import express from "express";
import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { AuthRequest } from "./auth.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function auditMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const startedAt = Date.now();
  const bodySnapshot = req.body;

  res.on("finish", () => {
    const auth = (req as AuthRequest).auth;
    const userId = auth?.userId ?? null;

    // Persist audit asynchronously after response so user-facing latency is unaffected.
    void db
      .query(
        `insert into audit_logs (
           id,
           actor_user_id,
           actor_role,
           action,
           method,
           route,
           status_code,
           request_body,
           response_time_ms,
           ip_address,
           user_agent
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)`,
        [
          randomUUID(),
          userId,
          auth?.role ?? null,
          `${req.method.toUpperCase()} ${req.path}`,
          req.method.toUpperCase(),
          req.originalUrl,
          res.statusCode,
          JSON.stringify(bodySnapshot ?? {}),
          Date.now() - startedAt,
          req.ip,
          req.header("user-agent") ?? null,
        ],
      )
      .catch((error) => {
        console.error("Audit log write failed", safeJsonParse(JSON.stringify(error)));
      });
  });

  next();
}