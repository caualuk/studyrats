"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelCheckin, startCheckin } from "@/lib/checkins/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckOutDialog } from "@/components/checkins/CheckOutDialog";
import { CheckoutSuccessModal } from "@/components/checkins/CheckoutSuccessModal";
import { formatElapsed } from "@/lib/dates";
import type { ChallengeOption } from "@/lib/challenges/queries";
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

export function StreakBanner({
  status,
  challenges,
  activeCheckin,
}: {
  status: StreakStatus;
  challenges: ChallengeOption[];
  activeCheckin: ActiveCheckin | null;
}) {
  // Lives here, not inside ActiveSession/CheckOutDialog: once check-out
  // succeeds, `activeCheckin` becomes null on the next render (revalidated
  // from the server) and ActiveSession unmounts -- a success modal owned by
  // it would vanish before the user ever saw it.
  const [justFinishedMs, setJustFinishedMs] = useState<number | null>(null);

  return (
    <>
      <Card className="mb-9 flex items-center justify-between px-6 py-4">
        <StreakLabel status={status} />
        {activeCheckin ? (
          <ActiveSession
            checkin={activeCheckin}
            challenges={challenges}
            onCheckedOut={setJustFinishedMs}
          />
        ) : (
          <StartCheckinControl />
        )}
      </Card>

      {justFinishedMs !== null && (
        <CheckoutSuccessModal elapsedMs={justFinishedMs} onClose={() => setJustFinishedMs(null)} />
      )}
    </>
  );
}

function StartCheckinControl() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await startCheckin();
      setMessage(result.message ?? null);
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

function ActiveSession({
  checkin,
  challenges,
  onCheckedOut,
}: {
  checkin: ActiveCheckin;
  challenges: ChallengeOption[];
  onCheckedOut: (elapsedMs: number) => void;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleCancel() {
    startTransition(async () => {
      await cancelCheckin(checkin.id);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-accent">
        Estudando há {formatElapsed(now - checkin.createdAt.getTime())}
      </span>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="text-[13px] text-white/45 transition-colors hover:text-white/70 disabled:opacity-50"
      >
        Cancelar
      </button>
      <Button size="sm" onClick={() => setCheckoutOpen(true)}>
        Finalizar check-out
      </Button>
      <CheckOutDialog
        checkin={checkin}
        challenges={challenges}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onCheckedOut={onCheckedOut}
      />
    </div>
  );
}
