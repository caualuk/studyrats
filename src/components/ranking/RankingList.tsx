import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatElapsed } from "@/lib/dates";
import { cn } from "@/lib/cn";
import type { RankingMetric, RankingRow } from "@/lib/ranking/queries";

export function RankingList({
  rows,
  metric = "checkins",
}: {
  rows: RankingRow[];
  metric?: RankingMetric;
}) {
  return (
    <Card className="p-2 text-left">
      {rows.map((row) => {
        const rowClassName =
          "flex items-center gap-2.5 border-b border-border px-3 py-3.5 last:border-b-0 sm:gap-3.5 sm:px-[18px]";
        const content = (
          <>
            <span className="w-[18px] shrink-0 font-bold text-white/40 sm:w-[22px]">
              {row.position}
            </span>
            <Avatar src={row.avatarUrl} name={row.name} size="lg" />
            <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
            <span className="shrink-0 text-[13px] font-bold text-accent">
              {metric === "hours" ? formatElapsed(row.studyMs) : `${row.checkinsCount} check-ins`}
            </span>
          </>
        );

        // Only rows from the friends-scoped global ranking carry a username
        // (see RankingRow) -- challenge rankings can include non-friends, so
        // those stay plain to avoid linking to a profile the viewer can't
        // open.
        if (!row.username) {
          return (
            <div key={row.userId} className={rowClassName}>
              {content}
            </div>
          );
        }

        return (
          <Link
            key={row.userId}
            href={`/perfil/${row.username}`}
            className={cn(rowClassName, "transition-colors hover:bg-white/[0.03]")}
          >
            {content}
          </Link>
        );
      })}
    </Card>
  );
}
