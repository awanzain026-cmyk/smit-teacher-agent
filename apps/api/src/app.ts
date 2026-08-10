import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { ApiError } from "./lib/apiError.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./lib/asyncHandler.js";

import { authRouter } from "./routes/auth.js";
import { documentRouter } from "./routes/documents.js";
import { courseRouter } from "./routes/courses.js";
import { chatRouter } from "./routes/chat.js";
import { conversationRouter } from "./routes/conversations.js";
import { adminRouter } from "./routes/admin.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith("/health") ?? false } }));

  // On Vercel the function is mounted at /api, so strip that prefix before routing
  if (process.env.VERCEL === "1") {
    app.use((req, _res, next) => {
      if (req.url.startsWith("/api/")) req.url = req.url.slice(4) || "/";
      next();
    });
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/v1", apiLimiter);

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/documents", documentRouter);
  app.use("/api/v1/courses", courseRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/conversations", conversationRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(notFoundHandler);

  // Multer errors (file too large, unexpected field) → friendly 4xx
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "File too large. Maximum size is 15MB." : "File upload failed: " + err.code;
      res.status(413).json({ success: false, error: { code: "UPLOAD_ERROR", message } });
      return;
    }
    next(err);
  });

  app.use(errorHandler);

  return app;
}

export { ApiError };
