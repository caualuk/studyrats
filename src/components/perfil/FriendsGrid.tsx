import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FriendWithStatus } from "@/lib/friends/queries";

export function FriendsGrid({
  friends,
  emptyTitle,
  emptyDescription,
}: {
  friends: FriendWithStatus[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (friends.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
      {friends.map((friend) => (
        <Link key={friend.id} href={`/perfil/${friend.username}`}>
          <Card className="flex flex-col items-center gap-2 px-3 py-4 text-center transition-colors hover:border-border-strong">
            <Avatar src={friend.avatarUrl} name={friend.name} size="lg" />
            <span className="line-clamp-1 text-xs font-bold">{friend.name}</span>
            {friend.isStudying && (
              <span className="text-[10px] font-semibold text-accent">estudando...</span>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
