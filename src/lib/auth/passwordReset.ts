"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  type FormState,
} from "@/lib/validations";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // matches Supabase's own per-user minimum

// Shown regardless of whether the email exists, so this flow can't be used
// to check who has an account (classic forgot-password anti-enumeration).
const GENERIC_SENT_MESSAGE =
  "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha em alguns minutos.";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = RequestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const email = validated.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // Don't reveal whether the account exists -- and there's nothing to send.
  if (!user) {
    return { success: true, message: GENERIC_SENT_MESSAGE };
  }

  // Cooldown: skip re-sending if we just sent one. Supabase's built-in
  // sender is capped at only 2 emails/hour for the *whole project*, so
  // avoiding an accidental double-submit resend matters a lot here.
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recentToken) {
    return { success: true, message: GENERIC_SENT_MESSAGE };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  try {
    // Invalidate any older links before issuing a new one.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const supabase = getSupabaseAdmin();

    // Our own users table is separate from Supabase Auth's `auth.users` --
    // mirror a (passwordless) shadow record there so Supabase's mailer has
    // someone to send to. Ignore "already exists" from previous requests.
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError && !/already.*(registered|exists)/i.test(createError.message)) {
      throw createError;
    }

    // Supabase's own link would normally go through its own /verify+token
    // flow. The project's Recovery email template has been changed to link
    // `{{ .RedirectTo }}` instead of `{{ .ConfirmationURL }}` (see
    // README.md), so this redirectTo becomes the actual link the user
    // clicks -- straight to our own page with our own token, bypassing
    // Supabase's token entirely.
    const origin = await getAppOrigin();
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/redefinir-senha/${rawToken}`,
    });
    if (sendError) throw sendError;
  } catch (error) {
    console.error("[requestPasswordReset]", error);
    return {
      message:
        "Não foi possível enviar o e-mail agora. O remetente padrão do Supabase só envia " +
        "para membros do projeto (até 2 e-mails/hora) -- configure um SMTP customizado no " +
        "painel do Supabase para uso real. Veja o README.",
    };
  }

  return { success: true, message: GENERIC_SENT_MESSAGE };
}

export async function resetPassword(
  token: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validated = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const tokenHash = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return { message: "Esse link é inválido ou expirou. Peça um novo." };
  }

  try {
    const passwordHash = await hashPassword(validated.data.password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  } catch (error) {
    console.error("[resetPassword]", error);
    return { message: "Não foi possível redefinir a senha agora. Tente de novo." };
  }

  await createSession(record.userId);
  redirect("/feed");
}
