import { promises as fs } from "node:fs";
import path from "node:path";
import officeparser from "officeparser";

import { ApiError } from "../lib/apiError.js";

export interface ParsedDocument {
  text: string;
  pageCount: number | null;
}

const MIN_EXTRACTED_CHARS = 80;

export async function parseDocument(filePath: string, mimeType: string): Promise<ParsedDocument> {
  try {
    if (mimeType === "text/plain") {
      const raw = await fs.readFile(filePath, "utf-8");
      return { text: raw, pageCount: null };
    }

    const raw = await officeparser.parseOfficeAsync(filePath);
    const normalized = normalizeText(raw);
    const pageCount = mimeType === "application/pdf" ? await estimatePdfPages(filePath) : null;

    if (normalized.length < MIN_EXTRACTED_CHARS) {
      throw new ApiError(
        422,
        "UNPROCESSABLE_DOCUMENT",
        "This file contains very little extractable text. Scanned PDFs or image-based files are not supported.",
      );
    }

    return { text: normalized, pageCount };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(422, "UNPROCESSABLE_DOCUMENT", "Failed to extract text from this document");
  }
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function estimatePdfPages(filePath: string): Promise<number | null> {
  try {
    const data = await fs.readFile(filePath);
    const str = data.toString("latin1");
    const matches = str.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    const countMatches = str.match(/\/Count\s+(\d+)/g);
    if (countMatches) {
      const counts = countMatches.map((m) => Number(/(\d+)/.exec(m)?.[1]));
      return Math.max(...counts);
    }
    return null;
  } catch {
    return null;
  }
}

export function safeOriginalName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, "").trim();
  return base.slice(0, 200) || "document";
}
