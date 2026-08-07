"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CheckinDetailModal } from "@/components/feed/CheckinDetailModal";
import type { FeedCheckin } from "@/lib/checkins/queries";

/**
 * A runner's photo on "A pista.". When they have a check-in in this
 * challenge, tapping it opens that check-in's full detail -- otherwise it's
 * just a static avatar, nothing to show.
 */
export function TrackRunnerAvatar({
  name,
  avatarUrl,
  checkin,
}: {
  name: string;
  avatarUrl: string | null;
  checkin: FeedCheckin | null;
}) {
  const [open, setOpen] = useState(false);

  if (!checkin) {
    return <Avatar src={avatarUrl} name={name} size="lg" className="ring-2 ring-bg" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-pointer rounded-full"
        aria-label={`Ver check-in de ${name} no desafio`}
      >
        <Avatar src={avatarUrl} name={name} size="lg" className="ring-2 ring-bg" />
      </button>
      <CheckinDetailModal checkin={checkin} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
