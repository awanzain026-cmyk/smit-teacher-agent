"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import type { SourceReference } from "@smit/shared";
import { cn } from "@/lib/utils";

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      title={source.fileName}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/60",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-semibold text-accent-foreground">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">{source.fileName}</span>
        <span className="block text-[11px] text-muted-foreground">
          {source.page ? `Page ${source.page}` : "Document"}
        </span>
      </span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

export function SourceList({ sources }: { sources: SourceReference[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3 w-3" />
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <SourceCard key={`${source.documentId}-${source.page ?? i}-${i}`} source={source} index={i} />
        ))}
      </div>
    </div>
  );
}
