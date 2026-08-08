import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
};

/**
 * Looked up by username for the /perfil/[username] page -- returns null when
 * no such user exists, and also when `viewerId` isn't that user's friend
 * (viewing your own profile is always allowed). Folding the friendship check
 * into the query, rather than checking it separately in the page, means an
 * unauthorized viewer sees the same "not found" outcome as a nonexistent
 * username -- see getChallengeDetail for the same pattern.
 */
export async function getProfileByUsername(
  username: string,
  viewerId: string
): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, name: true, username: true, avatarUrl: true, bio: true },
  });
  if (!user) return null;
  if (user.id === viewerId) return user;

  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: viewerId, friendId: user.id } },
  });
  if (!friendship) return null;

  return user;
}
