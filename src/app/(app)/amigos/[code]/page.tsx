import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { AcceptFriendInvite } from "@/components/perfil/AcceptFriendInvite";

export const metadata: Metadata = { title: "Convite de amizade" };

export default async function FriendInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-14">
      <AcceptFriendInvite code={code} me={{ name: user.name, avatarUrl: user.avatarUrl }} />
    </div>
  );
}
