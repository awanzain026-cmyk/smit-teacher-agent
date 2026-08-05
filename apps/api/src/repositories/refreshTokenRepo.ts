import type { Prisma, RefreshToken } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const refreshTokenRepo = {
  create(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  },

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revoke(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  deleteExpired(): Promise<{ count: number }> {
    return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
