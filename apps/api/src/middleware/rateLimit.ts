import { rateLimit } from "express-rate-limit";

import { ApiError } from "../lib/apiError.js";

const standard = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw ApiError.tooManyRequests();
  },
} as const;

export const authLimiter = rateLimit({
  ...standard,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: undefined,
});

export const loginLimiter = rateLimit({
  ...standard,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: undefined,
});

export const apiLimiter = rateLimit({
  ...standard,
  windowMs: 60 * 1000,
  limit: 300,
  message: undefined,
});

export const chatLimiter = rateLimit({
  ...standard,
  windowMs: 60 * 1000,
  limit: 20,
  message: undefined,
});

export const uploadLimiter = rateLimit({
  ...standard,
  windowMs: 60 * 1000,
  limit: 10,
  message: undefined,
});
