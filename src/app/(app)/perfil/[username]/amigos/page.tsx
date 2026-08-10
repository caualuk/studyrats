import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getProfileByUsername } from "@/lib/users/queries";
import { getMyFriends } from "@/lib/friends/queries";
import { Card } from "@/components/ui/Card";
import { FriendsGrid } from "@/components/perfil/FriendsGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Amigos de @${username}` };
}

/**
 * Read-only view of another user's friends list -- gated by the same
 * isFullAccess rule as their checkins/calendar (see getProfileByUsername):
 * owner, friends, and everyone else when the profile isn't private.
 */
export default async function PublicFriendsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await getCurrentUser();

  const profile = await getProfileByUsername(username, currentUser.id);
  if (!profile) notFound();
  if (profile.id === currentUser.id) redirect("/amigos");

  return (
    <div className="mx-auto max-w-[920px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <Link
        href={`/perfil/${username}`}
        className="mb-6 inline-block text-xs text-white/45 hover:text-white/70"
      >
        ← Perfil
      </Link>

      <h1 className="mb-[18px] text-[32px] font-extrabold sm:text-[42px]">
        Amigos de {profile.name.split(" ")[0]}.
      </h1>

      {profile.isFullAccess ? (
        <FriendsGrid
          friends={await getMyFriends(profile.id)}
          emptyTitle={`${profile.name.split(" ")[0]} ainda não tem amigos por aqui.`}
          emptyDescription="Quando essa pessoa adicionar amigos, eles vão aparecer aqui."
        />
      ) : (
        <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <p className="text-sm font-bold text-white">Esse perfil é privado.</p>
          <p className="max-w-sm text-xs text-white/45">
            Só amigos de {profile.name.split(" ")[0]} veem a lista de amigos.
          </p>
        </Card>
      )}
    </div>
  );
}
