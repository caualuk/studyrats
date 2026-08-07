"use client";

import { useState, useTransition } from "react";
import { leaveChallenge } from "@/lib/challenges/actions";
import { Button } from "@/components/ui/Button";

/** Shown to any non-owner member on the challenge's own page -- see leaveChallenge for why the owner can't use this. */
export function LeaveChallengeButton({ challengeId }: { challengeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveChallenge(challengeId);
      // Only returns on failure -- success redirects away from this page entirely.
      if (result?.message) setMessage(result.message);
    });
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Sair do desafio
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {message ? (
        <span className="text-[11px] text-red-400">{message}</span>
      ) : (
        <span className="text-[11px] text-white/50">Sair do desafio?</span>
      )}
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>
        Cancelar
      </Button>
      <Button
        size="sm"
        onClick={handleLeave}
        disabled={isPending}
        className="bg-red-500 text-white hover:bg-red-600 disabled:hover:bg-red-500"
      >
        {isPending ? "Saindo..." : "Confirmar"}
      </Button>
    </div>
  );
}
