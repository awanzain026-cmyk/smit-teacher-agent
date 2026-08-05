"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1.5 min-w-[180px] animate-scale-in rounded-md border bg-card p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
  danger,
  icon,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
