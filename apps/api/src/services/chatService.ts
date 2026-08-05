import type { Response } from "express";
import type { SourceReference } from "@smit/shared";

import { ragService } from "./ragService.js";
import { conversationService } from "./conversationService.js";
import { messageRepo } from "../repositories/conversationRepo.js";
import { usageRepo } from "../repositories/usageRepo.js";
import { getLlm } from "./llmService.js";
import { buildRagPrompt, RAG_SYSTEM_PROMPT } from "../lib/promptTemplates.js";
import { ApiError } from "../lib/apiError.js";
import { logger } from "../lib/logger.js";
import type { ChatRequest } from "@smit/shared";

export const REFUSAL_MESSAGE = "I couldn't find this information in the uploaded course material.";

interface SseWriter {
  write(type: string, data: unknown): void;
  end(): void;
  error(message: string): void;
}

function createSseWriter(res: Response): SseWriter {
  return {
    write(type, data) {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    end() {
      res.end();
    },
    error(message) {
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      res.end();
    },
  };
}

export class ChatService {
  async streamChat(params: {
    userId: string;
    userAgent?: string;
    body: ChatRequest;
    res: Response;
  }): Promise<void> {
    const { userId, body, res } = params;

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const sse = createSseWriter(res);
    let closed = false;
    const onClose = () => {
      closed = true;
    };
    res.on("close", onClose);

    try {
      const question = body.message.trim();
      if (!question) throw ApiError.badRequest("Message cannot be empty");

      const { conversation, isNew } = await conversationService.getOrCreate({
        userId,
        conversationId: body.conversationId ?? null,
        courseId: body.courseId ?? null,
        firstMessage: question,
      });

      if (isNew) {
        sse.write("conversation", { id: conversation.id, title: conversation.title });
      }

      await messageRepo.create({
        conversationId: conversation.id,
        userId,
        role: "USER",
        content: question,
      });

      const history = await conversationService.historyForChat(conversation.id);
      const trimmedHistory = ragService.trimHistory(history);

      const { chunks, context } = await ragService.query({
        userId,
        question,
        courseId: conversation.courseId ?? body.courseId ?? null,
      });

      if (chunks.length === 0) {
        const saved = await messageRepo.create({
          conversationId: conversation.id,
          userId,
          role: "ASSISTANT",
          content: REFUSAL_MESSAGE,
          sources: [],
        });
        sse.write("meta", { conversationId: conversation.id, messageId: saved.id });
        sse.write("message", { content: REFUSAL_MESSAGE, done: true, sources: [] });
        sse.end();
        return;
      }

      const sources = ragService.buildSources(chunks);
      const prompt = buildRagPrompt(question, context);

      let content = "";
      let messageId: string | null = null;
      let usage = { tokensIn: 0, tokensOut: 0 };

      sse.write("meta", { conversationId: conversation.id, messageId: null, sources });

      const provider = getLlm();
      const stream = provider.streamChat(
        [...trimmedHistory, { role: "user" as const, content: prompt }],
        { system: RAG_SYSTEM_PROMPT, temperature: 0.3, maxTokens: 1024 },
      );

      for await (const delta of stream) {
        if (closed) return;
        content += delta;
        sse.write("token", { delta });
      }

      if (closed) return;

      const saved = await messageRepo.create({
        conversationId: conversation.id,
        userId,
        role: "ASSISTANT",
        content: content || REFUSAL_MESSAGE,
        sources: sources as unknown as object,
      });
      messageId = saved.id;
      usage = { tokensIn: Math.round(context.length / 4), tokensOut: Math.round(content.length / 4) };

      await usageRepo.create({
        userId,
        kind: "CHAT",
        model: provider.model,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
      });

      sse.write("message", { content: content || REFUSAL_MESSAGE, done: true, messageId, sources });
      sse.end();
    } catch (err) {
      if (closed) return;
      const message = err instanceof ApiError ? err.message : "Something went wrong while answering";
      if (!(err instanceof ApiError)) {
        logger.error({ err, userId }, "Chat stream failed");
      }
      sse.error(message);
    } finally {
      res.off("close", onClose);
    }
  }
}

export const chatService = new ChatService();
