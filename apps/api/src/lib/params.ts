import type { Request } from "express";
import { ApiError } from "./apiError.js";

/**
 * Reads a required path param. Route validators guarantee its presence;
 * this centralizes the null-check instead of scattering non-null assertions.
 */
export function reqParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw ApiError.badRequest(`Missing path parameter: ${name}`);
  return value;
}

/** Reads a query param that zod has already defaulted/validated. */
export function reqQuery(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" ? value : undefined;
}
