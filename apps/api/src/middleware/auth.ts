import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { ApiError } from "../lib/apiError.js";
import type { UserRole } from "@smit/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(ApiError.unauthorized("Missing access token"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}
