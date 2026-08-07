import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/feed/LikeButton";
import { CommentButton } from "@/components/feed/CommentButton";
import { CheckinCardPhoto } from "@/components/feed/CheckinCardPhoto";
import type { FeedCheckin } from "@/lib/checkins/queries";

export function CheckinCard({ checkin }: { checkin: FeedCheckin }) {
  return (
    <Card className="group overflow-hidden">
      <CheckinCardPhoto checkin={checkin} />

      <div className="px-4 py-3.5">
        <h3 className="mb-1 text-sm font-bold">{checkin.title}</h3>
        {checkin.description && (
          <p className="mb-2.5 line-clamp-2 text-xs leading-relaxed text-white/50">
            {checkin.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Link
            href={`/perfil/${checkin.authorUsername}`}
            className="flex items-center gap-1.5 hover:opacity-80"
          >
            <Avatar src={checkin.authorAvatarUrl} name={checkin.authorName} size="sm" />
            <span className="text-[11px] text-white/60">{checkin.authorName}</span>
          </Link>
          <span className="text-[10px] text-white/35">{checkin.dateLabel}</span>
        </div>

        <div className="mt-3 flex items-center gap-5">
          <LikeButton
            checkinId={checkin.id}
            initialLiked={checkin.likedByMe}
            initialCount={checkin.likesCount}
          />
          <CommentButton checkin={checkin} />
        </div>
      </div>
    </Card>
  );
}
