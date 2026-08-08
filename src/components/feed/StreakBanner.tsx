"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { startCheckin } from "@/lib/checkins/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatElapsed } from "@/lib/dates";
import type { ActiveCheckin } from "@/lib/checkins/queries";
import type { StreakStatus } from "@/lib/dates";

function StreakLabel({ status }: { status: StreakStatus }) {
  if (status.kind === "active") {
    return (
      <span className="text-sm">
        🔥 {status.days} {status.days === 1 ? "dia seguido" : "dias seguidos"}
      </span>
    );
  }

  if (status.kind === "lost") {
    return (
      <span className="text-sm text-red-400">
        Você perdeu a sequência. Total de {status.days}{" "}
        {status.days === 1 ? "dia" : "dias"}
      </span>
    );
  }

  return <span className="text-sm text-white/50">Você não tem sequência</span>;
}

/**
 * Check-in/check-out itself lives entirely on the /cronometro page now (see
 * CronometerView) -- this banner only starts a session and links there,
 * both when idle (creates one first) and when one's already running.
 */
export function StreakBanner({
  status,
  activeCheckin,
}: {
  status: StreakStatus;
  activeCheckin: ActiveCheckin | null;
}) {
  return (
    <Card className="mb-9 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <StreakLabel status={status} />
      {activeCheckin ? <ActiveLink checkin={activeCheckin} /> : <StartCheckinControl />}
    </Card>
  );
}

function StartCheckinControl() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await startCheckin();
      if (result?.message) setMessage(result.message);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-xs text-red-400">{message}</span>}
      <Button size="sm" onClick={handleStart} disabled={isPending}>
        {isPending ? "Iniciando..." : "Iniciar check-in"}
      </Button>
    </div>
  );
}

function ActiveLink({ checkin }: { checkin: ActiveCheckin }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (checkin.pausedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [checkin.pausedAt]);

  const runningUntil = checkin.pausedAt ? checkin.pausedAt.getTime() : now;
  const elapsed = Math.max(0, runningUntil - checkin.createdAt.getTime() - checkin.pausedMs);

  return (
    <Link href="/cronometro">
      <Button size="sm">
        {checkin.pausedAt ? "Pausado" : "Estudando"} há {formatElapsed(elapsed)} -- ver cronômetro
      </Button>
    </Link>
  );
}
