import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyFriends } from "@/lib/friends/queries";
import { AddFriendDialog } from "@/components/perfil/AddFriendDialog";
import { FriendsGrid } from "@/components/perfil/FriendsGrid";

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

      <FriendsGrid
        friends={friends}
        emptyTitle="Você ainda não tem amigos por aqui."
        emptyDescription="Gere um link de convite e mande para alguém começar a acompanhar seus check-ins."
      />
    </div>
  );
}
