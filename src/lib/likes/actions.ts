"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

/** Toggles the current user's like on a check-in. */
export async function toggleLike(checkinId: string): Promise<void> {
  const session = await verifySession();

  const existing = await prisma.like.findUnique({
    where: { checkinId_userId: { checkinId, userId: session.userId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { checkinId, userId: session.userId } });
  }

  revalidatePath("/feed");
}
