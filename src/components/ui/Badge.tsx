import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "accent" | "dark";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  accent: "bg-black/55 text-accent",
  dark: "bg-white/5 text-white/60 border border-border-strong",
};

export function Badge({
  className,
  variant = "accent",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-1 text-[10px] font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
