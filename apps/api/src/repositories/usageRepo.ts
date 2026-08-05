import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const usageRepo = {
  create(data: Prisma.UsageLogUncheckedCreateInput) {
    return prisma.usageLog.create({ data });
  },

  async dailySummary(since: Date): Promise<{ kind: string; count: number; tokensIn: number; tokensOut: number }[]> {
    const rows = await prisma.usageLog.groupBy({
      by: ["kind"],
      where: { createdAt: { gte: since } },
      _count: { kind: true },
      _sum: { tokensIn: true, tokensOut: true },
    });
    return rows.map((r) => ({
      kind: r.kind,
      count: r._count.kind,
      tokensIn: r._sum.tokensIn ?? 0,
      tokensOut: r._sum.tokensOut ?? 0,
    }));
  },

  countByUser(userId: string, since: Date): Promise<number> {
    return prisma.usageLog.count({ where: { userId, createdAt: { gte: since } } });
  },
};
