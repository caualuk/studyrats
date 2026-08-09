import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  /**
   * False when the profile owner has gone private, the viewer isn't a
   * friend, and the viewer isn't the owner -- the page then shows only
   * aggregate stats (check-ins, friends, record, hours), no checkin photos
   * or calendar. Friends and the owner always get full access regardless of
   * the private flag.
   */
  isFullAccess: boolean;
};

/**
 * Looked up by username for the /perfil/[username] page -- returns null only
 * when no such user exists. Everyone else gets at least the stats-only view;
 * `isFullAccess` tells the page whether to also render checkin photos and
 * the calendar.
 */
export async function getProfileByUsername(
  username: string,
  viewerId: string
): Promise<PublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, name: true, username: true, avatarUrl: true, bio: true, isPrivate: true },
  });
  if (!user) return null;
  if (user.id === viewerId) return { ...user, isFullAccess: true };

  const isFriend = !!(await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: viewerId, friendId: user.id } },
  }));

  return { ...user, isFullAccess: isFriend || !user.isPrivate };
}
