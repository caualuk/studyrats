"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { LikeButton } from "@/components/feed/LikeButton";
import { CheckinComments } from "@/components/feed/CheckinComments";
import { EditCheckinDialog } from "@/components/feed/EditCheckinDialog";
import type { FeedCheckin } from "@/lib/checkins/queries";

/**
 * Full check-in detail as a modal: photo, author, date, title, description,
 * like, and comments (list + form). Shared by the feed's "Comentar" button
 * and the challenge "pista"'s runner photos, so both open the exact same
 * view. Only mounts (and only fetches comments) while `open` is true --
 * Modal itself renders nothing when closed. Owners additionally get an
 * Editar control here -- deleting lives on the card's hover trash icon
 * instead (CheckinCardDeleteButton), not duplicated in this modal.
 */
export function CheckinDetailModal({
  checkin,
  open,
  onClose,
}: {
  checkin: FeedCheckin;
  open: boolean;
  onClose: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Card className="max-h-[85vh] overflow-y-auto text-left">
          <PhotoPlaceholder
            src={checkin.photoUrl}
            alt={checkin.title}
            label="foto do check-in"
            className="h-56 w-full rounded-t-2xl"
          />
          <div className="px-6 py-5">
            <div className="mb-2.5 flex items-center gap-2">
              <Link
                href={`/perfil/${checkin.authorUsername}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar src={checkin.authorAvatarUrl} name={checkin.authorName} size="sm" />
                <span className="text-xs text-white/60">{checkin.authorName}</span>
              </Link>
              <span className="ml-auto shrink-0 text-[10px] text-white/35">
                {checkin.dateLabel}
              </span>
            </div>
            <h3 className="mb-1.5 text-base font-bold">{checkin.title}</h3>
            {checkin.description && (
              <p className="mb-4 text-sm leading-relaxed text-white/60">{checkin.description}</p>
            )}
            <div className="mb-5 flex items-center justify-between">
              <LikeButton
                checkinId={checkin.id}
                initialLiked={checkin.likedByMe}
                initialCount={checkin.likesCount}
              />
              {checkin.isOwner && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-[13px] text-white/45 transition-colors hover:text-white/70"
                >
                  Editar
                </button>
              )}
            </div>
            <CheckinComments checkinId={checkin.id} />
          </div>
        </Card>
      </Modal>

      {checkin.isOwner && (
        <EditCheckinDialog checkin={checkin} open={editOpen} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}
