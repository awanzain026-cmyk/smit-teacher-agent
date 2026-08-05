import { mkdirSync } from "node:fs";

import { createApp } from "./app.js";
import { env, isTest } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { qdrantService } from "./services/qdrantService.js";
import { refreshTokenRepo } from "./repositories/refreshTokenRepo.js";

async function bootstrap() {
  mkdirSync(env.STORAGE_DIR, { recursive: true });

  await prisma.$connect();
  logger.info("PostgreSQL connected");

  try {
    await qdrantService.ensureCollection(env.EMBEDDING_DIM);
  } catch (err) {
    logger.error({ err }, "Qdrant unavailable — ingestion/search will fail. Check QDRANT_URL / QDRANT_API_KEY.");
  }

  setInterval(() => {
    void refreshTokenRepo.deleteExpired().catch(() => undefined);
  }, 60 * 60 * 1000).unref();

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info(`API listening on http://localhost:${env.API_PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

if (!isTest) {
  bootstrap().catch((err) => {
    logger.error({ err }, "Failed to bootstrap API");
    process.exit(1);
  });
}
