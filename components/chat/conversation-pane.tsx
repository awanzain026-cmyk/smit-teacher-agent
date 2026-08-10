"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, MessagesSquare, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConversationDto } from "@smit/shared";

export function ConversationPane() {
  const router = useRouter();
  const pathname = usePathname();
  const { error: toastError } = useToast();

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api<{ conversations: ConversationDto[] }>(
          query.trim() ? `/api/v1/conversations/search?q=${encodeURIComponent(query)}` : "/api/v1/conversations",
        );
        if (active) setConversations(res.conversations);
      } catch {
        if (active) toastError("Failed to load conversations");
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(load, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, toastError]);

  const onDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api(`/api/v1/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (pathname === `/chat/${id}`) router.push("/chat");
    } catch {
      toastError("Failed to delete conversation");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-card/40">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2.5">
              <Skeleton className="h-3.5 w-3.5 rounded-sm" />
              <Skeleton className="h-3.5 flex-1 rounded" />
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <MessagesSquare className="h-5 w-5 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {query ? "No conversations match your search." : "No conversations yet. Start a new chat!"}
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const active = pathname === `/chat/${conversation.id}`;
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-2 transition-colors",
                  active ? "bg-accent" : "hover:bg-muted/60",
                )}
              >
                <button
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="min-w-0 flex-1 text-left"
                  aria-current={active || undefined}
                >
                  <p className={cn("truncate text-sm", active ? "font-medium text-accent-foreground" : "text-foreground")}>
                    {conversation.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {new Date(conversation.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
                <button
                  onClick={() => void onDelete(conversation.id)}
                  aria-label={`Delete conversation ${conversation.title}`}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                >
                  {deleting === conversation.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
