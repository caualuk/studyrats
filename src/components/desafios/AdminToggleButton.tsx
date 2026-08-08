"use client";

import { useState, useTransition } from "react";
import { setChallengeMemberAdmin } from "@/lib/challenges/actions";
import { cn } from "@/lib/cn";

export function AdminToggleButton({
  challengeId,
  memberUserId,
  isAdmin,
}: {
  challengeId: string;
  memberUserId: string;
  isAdmin: boolean;
}) {
  const [admin, setAdmin] = useState(isAdmin);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !admin;
    setAdmin(next);
    startTransition(async () => {
      await setChallengeMemberAdmin(challengeId, memberUserId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "-m-2 shrink-0 p-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        admin ? "text-accent" : "text-white/40 hover:text-white/70"
      )}
    >
      {admin ? "Remover admin" : "Tornar admin"}
    </button>
  );
}
