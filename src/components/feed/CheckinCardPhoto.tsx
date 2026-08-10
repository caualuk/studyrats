"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { CheckinCardActions } from "@/components/feed/CheckinCardActions";
import { CheckinDetailModal } from "@/components/feed/CheckinDetailModal";
import { formatElapsed } from "@/lib/dates";
import type { FeedCheckin } from "@/lib/checkins/queries";

/**
 * The check-in's photo + one badge per linked challenge (or "Check-in
 * livre" if none) + (owner-only) edit/delete icons. Clicking the photo
 * opens the full detail modal -- a plain div (not a `<button>`) so the icon
 * buttons can live inside it without illegally nesting interactive elements.
 */
export function CheckinCardPhoto({ checkin }: { checkin: FeedCheckin }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setDetailOpen(true);
          }
        }}
        aria-label={`Ver detalhes do check-in "${checkin.title}"`}
        className="cursor-pointer"
      >
        <PhotoPlaceholder
          src={checkin.photoUrl}
          alt={checkin.title}
          label="foto do check-in"
          className="h-[150px] w-full"
        >
          <div className="absolute bottom-2.5 left-2.5 flex max-w-[calc(100%-2rem)] flex-wrap gap-1">
            {checkin.challenges.length === 0 ? (
              <Badge>Check-in livre</Badge>
            ) : (
              checkin.challenges.map((c) => <Badge key={c.id}>{c.name}</Badge>)
            )}
          </div>
          <Badge className="absolute bottom-2.5 right-2.5">
            {formatElapsed(checkin.durationMs)}
          </Badge>
          {checkin.canDelete && <CheckinCardActions checkin={checkin} />}
        </PhotoPlaceholder>
      </div>

      <CheckinDetailModal checkin={checkin} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
