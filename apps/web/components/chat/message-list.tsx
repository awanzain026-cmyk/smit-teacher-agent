"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { SourceList } from "./source-card";
import type { SourceReference } from "@smit/shared";

export interface UiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: SourceReference[];
  streaming?: boolean;
}

interface MessageListProps {
  messages: UiMessage[];
  isThinking: boolean;
  welcomeTitle: string;
  welcomeSubtitle: string;
}

export function MessageList({ messages, isThinking, welcomeTitle, welcomeSubtitle }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{welcomeTitle}</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{welcomeSubtitle}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {messages.map((message) =>
        message.role === "USER" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
              {message.content}
            </div>
          </div>
        ) : (
          <div key={message.id} className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "rounded-lg rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm",
                  message.streaming && "animate-fade-in",
                )}
              >
                <Markdown content={message.content} />
              </div>
              {message.sources && message.sources.length > 0 ? (
                <SourceList sources={message.sources} />
              ) : null}
            </div>
          </div>
        ),
      )}

      {isThinking ? (
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg rounded-tl-sm border border-border bg-card px-4 py-3.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return <User className={cn("h-4 w-4", className)} />;
}
