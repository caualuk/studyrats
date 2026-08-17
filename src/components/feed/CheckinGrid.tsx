"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { CheckinCard } from "@/components/feed/CheckinCard";
import { Button } from "@/components/ui/Button";
import type { CheckinPage, FeedCheckin } from "@/lib/checkins/queries";

/**
 * Check-in grid + "Ver mais" pagination, shared by the feed and challenge
 * detail pages (the profile page has its own version, ProfileActivity --
 * it also has to juggle the activity calendar and a per-day filter, which
 * this component doesn't need to know about). `loadMore` is a server
 * action pre-bound to whatever this list is scoped to (nothing for the
 * feed, a challengeId for a challenge) -- see loadMoreFeedCheckins /
 * loadMoreChallengeCheckins in lib/checkins/actions.ts -- so this component
 * only ever has to pass it the cursor.
 */
export function CheckinGrid({
  initialItems,
  initialCursor,
  loadMore,
  emptyState,
}: {
  initialItems: FeedCheckin[];
  initialCursor: string | null;
  loadMore: (cursor: string) => Promise<CheckinPage>;
  emptyState: ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const page = await loadMore(cursor);
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    });
  }

  if (items.length === 0) return emptyState;

  return (
    <>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {items.map((checkin) => (
          <CheckinCard key={checkin.id} checkin={checkin} />
        ))}
      </div>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="ghost" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? "Carregando..." : "Ver mais"}
          </Button>
        </div>
      )}
    </>
  );
}
