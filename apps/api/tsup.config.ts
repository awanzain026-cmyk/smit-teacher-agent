import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/serverless.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  sourcemap: true,
  external: ["@prisma/client", "pino-pretty"],
  noExternal: ["@smit/shared"],
});
