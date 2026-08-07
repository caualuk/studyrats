"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatStopwatch } from "@/lib/dates";
import type { ActiveCheckin } from "@/lib/checkins/queries";

/**
 * Persistent timer in the navbar -- zeroed and idle-styled with no active
 * check-in, ticking live (or frozen mid-pause) otherwise. Always links to
 * /cronometro, which continues in the exact same state (see CronometerView).
 */
export function NavCronometer({ activeCheckin }: { activeCheckin: ActiveCheckin | null }) {
  const [now, setNow] = useState(() => Date.now());
  const paused = activeCheckin?.pausedAt != null;

  useEffect(() => {
    if (!activeCheckin || paused) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeCheckin, paused]);

  const ms = activeCheckin
    ? Math.max(
        0,
        (activeCheckin.pausedAt ? activeCheckin.pausedAt.getTime() : now) -
          activeCheckin.createdAt.getTime() -
          activeCheckin.pausedMs
      )
    : 0;

  return (
    <Link
      href="/cronometro"
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[13px] transition-colors",
        activeCheckin
          ? "border-accent/40 text-accent hover:bg-accent/10"
          : "border-border-strong text-white/45 hover:text-white/70"
      )}
    >
      <span aria-hidden>⏱</span>
      {formatStopwatch(ms)}
    </Link>
  );
}
