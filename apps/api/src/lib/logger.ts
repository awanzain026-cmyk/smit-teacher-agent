import pino from "pino";
import { env, isTest } from "../config/env.js";

export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});
