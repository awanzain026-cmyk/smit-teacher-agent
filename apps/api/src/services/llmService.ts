import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { logger } from "../lib/logger.js";

export interface LlmChatMessage {
  role: "user" | "model";
  content: string;
}

export interface LlmChatOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  embed(texts: string[]): Promise<number[][]>;
  streamChat(messages: LlmChatMessage[], options?: LlmChatOptions): AsyncGenerator<string, void, unknown>;
  complete(messages: LlmChatMessage[], options?: LlmChatOptions): Promise<string>;
}

class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  readonly model: string;

  private client: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini");
    }
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = env.GEMINI_CHAT_MODEL;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({ model: env.GEMINI_EMBED_MODEL });
    const results: number[][] = [];
    for (const text of texts) {
      const res = await model.embedContent(text);
      results.push(res.embedding.values);
    }
    return results;
  }

  async *streamChat(
    messages: LlmChatMessage[],
    options: LlmChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
      systemInstruction: options.system,
    });

    const stream = await model.generateContentStream({
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    });

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async complete(messages: LlmChatMessage[], options: LlmChatOptions = {}): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
      systemInstruction: options.system,
    });

    const result = await model.generateContent({
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    });

    return result.response.text();
  }
}

class OpenRouterProvider implements LlmProvider {
  readonly name = "openrouter";
  readonly model: string;

  constructor() {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter");
    }
    this.model = env.OPENROUTER_MODEL;
  }

  async embed(texts: string[]): Promise<number[][]> {
    throw new ApiError(500, "EMBEDDING_UNAVAILABLE", "OpenRouter does not provide embeddings; set LLM_PROVIDER=gemini");
  }

  async *streamChat(
    messages: LlmChatMessage[],
    options: LlmChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    const body = {
      model: this.model,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        ...messages,
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok || !res.body) {
      throw new ApiError(502, "LLM_UPSTREAM_ERROR", `OpenRouter returned ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            logger.warn("Failed to parse OpenRouter stream chunk");
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async complete(messages: LlmChatMessage[], options: LlmChatOptions = {}): Promise<string> {
    let text = "";
    for await (const delta of this.streamChat(messages, options)) {
      text += delta;
    }
    return text;
  }
}

let llmInstance: LlmProvider | null = null;

/**
 * Lazily constructs the LLM provider so importing services never fails at
 * module load when a provider key is absent (e.g. unit tests, boot order).
 */
export function getLlm(): LlmProvider {
  if (!llmInstance) {
    const provider = env.LLM_PROVIDER;
    llmInstance = provider === "openrouter" ? new OpenRouterProvider() : new GeminiProvider();
  }
  return llmInstance;
}
