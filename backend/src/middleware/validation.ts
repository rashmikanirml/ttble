import { NextFunction, Request, Response } from "express";

type Validator<T> = (value: unknown, body: Record<string, unknown>) => T;

type BodySchema = Record<string, Validator<unknown>>;

function asString(label: string, min = 1, max = 255): Validator<string> {
  return (value) => {
    if (typeof value !== "string") {
      throw new Error(`${label} must be a string`);
    }
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) {
      throw new Error(`${label} must be between ${min} and ${max} characters`);
    }
    return trimmed;
  };
}

function asNumber(label: string, min: number, max: number): Validator<number> {
  return (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(`${label} must be a number`);
    }
    if (value < min || value > max) {
      throw new Error(`${label} must be between ${min} and ${max}`);
    }
    return value;
  };
}

function asEnum(label: string, allowed: string[]): Validator<string> {
  return (value) => {
    if (typeof value !== "string" || !allowed.includes(value)) {
      throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
    }
    return value;
  };
}

function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value, body) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    return validator(value, body);
  };
}

export const validators = {
  asString,
  asNumber,
  asEnum,
  optional,
};

export function validateBody(schema: BodySchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const source = (req.body || {}) as Record<string, unknown>;
      const parsed: Record<string, unknown> = { ...source };

      for (const key of Object.keys(schema)) {
        parsed[key] = schema[key](source[key], source);
      }

      req.body = parsed;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request body";
      res.status(400).json({ message });
    }
  };
}
