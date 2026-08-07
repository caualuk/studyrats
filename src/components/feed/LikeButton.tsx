"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/likes/actions";
import { cn } from "@/lib/cn";

export function LikeButton({
  checkinId,
  initialLiked,
  initialCount,
}: {
  checkinId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // Optimistic update: flip immediately, let the server action confirm
    // (or revalidatePath correct it) in the background.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      await toggleLike(checkinId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 text-[13px] transition-colors disabled:cursor-not-allowed",
        liked ? "text-accent" : "text-white/45 hover:text-white/70"
      )}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{liked ? "Curtiu" : "Curtir"}</span>
      {count > 0 && <span className="text-white/35">· {count}</span>}
    </button>
  );
}
