"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { canManageChallenge } from "@/lib/challenges/queries";
import { toDateKey, fromDateKey } from "@/lib/dates";
import { CheckoutSchema, type FormState } from "@/lib/validations";

const AFFECTED_PATHS = ["/feed", "/100-dias", "/ranking", "/perfil", "/desafios"];

/**
 * Starts a check-in: just a timestamp and (optionally) which challenge it's
 * under -- title, description, and the proof photo are all collected later,
 * at check-out (see checkOutCheckin). Only one check-in can be in progress
 * at a time per user.
 */
export async function startCheckin(challengeId?: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const active = await prisma.checkin.findFirst({
    where: { userId: session.userId, checkedOutAt: null },
    select: { id: true },
  });
  if (active) {
    return { message: "Você já tem um check-in em andamento." };
  }

  if (challengeId) {
    // Server Actions are reachable via direct POST, not just through this
    // form -- make sure the user actually belongs to the challenge they
    // claim to be checking into, rather than trusting the submitted id.
    const membership = await prisma.challengeMember.findUnique({
      where: { challengeId_userId: { challengeId, userId: session.userId } },
      select: { challengeId: true },
    });
    if (!membership) {
      return { message: "Você não participa desse desafio." };
    }
  }

  try {
    await prisma.checkin.create({
      data: { userId: session.userId, challengeId: challengeId || null },
    });
  } catch {
    return {
      message:
        "Não foi possível iniciar o check-in. Confira se o banco de dados está conectado (veja o README).",
    };
  }

  revalidatePath("/feed");
  if (challengeId) revalidatePath(`/desafios/${challengeId}`);
  return {};
}

/**
 * Cancels an in-progress check-in without checking out (e.g. started by
 * mistake). Never touches study_days -- only a completed check-out earns a
 * study day, so there's nothing to undo there.
 */
export async function cancelCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, challengeId: true },
  });
  if (!checkin || checkin.userId !== session.userId || checkin.checkedOutAt) {
    return { message: "Não foi possível cancelar esse check-in." };
  }

  try {
    await prisma.checkin.delete({ where: { id: checkinId } });
  } catch {
    return { message: "Não foi possível cancelar esse check-in." };
  }

  revalidatePath("/feed");
  if (checkin.challengeId) revalidatePath(`/desafios/${checkin.challengeId}`);
  return {};
}

/**
 * Finishes an in-progress check-in: title, description, and the proof photo
 * are all required here, not at start -- this is also the moment the
 * streak is earned (the study_days upsert createCheckin used to do lives
 * here now instead).
 */
export async function checkOutCheckin(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, challengeId: true, createdAt: true },
  });
  if (!checkin || checkin.userId !== session.userId) {
    return { message: "Você não pode finalizar esse check-in." };
  }
  if (checkin.checkedOutAt) {
    return { message: "Esse check-in já foi finalizado." };
  }

  const validated = CheckoutSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
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

  const { title, description } = validated.data;
  // The study day belongs to whichever day the session *started* on, not
  // whenever check-out happened to be clicked.
  const today = toDateKey(checkin.createdAt);

  try {
    // The streak lives entirely in study_days, not in whether a check-in
    // post exists -- finishing the post and ensuring the study day are two
    // separate writes, done together so they can never drift apart.
    await prisma.$transaction(async (tx) => {
      await tx.checkin.update({
        where: { id: checkinId },
        data: { title, description: description || null, photoUrl, checkedOutAt: new Date() },
      });

      await tx.studyDay.upsert({
        where: { userId_date: { userId: session.userId, date: today } },
        // Only the first check-in of the day earns the study day; later
        // check-ins that same day must not touch it (see class rules).
        create: { userId: session.userId, date: today, sourceCheckinId: checkinId },
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
  if (checkin.challengeId) revalidatePath(`/desafios/${checkin.challengeId}`);

  return { success: true };
}

const CheckinEditSchema = CheckoutSchema.pick({ title: true, description: true });

/**
 * Edits a completed check-in's content (and optionally swaps its photo).
 * Deliberately never touches study_days -- editing a post, even changing
 * its title or photo entirely, must never affect the streak either way.
 */
export async function editCheckin(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const existing = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, challengeId: true, checkedOutAt: true },
  });
  if (!existing || existing.userId !== session.userId || !existing.checkedOutAt) {
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
 * Deletes a completed check-in post -- either the author, or an owner/admin
 * of the challenge it was posted under moderating an offensive post (streak
 * bookkeeping below always follows the *author*, never the deleter). An
 * in-progress check-in (no checkedOutAt yet) is cancelled instead, see
 * cancelCheckin -- it never earned a study day, so there's nothing here to
 * unwind for one.
 * Whether this touches study_days depends only on whether the check-in was
 * posted *today*:
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
    select: { userId: true, createdAt: true, challengeId: true, checkedOutAt: true },
  });
  if (!checkin || !checkin.checkedOutAt) {
    return { message: "Você não pode excluir esse check-in." };
  }

  const isOwner = checkin.userId === session.userId;
  const canModerate =
    !isOwner && checkin.challengeId
      ? await canManageChallenge(checkin.challengeId, session.userId)
      : false;
  if (!isOwner && !canModerate) {
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
        where: {
          userId: checkin.userId,
          createdAt: { gte: dayStart, lt: dayEnd },
          checkedOutAt: { not: null },
        },
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
