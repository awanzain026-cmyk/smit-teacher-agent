import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
    return;
  }

  logger.error({ err }, "Unhandled error");

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: env.NODE_ENV === "production" ? "An unexpected error occurred" : String(err),
    },
  });
}
