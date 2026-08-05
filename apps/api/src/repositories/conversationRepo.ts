import type { Prisma, Conversation, Message } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const conversationRepo = {
  create(data: Prisma.ConversationUncheckedCreateInput): Promise<Conversation> {
    return prisma.conversation.create({ data });
  },

  findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({ where: { id } });
  },

  listByUser(userId: string): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  },

  searchByUser(userId: string, query: string): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId, title: { contains: query, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  },

  rename(id: string, title: string): Promise<Conversation> {
    return prisma.conversation.update({ where: { id }, data: { title } });
  },

  touch(id: string): Promise<Conversation> {
    return prisma.conversation.update({ where: { id }, data: {} });
  },

  delete(id: string): Promise<Conversation> {
    return prisma.conversation.delete({ where: { id } });
  },
};

export const messageRepo = {
  create(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return prisma.message.create({ data });
  },

  listByConversation(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  },

  deleteAllForConversation(conversationId: string): Promise<{ count: number }> {
    return prisma.message.deleteMany({ where: { conversationId } });
  },
};
