import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export function Logo({ className, iconClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName,
        )}
      >
        <GraduationCap className="h-4.5 w-4.5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">SMIT Agent</span>
        <span className="text-[10px] font-medium text-muted-foreground">AI Teaching Assistant</span>
      </div>
    </div>
  );
}
