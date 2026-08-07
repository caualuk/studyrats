"use client";

import { useState, useTransition } from "react";
import { deleteCheckin } from "@/lib/checkins/actions";
import { cn } from "@/lib/cn";

/**
 * Trash icon overlaid on the check-in photo, top-right, shown on hover of
 * the card (parent needs `group`). Same "click to arm, click again to
 * confirm" pattern as DeleteCheckinButton, just icon-styled to fit here.
 */
export function CheckinCardDeleteButton({ checkinId }: { checkinId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteCheckin(checkinId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      disabled={isPending}
      aria-label={confirming ? "Confirmar exclusão do check-in" : "Excluir check-in"}
      title={confirming ? "Confirmar exclusão?" : "Excluir"}
      className={cn(
        "absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full opacity-0 outline-none transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed",
        confirming ? "bg-red-500/90 text-white" : "bg-black/55 text-white/85 hover:bg-black/75"
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[15px] w-[15px]"
      >
        <path d="M4 5.5h12" />
        <path d="M7.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
        <path d="M5.5 5.5 6 15a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 14 15l.5-9.5" />
        <path d="M8.3 8.5v4.3" />
        <path d="M11.7 8.5v4.3" />
      </svg>
    </button>
  );
}
