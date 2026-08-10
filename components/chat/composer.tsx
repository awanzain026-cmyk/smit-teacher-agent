"use client";

import { useRef, useState } from "react";
import { SendHorizontal, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({ onSend, disabled, placeholder = "Ask anything about your course material…" }: ComposerProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="border-t border-border/60 bg-background p-3 sm:p-4">
      {attachment ? (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          <span className="flex-1 truncate">
            {attachment.name} · {formatBytes(attachment.size)}
          </span>
          <button onClick={() => setAttachment(null)} aria-label="Remove attachment" className="rounded p-0.5 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-2 rounded-lg border border-input bg-card px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
          disabled && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a document"
          title="Attach a document"
          className="mb-0.5 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setAttachment(file);
            e.target.value = "";
          }}
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          aria-label="Message"
          className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        Answers are generated only from your uploaded course material.
      </p>
    </div>
  );
}
