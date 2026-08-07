"use client";

import { useEffect, useState } from "react";
import { listComments, type CheckinComment } from "@/lib/comments/actions";
import { Avatar } from "@/components/ui/Avatar";
import { CommentForm } from "@/components/feed/CommentForm";

/** Comment list + form for a check-in, always expanded -- meant to live inside CheckinDetailModal. */
export function CheckinComments({ checkinId }: { checkinId: string }) {
  // `null` doubles as "still loading".
  const [comments, setComments] = useState<CheckinComment[] | null>(null);

  function loadComments() {
    return listComments(checkinId).then(setComments);
  }

  useEffect(() => {
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkinId]);

  return (
    <div>
      <h4 className="mb-3 text-sm font-bold">
        Comentários{comments && comments.length > 0 ? ` (${comments.length})` : ""}
      </h4>

      <div className="mb-4">
        {comments === null ? (
          <p className="text-xs text-white/40">Carregando...</p>
        ) : comments.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <Avatar src={c.authorAvatarUrl} name={c.authorName} size="sm" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold">{c.authorName}</span>
                    <span className="text-[10px] text-white/35">{c.dateLabel}</span>
                  </div>
                  <p className="text-xs text-white/70">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/40">Nenhum comentário ainda. Seja o primeiro.</p>
        )}
      </div>

      <CommentForm checkinId={checkinId} onPosted={loadComments} />
    </div>
  );
}
