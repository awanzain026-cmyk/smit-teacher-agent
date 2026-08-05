import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "node_modules", ".prisma", "client", "index.js");
const destDir = join(__dirname, "..", "dist", "prisma");
const dest = join(destDir, "client.js");

if (existsSync(src)) {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log("Prisma client copied to dist/prisma/client.js");
}
