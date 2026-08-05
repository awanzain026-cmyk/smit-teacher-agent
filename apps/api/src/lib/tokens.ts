import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const JWT_ALGO = "HS256";

export interface AccessTokenPayload {
  sub: string;
  role: "STUDENT" | "ADMIN";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGO,
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALGO] }) as AccessTokenPayload;
}

export function signRefreshToken(payload: { jti: string; sub: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGO,
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): { jti: string; sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: [JWT_ALGO] }) as { jti: string; sub: string };
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateTokenId(): string {
  return randomBytes(24).toString("base64url");
}

export function refreshExpiryDays(): number {
  const match = /^(\d+)d$/.exec(env.JWT_REFRESH_TTL);
  return match ? Number(match[1]) : 30;
}

export function toDateAfterDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
