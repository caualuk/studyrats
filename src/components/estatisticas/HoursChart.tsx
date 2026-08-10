import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/cn";

export type HoursBar = {
  key: string;
  label: string;
  /** Full date, e.g. "10/08/2026" -- used in the hover tooltip, where the axis's short label (a weekday letter or bare day number) would be ambiguous on its own. */
  fullLabel: string;
  hours: number;
  highlighted: boolean;
};

const BAR_AREA_HEIGHT = 220;

/**
 * Hours-studied-per-day bar chart. A CSS grid (one `1fr` column per bar,
 * shared by the bar row and the label row below it so the two stay in
 * lockstep) rather than fixed-width columns -- the grid always stretches to
 * fill the card's full width, whether it's rendering 7 columns (week) or 31
 * (month), instead of leaving empty space or needing a horizontal scroller.
 * `gap` is the only thing callers tune per period: wider for the week view's
 * 7 "seg/ter/qua..." labels, narrower (but still real space) for the
 * 14-31-bar day/month views.
 *
 * Each column is the hover target (not just the colored bar) so short/zero
 * bars stay easy to hit -- the tooltip itself is still pinned to the bar's
 * actual top edge via an inline `bottom` offset.
 */
export function HoursChart({
  bars,
  gap = 8,
  labelClassName = "text-sm",
}: {
  bars: HoursBar[];
  gap?: number;
  labelClassName?: string;
}) {
  const maxHours = Math.max(1, ...bars.map((b) => b.hours));
  const gridTemplateColumns = `repeat(${bars.length}, minmax(0, 1fr))`;

  return (
    <div className="w-full">
      <div
        className="grid items-end"
        style={{ height: BAR_AREA_HEIGHT, gridTemplateColumns, columnGap: gap }}
      >
        {bars.map((bar) => {
          const heightPx = bar.hours > 0 ? Math.max(4, (bar.hours / maxHours) * BAR_AREA_HEIGHT) : 0;
          return (
            <div key={bar.key} className="group relative flex h-full flex-col justify-end">
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-1.5 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                style={{ bottom: heightPx + 6 }}
              >
                {bar.fullLabel} · {formatDuration(bar.hours * 3_600_000)}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-[4px] transition-colors group-hover:bg-accent",
                  bar.highlighted ? "bg-accent" : "bg-white/20"
                )}
                style={{ height: heightPx }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid" style={{ gridTemplateColumns, columnGap: gap }}>
        {bars.map((bar) => (
          <span
            key={bar.key}
            className={cn(
              "text-center",
              labelClassName,
              bar.highlighted ? "font-bold text-accent" : "text-white/35"
            )}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
