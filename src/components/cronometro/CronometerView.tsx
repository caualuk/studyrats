"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelCheckin,
  pauseCheckin,
  resumeCheckin,
  startCheckin,
  stopCheckin,
} from "@/lib/checkins/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckOutDialog } from "@/components/checkins/CheckOutDialog";
import { CheckoutSuccessModal } from "@/components/checkins/CheckoutSuccessModal";
import { formatStopwatch } from "@/lib/dates";
import type { ChallengeOption } from "@/lib/challenges/queries";
import type { ActiveCheckin } from "@/lib/checkins/queries";

function elapsedMs(checkin: ActiveCheckin, now: number): number {
  const runningUntil = checkin.pausedAt ? checkin.pausedAt.getTime() : now;
  return Math.max(0, runningUntil - checkin.createdAt.getTime() - checkin.pausedMs);
}

/**
 * The dedicated cronometer page: check-in/check-out has moved here entirely
 * from the Feed banner (see StreakBanner), which now just links here.
 * Handles all three states -- idle (no active check-in), running, paused --
 * plus launching the checkout form and its success confirmation.
 */
export function CronometerView({
  activeCheckin,
  challenges,
}: {
  activeCheckin: ActiveCheckin | null;
  challenges: ChallengeOption[];
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [justFinishedMs, setJustFinishedMs] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const paused = activeCheckin?.pausedAt != null;

  useEffect(() => {
    if (!activeCheckin || paused) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeCheckin, paused]);

  if (justFinishedMs !== null) {
    return (
      <CheckoutSuccessModal
        elapsedMs={justFinishedMs}
        onClose={() => {
          setJustFinishedMs(null);
          router.push("/feed");
        }}
      />
    );
  }

  if (!activeCheckin) {
    return (
      <Card className="px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-6 font-mono text-4xl font-extrabold text-white/25 sm:text-5xl">00:00</p>
        {message && (
          <p className="mb-3 text-xs text-red-400" role="alert">
            {message}
          </p>
        )}
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await startCheckin();
              if (result?.message) setMessage(result.message);
            })
          }
        >
          {isPending ? "Iniciando..." : "Iniciar check-in"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="px-4 py-8 sm:px-6 sm:py-10">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-white/40">
        {paused ? "Pausado" : "Estudando"}
      </p>
      <p className="mb-8 font-mono text-5xl font-extrabold text-accent sm:text-6xl">
        {formatStopwatch(elapsedMs(activeCheckin, now))}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await (paused ? resumeCheckin : pauseCheckin)(activeCheckin.id);
            })
          }
        >
          {paused ? "Retomar" : "Pausar"}
        </Button>
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await stopCheckin(activeCheckin.id);
            })
          }
        >
          Parar
        </Button>
        <Button disabled={isPending} onClick={() => setCheckoutOpen(true)}>
          Checkout
        </Button>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await cancelCheckin(activeCheckin.id);
          })
        }
        className="mt-5 text-[11px] text-white/35 transition-colors hover:text-red-400 disabled:opacity-50"
      >
        Cancelar check-in (descarta essa sessão)
      </button>

      <CheckOutDialog
        checkin={activeCheckin}
        challenges={challenges}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onCheckedOut={setJustFinishedMs}
      />
    </Card>
  );
}
