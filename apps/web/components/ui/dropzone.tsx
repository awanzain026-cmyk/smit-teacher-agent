"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, FileText, File as FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  loading?: boolean;
  multiple?: boolean;
  className?: string;
}

export function Dropzone({
  onFiles,
  accept = ".pdf,.docx,.pptx,.txt",
  maxSizeMB = 15,
  loading = false,
  multiple = true,
  className,
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list);
      onFiles(files);
    },
    [onFiles],
  );

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!loading) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        loading && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:scale-105">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {loading ? "Processing…" : "Drag & drop or click to upload"}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          PDF, DOCX, PPTX, TXT · up to {maxSizeMB}MB
        </p>
      </div>
      <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
        <FileIcon className="h-3 w-3" />
        Course material
      </div>
    </button>
  );
}

export { formatBytes };
