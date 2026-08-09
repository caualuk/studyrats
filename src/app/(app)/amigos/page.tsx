import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyFriends } from "@/lib/friends/queries";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddFriendDialog } from "@/components/perfil/AddFriendDialog";

export const metadata: Metadata = { title: "Amigos" };

export default async function AmigosPage() {
  const user = await getCurrentUser();
  const friends = await getMyFriends(user.id);

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="mb-[18px] flex items-center justify-between">
        <h1 className="text-[32px] font-extrabold sm:text-[42px]">Amigos.</h1>
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
      )}
    </div>
  );
}
