"use client";

import { useState } from "react";
import { CheckinDetailModal } from "@/components/feed/CheckinDetailModal";
import type { FeedCheckin } from "@/lib/checkins/queries";

/** Opens the check-in's full detail (photo, description, comments) as a modal. */
export function CommentButton({ checkin }: { checkin: FeedCheckin }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-my-2.5 py-2.5 text-[13px] text-white/45 transition-colors hover:text-white/70"
      >
        💬 Comentar{checkin.commentsCount > 0 && ` · ${checkin.commentsCount}`}
      </button>
      <CheckinDetailModal checkin={checkin} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
