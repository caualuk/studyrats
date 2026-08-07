"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { PUBLIC_USER_SELECT, type PublicUser } from "@/lib/friends/queries";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(length = 12): string {
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
    const existing = await prisma.friendInvite.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Não foi possível gerar um link de convite.");
}

/**
 * Returns the current user's permanent "add me" invite code, creating one
 * on first use. Not single-use -- reusable by as many different people as
 * the user shares it with. Safe to call repeatedly (idempotent).
 */
export async function getOrCreateInviteCode(): Promise<string> {
  const session = await verifySession();

  const existing = await prisma.friendInvite.findFirst({
    where: { inviterId: session.userId },
    select: { code: true },
  });
  if (existing) return existing.code;

  const code = await generateUniqueCode();
  const invite = await prisma.friendInvite.create({
    data: { code, inviterId: session.userId },
    select: { code: true },
  });
  return invite.code;
}

export type AcceptInviteResult =
  | { status: "invalid" }
  | { status: "self" }
  | { status: "already_friends"; friend: PublicUser }
  | { status: "success"; friend: PublicUser };

/**
 * Accepts a friend invite link. Idempotent: visiting the same link twice
 * (or an already-mutual invite) never creates duplicate friendship rows --
 * it just reports "already_friends" and shows the same pair of photos.
 */
export async function acceptFriendInvite(code: string): Promise<AcceptInviteResult> {
  const session = await verifySession();

  const invite = await prisma.friendInvite.findUnique({
    where: { code },
    select: { inviterId: true, inviter: { select: PUBLIC_USER_SELECT } },
  });
  if (!invite) return { status: "invalid" };
  if (invite.inviterId === session.userId) return { status: "self" };

  const existing = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: session.userId, friendId: invite.inviterId } },
  });
  if (existing) return { status: "already_friends", friend: invite.inviter };

  await prisma.$transaction([
    prisma.friendship.create({ data: { userId: session.userId, friendId: invite.inviterId } }),
    prisma.friendship.create({ data: { userId: invite.inviterId, friendId: session.userId } }),
  ]);

  revalidatePath("/perfil");
  return { status: "success", friend: invite.inviter };
}
