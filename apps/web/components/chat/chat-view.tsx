"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, streamChat } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { MessageList, type UiMessage } from "./message-list";
import { Composer } from "./composer";
import { ConversationPane } from "./conversation-pane";
import type { SourceReference } from "@smit/shared";

const SUGGESTED_PROMPTS = [
  "Summarize the key concepts in my uploaded notes",
  "Explain the hardest topic in my course material",
  "Create a short practice quiz from my slides",
  "What did the lecture say about this week's topic?",
];

interface ChatViewProps {
  conversationId?: string;
  onConversationCreated: (id: string) => void;
}

export function ChatView({ conversationId, onConversationCreated }: ChatViewProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(conversationId ? true : false);
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api<{ messages: UiMessage[] }>(`/api/v1/conversations/${conversationId}`);
        if (active) setMessages(res.messages.map((m) => ({ ...m, sources: (m.sources ?? []) as SourceReference[] })));
      } catch {
        if (active) toast("error", "Failed to load conversation");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [conversationId, toast]);

  const send = useCallback(
    async (text: string) => {
      if (sendingRef.current) return;
      sendingRef.current = true;

      const userMessage: UiMessage = { id: `local-${Date.now()}`, role: "USER", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setThinking(true);
      setStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      let content = "";
      let sources: SourceReference[] = [];

      const onDone = async (done: { content: string; sources: unknown[] }) => {
        content = done.content || content;
        sources = (done.sources as SourceReference[]) ?? [];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content, sources, streaming: false } : m,
          ),
        );
        setStreaming(false);
        setThinking(false);
      };

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "ASSISTANT", content: "", streaming: true },
      ]);

      try {
        await streamChat(
          { conversationId, message: text },
          {
            onMeta: (meta) => {
              if (meta.conversationId) {
                onConversationCreated(meta.conversationId);
              }
              if (meta.sources && Array.isArray(meta.sources) && meta.sources.length > 0) {
                sources = meta.sources as SourceReference[];
              }
            },
            onToken: (delta) => {
              content += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content } : m)),
              );
            },
            onDone,
            onError: (message) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: content || "Something went wrong.", sources, streaming: false } : m,
                ),
              );
              toast("error", message);
              setStreaming(false);
              setThinking(false);
            },
          },
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: content || "Something went wrong.", sources, streaming: false } : m,
          ),
        );
        toast("error", "Failed to send message");
        setStreaming(false);
        setThinking(false);
      } finally {
        sendingRef.current = false;
      }
    },
    [conversationId, onConversationCreated, toast],
  );

  return (
    <div className="flex h-[calc(100dvh-56px)]">
      <div className="hidden w-64 shrink-0 md:block">
        <ConversationPane />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <MessageList
            messages={messages}
            isThinking={thinking}
            welcomeTitle="Ask your course material anything"
            welcomeSubtitle="Upload your lecture notes and slides, then ask questions. Every answer is grounded in your documents with source citations."
          />
        )}

        {!loading && messages.length === 0 && !thinking ? (
          <div className="grid gap-2 px-4 pb-3 sm:grid-cols-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => void send(prompt)}
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <Composer onSend={(text) => void send(text)} disabled={streaming} />
      </div>
    </div>
  );
}
