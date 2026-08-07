"use client";

import { useState, useTransition } from "react";
import { deleteCheckin } from "@/lib/checkins/actions";
import { cn } from "@/lib/cn";

/** Click once to arm, click again to confirm -- no separate dialog needed. */
export function DeleteCheckinButton({
  checkinId,
  onDeleted,
}: {
  checkinId: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteCheckin(checkinId);
      onDeleted();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      disabled={isPending}
      className={cn(
        "text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        confirming ? "font-bold text-red-400" : "text-white/45 hover:text-white/70"
      )}
    >
      {isPending ? "Excluindo..." : confirming ? "Confirmar exclusão?" : "Excluir"}
    </button>
  );
}
