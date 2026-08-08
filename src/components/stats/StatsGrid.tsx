import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type Stat = { value: ReactNode; label: string };

export function StatsGrid({
  stats,
  size = "md",
  className,
}: {
  stats: Stat[];
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3.5 sm:grid-cols-4", className)}>
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={cn("text-center", size === "md" ? "px-2.5 py-4" : "px-1.5 py-3.5")}
        >
          <div className={cn("font-extrabold", size === "md" ? "text-[22px]" : "text-lg")}>
            {stat.value}
          </div>
          <div className="mt-0.5 text-[10px] text-white/45">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}
