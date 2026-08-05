import type { SourceReference } from "@smit/shared";
import { chunkText, estimateTokens } from "./chunkerService.js";
import { getLlm } from "./llmService.js";
import { qdrantService } from "./qdrantService.js";
import { logger } from "../lib/logger.js";
import { randomUUID } from "node:crypto";

const MAX_CONTEXT_TOKENS = 2600;
const MAX_HISTORY_TURNS = 8;

export interface RerankedChunk {
  text: string;
  fileName: string;
  documentId: string;
  page: number | null;
  score: number;
}

export interface RagQueryResult {
  chunks: RerankedChunk[];
  context: string;
}

export class RagService {
  async ingestDocument(params: {
    documentId: string;
    userId: string;
    courseId: string | null;
    fileName: string;
    text: string;
  }): Promise<number> {
    const chunks = chunkText(params.text);
    if (chunks.length === 0) {
      throw new Error("Document produced no usable chunks");
    }

    const points = [];
    for (let i = 0; i < chunks.length; i += 8) {
      const batch = chunks.slice(i, i + 8);
      const vectors = await getLlm().embed(batch.map((c) => c.text));
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const vector = vectors[j];
        if (!chunk || !vector) continue;
        points.push({
          id: randomUUID(),
          vector,
          payload: {
            userId: params.userId,
            courseId: params.courseId,
            documentId: params.documentId,
            fileName: params.fileName,
            page: chunk.page,
            chunkIndex: chunk.index,
            chunkText: chunk.text,
          },
        });
      }
      logger.debug({ documentId: params.documentId, embedded: points.length }, "Embedded batch");
    }

    if (points.length === 0) {
      throw new Error("Embedding produced no points");
    }

    await qdrantService.upsert(points);
    return chunks.length;
  }

  async query(params: {
    userId: string;
    question: string;
    courseId?: string | null;
  }): Promise<RagQueryResult> {
    const [questionVector] = await getLlm().embed([params.question]);
    if (!questionVector) {
      throw new Error("Embedding provider returned no vector for the question");
    }

    const hits = await qdrantService.search(questionVector, {
      limit: 8,
      scoreThreshold: 0.3,
      courseId: params.courseId ?? null,
      userId: params.userId,
    });

    const chunks: RerankedChunk[] = [];
    let usedTokens = 0;

    for (const hit of hits) {
      const text = hit.payload?.chunkText ?? "";
      const tokens = estimateTokens(text);
      if (usedTokens + tokens > MAX_CONTEXT_TOKENS) break;
      if (chunks.length >= 6) break;
      chunks.push({
        text,
        fileName: hit.payload?.fileName ?? "Unknown document",
        documentId: hit.payload?.documentId ?? "",
        page: hit.payload?.page ?? null,
        score: hit.score,
      });
      usedTokens += tokens;
    }

    return {
      chunks,
      context: chunks
        .map(
          (c) =>
            `[Source: ${c.fileName}${c.page ? `, page ${c.page}` : ""}]\n${c.text}`,
        )
        .join("\n\n---\n\n"),
    };
  }

  buildSources(chunks: RerankedChunk[]): SourceReference[] {
    const seen = new Set<string>();
    const sources: SourceReference[] = [];
    for (const c of chunks) {
      const key = `${c.documentId}:${c.page ?? "x"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push({
        documentId: c.documentId,
        fileName: c.fileName,
        page: c.page,
        snippet: c.text.slice(0, 220),
      });
    }
    return sources;
  }

  trimHistory(
    history: { role: "user" | "model"; content: string }[],
    maxTurns = MAX_HISTORY_TURNS,
  ): { role: "user" | "model"; content: string }[] {
    return history.slice(-maxTurns);
  }
}

export const ragService = new RagService();
