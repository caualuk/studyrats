import { cn } from "@/lib/cn";

/** Pulsing placeholder block, used by route-level loading.tsx skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />;
}
