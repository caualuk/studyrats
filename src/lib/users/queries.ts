import "server-only";
import { prisma } from "@/lib/prisma";

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
};

/** Looked up by username for the /perfil/[username] page -- returns null when no such user exists. */
export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, name: true, username: true, avatarUrl: true, bio: true },
  });
}
