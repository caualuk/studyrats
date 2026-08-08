"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { canManageChallenge } from "@/lib/challenges/queries";
import { toDateKey, fromDateKey } from "@/lib/dates";
import { CheckoutSchema, type FormState } from "@/lib/validations";

const AFFECTED_PATHS = ["/feed", "/100-dias", "/ranking", "/perfil", "/desafios", "/cronometro"];

function revalidateChallenges(challengeIds: string[]) {
  for (const id of challengeIds) revalidatePath(`/desafios/${id}`);
}

/**
 * Starts a check-in: just a timestamp. Title, description, the proof
 * photo, and which challenges (if any) it's posted under are all collected
 * later, at check-out (see checkOutCheckin). Only one check-in can be in
 * progress at a time per user. Redirects to the cronometer page on success
 * -- redirect() throws internally, so it must stay outside the try/catch
 * around the write, or Next's own control-flow exception would get caught
 * and reported as a generic failure.
 */
export async function startCheckin(): Promise<{ message?: string }> {
  const session = await verifySession();

  const active = await prisma.checkin.findFirst({
    where: { userId: session.userId, checkedOutAt: null },
    select: { id: true },
  });
  if (!active) {
    try {
      await prisma.checkin.create({ data: { userId: session.userId } });
    } catch {
      return {
        message:
          "Não foi possível iniciar o check-in. Confira se o banco de dados está conectado (veja o README).",
      };
    }
    revalidatePath("/feed");
  }

  redirect("/cronometro");
}

/**
 * Cancels an in-progress check-in without checking out (e.g. started by
 * mistake) -- discards it entirely, unlike stopCheckin below. Never touches
 * study_days -- only a completed check-out earns a study day, so there's
 * nothing to undo there. An in-progress check-in was never linked to any
 * challenge yet either (that's chosen at check-out), so there's nothing to
 * revalidate beyond the feed.
 */
export async function cancelCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true },
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
  redirect("/feed");
}

/**
 * "Parar" on the cronometer page: pauses the session (if not already) and
 * sends the user back to the feed -- the check-in stays alive, so clicking
 * "Iniciar check-in" again (or the navbar timer) returns to this exact same
 * session, still paused at the same elapsed time, instead of losing
 * progress. Distinct from cancelCheckin, which discards the session outright.
 */
export async function stopCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, pausedAt: true },
  });
  if (!checkin || checkin.userId !== session.userId || checkin.checkedOutAt) {
    return { message: "Não foi possível parar esse check-in." };
  }

  if (!checkin.pausedAt) {
    await prisma.checkin.update({ where: { id: checkinId }, data: { pausedAt: new Date() } });
  }

  revalidatePath("/cronometro");
  revalidatePath("/feed");
  redirect("/feed");
}

/**
 * Pauses an in-progress check-in -- the interval until resumeCheckin is
 * called doesn't count toward study time (see Checkin.pausedMs). A no-op if
 * already paused, so a stale/double click can't lose time by pausing twice.
 */
export async function pauseCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, pausedAt: true },
  });
  if (!checkin || checkin.userId !== session.userId || checkin.checkedOutAt) {
    return { message: "Não foi possível pausar esse check-in." };
  }
  if (checkin.pausedAt) return {};

  await prisma.checkin.update({ where: { id: checkinId }, data: { pausedAt: new Date() } });
  revalidatePath("/cronometro");
  return {};
}

/** Resumes a paused check-in, folding the paused interval into pausedMs. A no-op if not currently paused. */
export async function resumeCheckin(checkinId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, pausedAt: true, pausedMs: true },
  });
  if (!checkin || checkin.userId !== session.userId || checkin.checkedOutAt) {
    return { message: "Não foi possível retomar esse check-in." };
  }
  if (!checkin.pausedAt) return {};

  const elapsedPausedMs = Date.now() - checkin.pausedAt.getTime();
  await prisma.checkin.update({
    where: { id: checkinId },
    data: { pausedAt: null, pausedMs: checkin.pausedMs + elapsedPausedMs },
  });
  revalidatePath("/cronometro");
  return {};
}

/**
 * Finishes an in-progress check-in: title, description, the proof photo,
 * and which challenges (zero or more) it's posted under are all collected
 * here, not at start -- this is also the moment the streak is earned (the
 * study_days upsert createCheckin used to do lives here now instead).
 */
export async function checkOutCheckin(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, createdAt: true, pausedAt: true, pausedMs: true },
  });
  if (!checkin || checkin.userId !== session.userId) {
    return { message: "Você não pode finalizar esse check-in." };
  }
  if (checkin.checkedOutAt) {
    return { message: "Esse check-in já foi finalizado." };
  }
  // Checking out while paused still needs to fold that trailing pause into
  // pausedMs -- otherwise the break the user never resumed from would
  // silently count as study time.
  const finalPausedMs = checkin.pausedAt
    ? checkin.pausedMs + (Date.now() - checkin.pausedAt.getTime())
    : checkin.pausedMs;

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

  // Server Actions are reachable via direct POST, not just through this
  // form -- only keep challenge ids the user actually belongs to, rather
  // than trusting whatever was submitted.
  const requestedChallengeIds = formData.getAll("challengeIds").filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  let challengeIds: string[] = [];
  if (requestedChallengeIds.length > 0) {
    const memberships = await prisma.challengeMember.findMany({
      where: { userId: session.userId, challengeId: { in: requestedChallengeIds } },
      select: { challengeId: true },
    });
    challengeIds = memberships.map((m) => m.challengeId);
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
    // post exists -- finishing the post, linking its challenges, and
    // ensuring the study day are all done together so they can never drift
    // apart.
    await prisma.$transaction(async (tx) => {
      await tx.checkin.update({
        where: { id: checkinId },
        data: {
          title,
          description: description || null,
          photoUrl,
          checkedOutAt: new Date(),
          pausedAt: null,
          pausedMs: finalPausedMs,
        },
      });

      if (challengeIds.length > 0) {
        await tx.checkinChallenge.createMany({
          data: challengeIds.map((challengeId) => ({ checkinId, challengeId })),
        });
      }

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
  revalidateChallenges(challengeIds);

  return { success: true };
}

const CheckinEditSchema = CheckoutSchema.pick({ title: true, description: true });

/**
 * Edits a completed check-in's content (and optionally swaps its photo).
 * Deliberately never touches study_days or its challenge links -- editing a
 * post, even changing its title or photo entirely, must never affect the
 * streak or which challenges it counts for.
 */
export async function editCheckin(
  checkinId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession();

  const existing = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { userId: true, checkedOutAt: true, challenges: { select: { challengeId: true } } },
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
  revalidateChallenges(existing.challenges.map((c) => c.challengeId));

  return { success: true };
}

/**
 * Deletes a completed check-in post -- either the author, or an owner/admin
 * of *any* challenge it's linked to moderating an offensive post (streak
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
    select: {
      userId: true,
      createdAt: true,
      checkedOutAt: true,
      challenges: { select: { challengeId: true } },
    },
  });
  if (!checkin || !checkin.checkedOutAt) {
    return { message: "Você não pode excluir esse check-in." };
  }

  const challengeIds = checkin.challenges.map((c) => c.challengeId);
  const isOwner = checkin.userId === session.userId;
  let canModerate = false;
  if (!isOwner) {
    for (const challengeId of challengeIds) {
      if (await canManageChallenge(challengeId, session.userId)) {
        canModerate = true;
        break;
      }
    }
  }
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
  revalidateChallenges(challengeIds);

  return {};
}
