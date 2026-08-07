import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { RankingRow } from "@/lib/ranking/queries";

export function RankingList({ rows }: { rows: RankingRow[] }) {
  return (
    <Card className="p-2 text-left">
      {rows.map((row) => (
        <div
          key={row.userId}
          className="flex items-center gap-3.5 border-b border-border px-[18px] py-3.5 last:border-b-0"
        >
          <span className="w-[22px] font-bold text-white/40">{row.position}</span>
          <Avatar src={row.avatarUrl} name={row.name} size="lg" />
          <span className="flex-1 text-sm">{row.name}</span>
          <span className="text-[13px] font-bold text-accent">
            {row.checkinsCount} check-ins
          </span>
        </div>
      ))}
    </Card>
  );
}
