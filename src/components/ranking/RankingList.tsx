import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { formatElapsed } from "@/lib/dates";
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
      {rows.map((row) => (
        <div
          key={row.userId}
          className="flex items-center gap-2.5 border-b border-border px-3 py-3.5 last:border-b-0 sm:gap-3.5 sm:px-[18px]"
        >
          <span className="w-[18px] shrink-0 font-bold text-white/40 sm:w-[22px]">
            {row.position}
          </span>
          <Avatar src={row.avatarUrl} name={row.name} size="lg" />
          <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
          <span className="shrink-0 text-[13px] font-bold text-accent">
            {metric === "hours" ? formatElapsed(row.studyMs) : `${row.checkinsCount} check-ins`}
          </span>
        </div>
      ))}
    </Card>
  );
}
