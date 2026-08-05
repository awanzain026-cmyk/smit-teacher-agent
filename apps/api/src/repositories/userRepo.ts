import type { Prisma, User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const userRepo = {
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  list(params: { skip: number; take: number; search?: string }): Promise<User[]> {
    return prisma.user.findMany({
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  },

  count(params: { search?: string } = {}): Promise<number> {
    return prisma.user.count({
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : undefined,
    });
  },

  updateRole(id: string, role: "STUDENT" | "ADMIN"): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role } });
  },

  delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
};
