"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { LoginSchema, SignupSchema } from "@/lib/validations";
import type { FormState } from "@/lib/validations";

const DB_ERROR_MESSAGE =
  "Não foi possível conectar ao banco de dados. Configure a conexão (veja o README) e tente novamente.";

/**
 * Where to send the user after login/signup. Only accepts same-site paths
 * (single leading "/", never "//..." which browsers treat as protocol-
 * relative) so a crafted `next` value can't redirect off-site.
 */
function safeRedirectTarget(next: FormDataEntryValue | null): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/feed";
}

/** True when the error is Prisma failing to reach/find the database. */
function isDatabaseUnavailableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code !== "P2002") ||
    (error instanceof Error && /no such table|unable to open|ENOENT/i.test(error.message))
  );
}

export async function signup(_prevState: FormState, formData: FormData): Promise<FormState> {
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: flattenZodErrors(validated.error) };
  }

  const { name, username, email, password } = validated.data;

  let userId: string;
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return { message: DB_ERROR_MESSAGE };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined)?.join(", ");
      return {
        message: target?.includes("email")
          ? "Já existe uma conta com esse e-mail."
          : "Esse nome de usuário já está em uso.",
      };
    }
    throw error;
  }

  await createSession(userId);
  redirect(safeRedirectTarget(formData.get("next")));
}

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  const validated = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: flattenZodErrors(validated.error) };
  }

  const { identifier, password } = validated.data;

  let userId: string;
  let passwordHash: string;
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return { message: "E-mail/usuário ou senha incorretos." };
    }
    userId = user.id;
    passwordHash = user.passwordHash;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return { message: DB_ERROR_MESSAGE };
    }
    throw error;
  }

  const passwordMatches = await verifyPassword(password, passwordHash);
  if (!passwordMatches) {
    return { message: "E-mail/usuário ou senha incorretos." };
  }

  await createSession(userId);
  redirect(safeRedirectTarget(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// Small local helper so we don't repeat `.flatten().fieldErrors` casting
// everywhere -- zod v4's flatten() already returns string[] per field.
function flattenZodErrors(error: { flatten: () => { fieldErrors: Record<string, unknown> } }) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
