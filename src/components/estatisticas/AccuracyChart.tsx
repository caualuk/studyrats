import { cn } from "@/lib/cn";

/**
 * Two horizontal meter-bars comparing the average questions answered vs.
 * average answered correctly per check-in (within whatever period the
 * caller already filtered to). Each row is direct-labeled (dot + text) so
 * identity never depends on color alone, and the value sits at the bar's
 * tip rather than inside it.
 */
export function AccuracyChart({
  avgAnswered,
  avgCorrect,
}: {
  avgAnswered: number;
  avgCorrect: number;
}) {
  const max = Math.max(1, avgAnswered, avgCorrect);
  const rows = [
    { key: "answered", label: "Respondidas", value: avgAnswered, dot: "bg-white/40", fill: "bg-white/25" },
    { key: "correct", label: "Acertadas", value: avgCorrect, dot: "bg-accent", fill: "bg-accent" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <span className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] text-white/55">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", row.dot)} />
            {row.label}
          </span>
          <div className="h-3 flex-1 rounded-full bg-white/[0.06]">
            <div
              className={cn("h-3 rounded-full transition-[width]", row.fill)}
              style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-[13px] font-bold text-white">
            {row.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
