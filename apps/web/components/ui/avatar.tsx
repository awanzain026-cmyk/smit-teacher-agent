import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 select-none items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary",
        className,
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}
