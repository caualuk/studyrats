"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { formatDatePtBR } from "@/lib/dates";
import { CommentSchema, type FormState } from "@/lib/validations";

export type CheckinComment = {
  id: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string | null;
  dateLabel: string;
};

/**
 * Reads a check-in's comments. This is a Server Function (not just a
 * "server-only" query) because it's called directly from the CheckinComments
 * Client Component when its modal opens, rather than fetched ahead of time --
 * most check-in cards in the feed never have their comments opened, so
 * there's no reason to load every comment thread up front.
 */
export async function listComments(checkinId: string): Promise<CheckinComment[]> {
  await verifySession();

  const comments = await prisma.comment.findMany({
    where: { checkinId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, avatarUrl: true } } },
  });

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    authorName: c.user.name,
    authorAvatarUrl: c.user.avatarUrl,
    dateLabel: formatDatePtBR(c.createdAt),
  }));
}

export async function createComment(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const validated = CommentSchema.safeParse({ content: formData.get("content") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.comment.create({
      data: {
        content: validated.data.content,
        checkinId,
        userId: session.userId,
      },
    });
  } catch {
    return { message: "Não foi possível publicar o comentário." };
  }

  revalidatePath("/feed");
  return { success: true };
}
