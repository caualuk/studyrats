import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
} as const;

export type FriendWithStatus = PublicUser & {
  /** Whether this friend currently has a check-in in progress (not yet checked out). */
  isStudying: boolean;
};

export async function getFriendsCount(userId: string): Promise<number> {
  return prisma.friendship.count({ where: { userId } });
}

export async function getMyFriends(userId: string): Promise<FriendWithStatus[]> {
  const rows = await prisma.friendship.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { friend: { select: PUBLIC_USER_SELECT } },
  });
  const friends = rows.map((r) => r.friend);
  if (friends.length === 0) return [];

  const active = await prisma.checkin.findMany({
    where: { userId: { in: friends.map((f) => f.id) }, checkedOutAt: null },
    select: { userId: true },
  });
  const studyingIds = new Set(active.map((a) => a.userId));

  return friends.map((f) => ({ ...f, isStudying: studyingIds.has(f.id) }));
}
