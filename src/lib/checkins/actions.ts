"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { toDateKey, fromDateKey } from "@/lib/dates";
import { CheckinSchema, type FormState } from "@/lib/validations";

const AFFECTED_PATHS = ["/feed", "/100-dias", "/ranking", "/perfil", "/desafios"];

export async function createCheckin(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validated = CheckinSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    // The challenge picker is only rendered when the user has challenges to
    // choose from, so this field may be entirely absent from the FormData
    // (formData.get returns null, not undefined -- zod's .optional() only
    // treats undefined as "missing").
    challengeId: formData.get("challengeId") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { message: "Envie uma foto. Sem foto, não conta." };
  }

  let photoUrl: string;
  try {
    photoUrl = await savePhotoUpload(photo, "checkins");
  } catch (error) {
    if (error instanceof UploadError) return { message: error.message };
    throw error;
  }

  const { title, description, challengeId } = validated.data;

  try {
    if (challengeId) {
      // Server Actions are reachable via direct POST, not just through this
      // form -- make sure the user actually belongs to the challenge they
      // claim to be posting to, rather than trusting the submitted id.
      const membership = await prisma.challengeMember.findUnique({
        where: { challengeId_userId: { challengeId, userId: session.userId } },
        select: { challengeId: true },
      });
      if (!membership) {
        return { message: "Você não participa desse desafio." };
      }
    }

    const today = toDateKey(new Date());

    // The streak lives entirely in study_days, not in whether a check-in
    // post exists -- creating the post and ensuring today's study day are
    // two separate writes, done together so they can never drift apart.
    await prisma.$transaction(async (tx) => {
      const checkin = await tx.checkin.create({
        data: {
          title,
          description: description || null,
          photoUrl,
          userId: session.userId,
          challengeId: challengeId || null,
        },
      });

      await tx.studyDay.upsert({
        where: { userId_date: { userId: session.userId, date: today } },
        // Only the first check-in of the day earns the study day; later
        // check-ins that same day must not touch it (see class rules).
        create: { userId: session.userId, date: today, sourceCheckinId: checkin.id },
        update: {},
      });
    });
  } catch {
    return {
      message:
        "Não foi possível salvar o check-in. Confira se o banco de dados está conectado (veja o README).",
    };
  }

  for (const path of AFFECTED_PATHS) revalidatePath(path);
  if (challengeId) revalidatePath(`/desafios/${challengeId}`);

  return { success: true };
}

const CheckinEditSchema = CheckinSchema.pick({ title: true, description: true });

/**
 * Edits a check-in's content (and optionally swaps its photo). Deliberately
 * never touches study_days -- editing a post, even changing its title or
 * photo entirely, must never affect the streak either way.
 */
export async function editCheckin(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const existing = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, challengeId: true },
  });
  if (!existing || existing.userId !== session.userId) {
    return { message: "Você não pode editar esse check-in." };
  }

  const validated = CheckinEditSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await savePhotoUpload(photo, "checkins");
    } catch (error) {
      if (error instanceof UploadError) return { message: error.message };
      throw error;
    }
  }

  const { title, description } = validated.data;

  try {
    await prisma.checkin.update({
      where: { id: checkinId },
      data: {
        title,
        description: description || null,
        ...(photoUrl && { photoUrl }),
      },
    });
  } catch {
    return { message: "Não foi possível salvar as alterações do check-in." };
  }

  for (const path of AFFECTED_PATHS) revalidatePath(path);
  if (existing.challengeId) revalidatePath(`/desafios/${existing.challengeId}`);

  return { success: true };
}

/**
 * Deletes a check-in post. Whether this touches study_days depends only on
 * whether the check-in was posted *today*:
 *  - Any other day: the post disappears, study_days is untouched -- that
 *    day was already earned and stays earned.
 *  - Today, and it was the only check-in left today after deleting it: the
 *    day hasn't fully been "banked" yet in the sense that it only existed
 *    because of this post, so today's study day is removed too.
 *  - Today, but other check-ins remain: study_days stays as-is.
 */
export async function deleteCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, createdAt: true, challengeId: true },
  });
  if (!checkin || checkin.userId !== session.userId) {
    return { message: "Você não pode excluir esse check-in." };
  }

  const checkinDay = toDateKey(checkin.createdAt);
  const isToday = checkinDay === toDateKey(new Date());

  try {
    await prisma.$transaction(async (tx) => {
      await tx.checkin.delete({ where: { id: checkinId } });

      if (!isToday) return;

      const dayStart = fromDateKey(checkinDay);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const remainingToday = await tx.checkin.count({
        where: { userId: checkin.userId, createdAt: { gte: dayStart, lt: dayEnd } },
      });

      if (remainingToday === 0) {
        await tx.studyDay.deleteMany({ where: { userId: checkin.userId, date: checkinDay } });
      }
    });
  } catch {
    return { message: "Não foi possível excluir o check-in." };
  }

  for (const path of AFFECTED_PATHS) revalidatePath(path);
  if (checkin.challengeId) revalidatePath(`/desafios/${checkin.challengeId}`);

  return {};
}
