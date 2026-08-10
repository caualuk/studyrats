"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { UpdateProfileSchema, type FormState } from "@/lib/validations";

export async function updateAvatar(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return { message: "Escolha uma imagem." };
  }

  let avatarUrl: string;
  try {
    avatarUrl = await savePhotoUpload(avatar, "avatars");
  } catch (error) {
    if (error instanceof UploadError) return { message: error.message };
    throw error;
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl },
    });
  } catch {
    return { message: "Não foi possível salvar a foto de perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/feed");
  revalidatePath("/ranking");
  return { success: true };
}

export async function updateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validated = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { name, username } = validated.data;

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name, username: username.toLowerCase() },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { username: ["Esse nome de usuário já está em uso."] } };
    }
    return { message: "Não foi possível salvar o perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath(`/perfil/${username.toLowerCase()}`);
  revalidatePath("/feed");
  revalidatePath("/ranking");
  revalidatePath("/desafios");
  return { success: true };
}

export async function updatePrivacy(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const isPrivate = formData.get("isPrivate") === "on";

  let username: string;
  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { isPrivate },
      select: { username: true },
    });
    username = user.username;
  } catch {
    return { message: "Não foi possível salvar a privacidade do perfil." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/perfil");
  revalidatePath(`/perfil/${username}`);
  return { success: true };
}
