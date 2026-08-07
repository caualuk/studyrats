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

export async function getMyFriends(userId: string): Promise<PublicUser[]> {
  const rows = await prisma.friendship.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { friend: { select: PUBLIC_USER_SELECT } },
  });
  return rows.map((r) => r.friend);
}
