import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
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
    select: { id: true, name: true, username: true, avatarUrl: true, isPrivate: true },
  });
  if (!user) return null;

  const isFullAccess = await canViewFullProfile(user, viewerId);
  return { ...user, isFullAccess };
}

/**
 * Same access rule `getProfileByUsername` derives `isFullAccess` from,
 * exposed separately so server actions that paginate/lazy-load a profile's
 * check-in photos (calendar months, "ver mais", a selected day) can
 * re-check it themselves instead of trusting whatever the client claims --
 * those actions are POST-reachable directly, not just through this page.
 * Accepts either a full user row or just its id/isPrivate (the columns this
 * check actually needs) so callers that only have an id don't need an extra
 * query first.
 */
export async function canViewFullProfile(
  profileUser: { id: string; isPrivate: boolean } | string,
  viewerId: string
): Promise<boolean> {
  const user =
    typeof profileUser === "string"
      ? await prisma.user.findUnique({ where: { id: profileUser }, select: { id: true, isPrivate: true } })
      : profileUser;
  if (!user) return false;
  if (user.id === viewerId) return true;
  if (!user.isPrivate) return true;

  const isFriend = !!(await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: viewerId, friendId: user.id } },
  }));
  return isFriend;
}
