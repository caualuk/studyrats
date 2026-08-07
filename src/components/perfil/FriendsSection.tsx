import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFriendDialog } from "@/components/perfil/AddFriendDialog";
import type { PublicUser } from "@/lib/friends/queries";

export function FriendsSection({ friends }: { friends: PublicUser[] }) {
  return (
    <div className="mt-8">
      <div className="mb-[18px] flex items-center justify-between">
        <h2 className="text-xl font-bold">Amigos.</h2>
        <AddFriendDialog />
      </div>

      {friends.length === 0 ? (
        <EmptyState
          title="Você ainda não tem amigos por aqui."
          description="Gere um link de convite e mande para alguém começar a acompanhar seus check-ins."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {friends.map((friend) => (
            <Card key={friend.id} className="flex flex-col items-center gap-2 px-3 py-4 text-center">
              <Avatar src={friend.avatarUrl} name={friend.name} size="lg" />
              <span className="line-clamp-1 text-xs font-bold">{friend.name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
