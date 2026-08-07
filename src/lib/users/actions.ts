"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { savePhotoUpload, UploadError } from "@/lib/uploads";
import { UpdateBioSchema, type FormState } from "@/lib/validations";

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

export async function updateBio(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validated = UpdateBioSchema.safeParse({ bio: formData.get("bio") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { bio: validated.data.bio || null },
    });
  } catch {
    return { message: "Não foi possível salvar a bio." };
  }

  revalidatePath("/perfil");
  return { success: true };
}
