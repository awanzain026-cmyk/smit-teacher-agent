import { QdrantClient } from "@qdrant/js-client-rest";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    userId: string;
    courseId: string | null;
    documentId: string;
    fileName: string;
    page: number | null;
    chunkIndex: number;
    chunkText: string;
  };
}

export interface SearchHit {
  score: number;
  payload: VectorPoint["payload"];
}

const BATCH_SIZE = 64;

class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: env.QDRANT_URL,
      ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
    });
  }

  async ensureCollection(dim: number): Promise<void> {
    const name = env.QDRANT_COLLECTION;
    const existing = await this.client.getCollections().catch(() => ({ collections: [] }));
    const found = existing.collections.some((c) => c.name === name);

    if (!found) {
      await this.client.createCollection(name, {
        vectors: { size: dim, distance: "Cosine" },
      });
      logger.info({ collection: name, dim }, "Created Qdrant collection");
    } else {
      const info = await this.client.getCollection(name);
      const size = info.config?.params?.vectors as { size?: number } | undefined;
      if (size?.size !== dim) {
        throw new Error(`Qdrant collection "${name}" has dim ${size?.size}, expected ${dim}`);
      }
    }
  }

  async upsert(points: VectorPoint[]): Promise<void> {
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);
      await this.client.upsert(env.QDRANT_COLLECTION, {
        wait: true,
        points: batch.map((p) => ({ id: p.id, vector: p.vector, payload: p.payload })),
      });
    }
  }

  async search(
    vector: number[],
    options: { limit?: number; scoreThreshold?: number; courseId?: string | null; userId?: string },
  ): Promise<SearchHit[]> {
    const result = await this.client.search(env.QDRANT_COLLECTION, {
      vector,
      limit: options.limit ?? 6,
      score_threshold: options.scoreThreshold ?? 0.25,
      filter: {
        must: [
          ...(options.courseId ? [{ key: "courseId", match: { value: options.courseId } }] : []),
          ...(options.userId ? [{ key: "userId", match: { value: options.userId } }] : []),
        ],
      },
    });

    return result.map((hit) => ({
      score: hit.score ?? 0,
      payload: hit.payload as SearchHit["payload"],
    }));
  }

  async deleteByDocument(documentId: string): Promise<void> {
    await this.client.delete(env.QDRANT_COLLECTION, {
      wait: true,
      filter: { must: [{ key: "documentId", match: { value: documentId } }] },
    });
  }
}

export const qdrantService = new QdrantService();
