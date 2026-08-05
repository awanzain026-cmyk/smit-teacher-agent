import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { FILE_MIME_TYPES, MAX_FILE_MB } from "@smit/shared";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".pptx", ".txt"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

function sniffMagicBytes(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  // DOCX / PPTX are ZIP containers (PK..)
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "application/zip";
  }
  return null;
}

export const upload = multer({
  storage,
  limits: {
    fileSize: (env.MAX_FILE_MB || MAX_FILE_MB) * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !FILE_MIME_TYPES.includes(file.mimetype as (typeof FILE_MIME_TYPES)[number])) {
      cb(ApiError.badRequest("Only PDF, DOCX, PPTX and TXT files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function validateFileSignature(req: Express.Request) {
  const file = (req as { file?: Express.Multer.File }).file;
  if (!file) {
    throw ApiError.badRequest("No file uploaded");
  }
  return file;
}

export async function assertKnownFileType(filePath: string, mimeType: string): Promise<void> {
  const fd = await fs.open(filePath, "r");
  try {
    const { buffer } = await fd.read({ buffer: Buffer.alloc(8), position: 0 });
    const magic = sniffMagicBytes(buffer);
    if (mimeType === "application/pdf" && magic !== "application/pdf") {
      throw ApiError.badRequest("File content does not match PDF format");
    }
    if (
      (mimeType.includes("wordprocessingml") || mimeType.includes("presentationml")) &&
      magic !== "application/zip"
    ) {
      throw ApiError.badRequest("File content does not match the declared Office format");
    }
  } finally {
    await fd.close();
  }
}

export function deleteStoredFile(filePath: string): Promise<void> {
  return fs.unlink(filePath).catch(() => undefined);
}

export function storedPath(storedName: string): string {
  return path.join(env.STORAGE_DIR, storedName);
}
