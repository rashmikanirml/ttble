export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, message, "BAD_REQUEST", details);
}

export function unauthorized(message = "Authentication required"): AppError {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Insufficient permissions"): AppError {
  return new AppError(403, message, "FORBIDDEN");
}

export function notFound(message: string): AppError {
  return new AppError(404, message, "NOT_FOUND");
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, message, "CONFLICT", details);
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(500, error.message, "INTERNAL_ERROR");
  }

  return new AppError(500, "Unexpected server error", "INTERNAL_ERROR");
}