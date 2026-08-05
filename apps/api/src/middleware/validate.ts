import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../lib/apiError.js";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      next(ApiError.badRequest("Invalid request input", details));
      return;
    }
    next();
  };
}
