import { ApiError } from "../lib/apiError.js";
import { documentRepo, courseRepo } from "../repositories/documentRepo.js";
import { usageRepo } from "../repositories/usageRepo.js";
import { deleteStoredFile, storedPath } from "../middleware/upload.js";
import { parseDocument, safeOriginalName } from "./parserService.js";
import { ragService } from "./ragService.js";
import { qdrantService } from "./qdrantService.js";
import { logger } from "../lib/logger.js";
import type { Document } from "@prisma/client";
import { safeCourseId } from "../lib/courseAccess.js";

const PROCESSING = new Set<string>();

export class DocumentService {
  async listForUser(params: {
    userId: string;
    courseId?: string | null;
    search?: string;
    page: number;
    limit: number;
  }) {
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      documentRepo.list({
        userId: params.userId,
        courseId: params.courseId ?? undefined,
        search: params.search,
        skip,
        take: params.limit,
      }),
      documentRepo.count({
        userId: params.userId,
        courseId: params.courseId ?? undefined,
        search: params.search,
      }),
    ]);

    return {
      items: items.map(mapDocument),
      page: params.page,
      limit: params.limit,
      total,
      hasMore: params.page * params.limit < total,
    };
  }

  async create(params: {
    userId: string;
    courseId?: string | null;
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<Document> {
    const courseId = params.courseId ? await safeCourseId(params.courseId, params.userId, true) : null;

    return documentRepo.create({
      userId: params.userId,
      courseId,
      originalName: safeOriginalName(params.originalName),
      storedName: params.storedName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      status: "PENDING",
    });
  }

  async processDocument(document: Document): Promise<void> {
    if (PROCESSING.has(document.id)) return;
    PROCESSING.add(document.id);

    const filePath = storedPath(document.storedName);

    try {
      await documentRepo.update(document.id, { status: "PROCESSING" });

      const parsed = await parseDocument(filePath, document.mimeType);
      const chunkCount = await ragService.ingestDocument({
        documentId: document.id,
        userId: document.userId,
        courseId: document.courseId,
        fileName: document.originalName,
        text: parsed.text,
      });

      await documentRepo.update(document.id, {
        status: "READY",
        pageCount: parsed.pageCount,
        chunkCount,
      });

      await usageRepo.create({ userId: document.userId, kind: "DOC_PROCESS", model: "officeparser" });
      logger.info({ documentId: document.id, chunks: chunkCount }, "Document processed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown processing error";
      await documentRepo.update(document.id, { status: "FAILED", failReason: message });
      logger.error({ documentId: document.id, err }, "Document processing failed");
    } finally {
      PROCESSING.delete(document.id);
    }
  }

  async queueProcessing(document: Document): Promise<void> {
    // Fire-and-forget; failures are recorded on the document row.
    void this.processDocument(document);
  }

  async getOwned(id: string, userId: string, isAdmin: boolean): Promise<Document> {
    const doc = await documentRepo.findById(id);
    if (!doc) throw ApiError.notFound("Document not found");
    if (!isAdmin && doc.userId !== userId) {
      throw ApiError.forbidden();
    }
    return doc;
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const doc = await this.getOwned(id, userId, isAdmin);
    await qdrantService.deleteByDocument(doc.id);
    await documentRepo.delete(doc.id);
    await deleteStoredFile(storedPath(doc.storedName));
  }

  async reprocess(id: string, userId: string, isAdmin: boolean): Promise<Document> {
    const doc = await this.getOwned(id, userId, isAdmin);
    if (doc.status === "PROCESSING") {
      throw ApiError.conflict("Document is already being processed");
    }
    await qdrantService.deleteByDocument(doc.id);
    const reset = await documentRepo.update(doc.id, { status: "PENDING", failReason: null });
    await this.queueProcessing(reset);
    return reset;
  }

  async coursesFor(userId: string) {
    return courseRepo.list();
  }
}

function mapDocument(doc: Awaited<ReturnType<typeof documentRepo.list>>[number]) {
  return {
    id: doc.id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    pageCount: doc.pageCount,
    chunkCount: doc.chunkCount,
    failReason: doc.failReason,
    courseId: doc.courseId,
    courseName: doc.course?.name ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const documentService = new DocumentService();
