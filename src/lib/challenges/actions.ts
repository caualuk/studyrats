"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { canManageChallenge } from "@/lib/challenges/queries";
import {
  ChallengeCreateSchema,
  ChallengeJoinSchema,
  ChallengeUpdateSchema,
  type FormState,
} from "@/lib/validations";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(length = 6): string {
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const existing = await prisma.challenge.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Não foi possível gerar um código único para o desafio.");
}

export async function createChallenge(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validated = ChallengeCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    weekdays: formData.getAll("weekdays"),
    coverColor: formData.get("coverColor"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { name, description, startDate, endDate, weekdays, coverColor } = validated.data;
  // An empty selection would make the challenge impossible to ever
  // complete a day for, so it falls back to every day rather than none.
  const weekdayNumbers = weekdays && weekdays.length > 0 ? weekdays.map(Number) : [0, 1, 2, 3, 4, 5, 6];
  const isPublic = formData.get("isPublic") === "on";

  let coverUrl: string | null = null;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      coverUrl = await savePhotoUpload(cover, "challenges");
    } catch (error) {
      if (error instanceof UploadError) return { message: error.message };
      throw error;
    }
  }

  try {
    const code = await generateUniqueCode();
    await prisma.challenge.create({
      data: {
        name,
        description: description || null,
        coverUrl,
        coverColor: coverColor || null,
        code,
        isPublic,
        weekdays: weekdayNumbers,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        ownerId: session.userId,
        members: { create: { userId: session.userId } },
      },
      select: { id: true },
    });
  } catch {
    return {
      message:
        "Não foi possível criar o desafio. Confira se o banco de dados está conectado (veja o README).",
    };
  }

  revalidatePath("/desafios");
  return { success: true };
}

export async function updateChallenge(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const challengeId = formData.get("challengeId");
  if (typeof challengeId !== "string" || !challengeId) {
    return { message: "Desafio inválido." };
  }

  if (!(await canManageChallenge(challengeId, session.userId))) {
    return { message: "Você não tem permissão para editar esse desafio." };
  }

  const validated = ChallengeUpdateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    coverColor: formData.get("coverColor"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { name, description, startDate, endDate, coverColor } = validated.data;

  let coverUrl: string | undefined;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    try {
      coverUrl = await savePhotoUpload(cover, "challenges");
    } catch (error) {
      if (error instanceof UploadError) return { message: error.message };
      throw error;
    }
  }

  try {
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        coverColor: coverColor || null,
        ...(coverUrl && { coverUrl }),
      },
    });
  } catch {
    return { message: "Não foi possível salvar as alterações do desafio." };
  }

  revalidatePath(`/desafios/${challengeId}`);
  revalidatePath("/desafios");
  revalidatePath("/feed");
  return { success: true };
}

/**
 * Deletes a challenge entirely -- owner-only (stricter than canManage:
 * an admin can run day-to-day moderation, but blowing away the whole
 * challenge for every member is reserved for whoever created it).
 * ChallengeMember rows cascade-delete, and so do this challenge's rows in
 * the CheckinChallenge join table -- but that only removes the *link*, not
 * the check-ins themselves: a check-in linked to this and another challenge
 * survives linked to the other one, and one only linked here becomes
 * "check-in livre" instead of vanishing. Deleting the container shouldn't
 * erase anyone's study proof.
 */
export async function deleteChallenge(challengeId: string): Promise<{ message?: string }> {
  const session = await verifySession();

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { ownerId: true },
  });
  if (!challenge || challenge.ownerId !== session.userId) {
    return { message: "Você não pode excluir esse desafio." };
  }

  try {
    await prisma.challenge.delete({ where: { id: challengeId } });
  } catch {
    return { message: "Não foi possível excluir o desafio." };
  }

  revalidatePath("/desafios");
  revalidatePath("/feed");
  redirect("/desafios");
}

/** Grants or revokes admin on a challenge for another member. Owner/admin only. */
export async function setChallengeMemberAdmin(
  challengeId: string,
  memberUserId: string,
  isAdmin: boolean
): Promise<void> {
  const session = await verifySession();

  if (!(await canManageChallenge(challengeId, session.userId))) return;

  await prisma.challengeMember.update({
    where: { challengeId_userId: { challengeId, userId: memberUserId } },
    data: { isAdmin },
  });

  revalidatePath(`/desafios/${challengeId}`);
}

export async function joinChallenge(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validated = ChallengeJoinSchema.safeParse({ code: formData.get("code") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const code = validated.data.code.toUpperCase();

  try {
    const challenge = await prisma.challenge.findUnique({ where: { code } });
    if (!challenge) {
      return { message: "Código inválido. Confira com quem te convidou." };
    }

    const alreadyMember = await prisma.challengeMember.findUnique({
      where: { challengeId_userId: { challengeId: challenge.id, userId: session.userId } },
    });
    if (alreadyMember) {
      return { message: "Você já participa desse desafio." };
    }

    await prisma.challengeMember.create({
      data: { challengeId: challenge.id, userId: session.userId },
    });
  } catch {
    return {
      message:
        "Não foi possível entrar no desafio. Confira se o banco de dados está conectado (veja o README).",
    };
  }

  revalidatePath("/desafios");
  return { success: true };
}
