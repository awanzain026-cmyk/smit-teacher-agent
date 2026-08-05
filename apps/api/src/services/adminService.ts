import { documentRepo } from "../repositories/documentRepo.js";
import { userRepo } from "../repositories/userRepo.js";
import { usageRepo } from "../repositories/usageRepo.js";
import { prisma } from "../lib/prisma.js";

export class AdminService {
  async stats() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [users, admins, documents, readyDocs, conversations, messages, usage] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.document.count(),
      prisma.document.count({ where: { status: "READY" } }),
      prisma.conversation.count(),
      prisma.message.count(),
      usageRepo.dailySummary(since),
    ]);

    return {
      users,
      admins,
      documents,
      readyDocuments: readyDocs,
      conversations,
      messages,
      usage: usage.map((u) => ({
        kind: u.kind,
        count: u.count,
        tokensIn: Number(u.tokensIn),
        tokensOut: Number(u.tokensOut),
      })),
    };
  }

  async listUsers(params: { page: number; limit: number; search?: string }) {
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      userRepo.list({ skip, take: params.limit, search: params.search }),
      userRepo.count({ search: params.search }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        documentCount: 0,
      })),
      page: params.page,
      limit: params.limit,
      total,
      hasMore: params.page * params.limit < total,
    };
  }

  async listDocuments(params: { page: number; limit: number; search?: string; status?: string }) {
    const skip = (params.page - 1) * params.limit;
    const where = {
      ...(params.search ? { originalName: { contains: params.search, mode: "insensitive" as const } } : {}),
      ...(params.status ? { status: params.status as never } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } }, course: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
      prisma.document.count({ where }),
    ]);

    return {
      items: items.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        status: d.status,
        chunkCount: d.chunkCount,
        failReason: d.failReason,
        courseName: d.course?.name ?? null,
        user: d.user,
        createdAt: d.createdAt.toISOString(),
      })),
      page: params.page,
      limit: params.limit,
      total,
      hasMore: params.page * params.limit < total,
    };
  }
}

export const adminService = new AdminService();
