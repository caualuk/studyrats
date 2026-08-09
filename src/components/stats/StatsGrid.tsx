import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type Stat = { value: ReactNode; label: string; href?: string };

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
      {stats.map((stat) => {
        const cardClassName = cn(
          "text-center",
          size === "md" ? "px-2.5 py-4" : "px-1.5 py-3.5",
          stat.href && "transition-colors hover:border-border-strong"
        );
        const content = (
          <>
            <div className={cn("font-extrabold text-white", size === "md" ? "text-[22px]" : "text-lg")}>
              {stat.value}
            </div>
            <div className="mt-0.5 text-[10px] text-white/45">{stat.label}</div>
          </>
        );

        if (stat.href) {
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className={cardClassName}>{content}</Card>
            </Link>
          );
        }

        return (
          <Card key={stat.label} className={cardClassName}>
            {content}
          </Card>
        );
      })}
    </div>
  );
}
