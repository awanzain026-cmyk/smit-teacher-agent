import { conversationRepo, messageRepo } from "../repositories/conversationRepo.js";
import { safeCourseId } from "../lib/courseAccess.js";
import { ApiError } from "../lib/apiError.js";
import type { Conversation, Message } from "@prisma/client";

export class ConversationService {
  private titleFrom(content: string): string {
    const clean = content.replace(/\s+/g, " ").trim();
    return clean.slice(0, 60) || "New conversation";
  }

  async listForUser(userId: string) {
    const rows = await conversationRepo.listByUser(userId);
    return rows.map(mapConversation);
  }

  async searchForUser(userId: string, query: string) {
    const rows = await conversationRepo.searchByUser(userId, query);
    return rows.map(mapConversation);
  }

  async getOrCreate(params: {
    userId: string;
    conversationId?: string | null;
    courseId?: string | null;
    firstMessage: string;
  }): Promise<{ conversation: Conversation; isNew: boolean }> {
    if (params.conversationId) {
      const conversation = await conversationRepo.findById(params.conversationId);
      if (!conversation) throw ApiError.notFound("Conversation not found");
      if (conversation.userId !== params.userId) throw ApiError.forbidden();
      return { conversation, isNew: false };
    }

    const courseId = await safeCourseId(params.courseId, params.userId);
    const conversation = await conversationRepo.create({
      userId: params.userId,
      title: this.titleFrom(params.firstMessage),
      courseId,
    });
    return { conversation, isNew: true };
  }

  async getWithMessages(userId: string, conversationId: string) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.userId !== userId) throw ApiError.forbidden();

    const messages = await messageRepo.listByConversation(conversationId);
    return { conversation: mapConversation(conversation), messages: messages.map(mapMessage) };
  }

  async rename(userId: string, conversationId: string, title: string) {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.userId !== userId) throw ApiError.forbidden();
    return conversationRepo.rename(conversationId, title);
  }

  async remove(userId: string, conversationId: string): Promise<void> {
    const conversation = await conversationRepo.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.userId !== userId) throw ApiError.forbidden();
    await conversationRepo.delete(conversationId);
  }

  async historyForChat(conversationId: string): Promise<{ role: "user" | "model"; content: string }[]> {
    const messages = await messageRepo.listByConversation(conversationId);
    return messages
      .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
      .map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("model" as const), content: m.content }));
  }
}

function mapConversation(c: Conversation) {
  return {
    id: c.id,
    title: c.title,
    courseId: c.courseId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapMessage(m: Message) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    sources: (m.sources as unknown) ?? [],
    createdAt: m.createdAt.toISOString(),
  };
}

export const conversationService = new ConversationService();
