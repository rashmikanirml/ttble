import express from "express";
import { toAppError } from "../lib/errors.js";

export function notFoundHandler(req: express.Request, res: express.Response): void {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} was not found`,
  });
}

export function errorHandler(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
): void {
  const appError = toAppError(error);
  res.status(appError.statusCode).json({
    code: appError.code,
    message: appError.message,
    details: appError.details,
  });
}