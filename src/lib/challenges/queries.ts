import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/dates";

export type ChallengeOption = {
  id: string;
  name: string;
};

/** Lightweight list used to populate "post this check-in under a challenge" pickers. */
export const getMyChallengeOptions = cache(async (userId: string): Promise<ChallengeOption[]> => {
  const memberships = await prisma.challengeMember.findMany({
    where: { userId },
    select: { challenge: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return memberships.map((m) => m.challenge);
});

export type MyChallengeCard = {
  id: string;
  name: string;
  coverUrl: string | null;
  coverColor: string | null;
  code: string;
  memberCount: number;
  daysLeft: number | null;
  isOwner: boolean;
};

export async function getMyChallenges(userId: string): Promise<MyChallengeCard[]> {
  const memberships = await prisma.challengeMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    select: {
      challenge: {
        select: {
          id: true,
          name: true,
          coverUrl: true,
          coverColor: true,
          code: true,
          ownerId: true,
          endDate: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  const now = new Date();
  return memberships.map(({ challenge: c }) => ({
    id: c.id,
    name: c.name,
    coverUrl: c.coverUrl,
    coverColor: c.coverColor,
    code: c.code,
    memberCount: c._count.members,
    daysLeft: c.endDate ? daysBetween(now, c.endDate) : null,
    isOwner: c.ownerId === userId,
  }));
}

export type ChallengeDetail = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  coverColor: string | null;
  code: string;
  startDate: Date;
  endDate: Date | null;
  daysLeft: number | null;
  memberCount: number;
  isOwner: boolean;
  isAdmin: boolean;
  /** Owner or admin: allowed to edit the challenge and grant admin to others. */
  canManage: boolean;
};

/**
 * Fetches a challenge's detail, scoped to membership: returns null both
 * when the challenge doesn't exist and when the caller isn't a member, so
 * the page can 404 either way without leaking which case it was (these
 * challenges are invite-only, never publicly listed).
 */
export async function getChallengeDetail(
  challengeId: string,
  userId: string
): Promise<ChallengeDetail | null> {
  const membership = await prisma.challengeMember.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
    select: {
      isAdmin: true,
      challenge: {
        select: {
          id: true,
          name: true,
          description: true,
          coverUrl: true,
          coverColor: true,
          code: true,
          startDate: true,
          endDate: true,
          ownerId: true,
          _count: { select: { members: true } },
        },
      },
    },
  });
  if (!membership) return null;

  const c = membership.challenge;
  const isOwner = c.ownerId === userId;
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    coverUrl: c.coverUrl,
    coverColor: c.coverColor,
    code: c.code,
    startDate: c.startDate,
    endDate: c.endDate,
    daysLeft: c.endDate ? daysBetween(new Date(), c.endDate) : null,
    memberCount: c._count.members,
    isOwner,
    isAdmin: membership.isAdmin,
    canManage: isOwner || membership.isAdmin,
  };
}

/**
 * Whether `userId` may edit a challenge's details or grant admin to other
 * members: the owner always can, and so can anyone they've made admin.
 * Used server-side to authorize mutations -- never trust a client-sent flag.
 */
export async function canManageChallenge(challengeId: string, userId: string): Promise<boolean> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { ownerId: true },
  });
  if (!challenge) return false;
  if (challenge.ownerId === userId) return true;

  const membership = await prisma.challengeMember.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
    select: { isAdmin: true },
  });
  return membership?.isAdmin ?? false;
}

export type ChallengeMemberRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  joinedAt: Date;
  isOwner: boolean;
  isAdmin: boolean;
  checkinsCount: number;
};

/** Every member of a challenge, each with their check-in count within it. */
export async function getChallengeMembers(challengeId: string): Promise<ChallengeMemberRow[]> {
  const [members, challenge, grouped] = await Promise.all([
    prisma.challengeMember.findMany({
      where: { challengeId },
      orderBy: { joinedAt: "asc" },
      select: {
        userId: true,
        joinedAt: true,
        isAdmin: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    }),
    prisma.challenge.findUnique({ where: { id: challengeId }, select: { ownerId: true } }),
    prisma.checkin.groupBy({
      by: ["userId"],
      where: { challengeId },
      _count: { id: true },
    }),
  ]);

  const checkinsByUser = new Map(grouped.map((g) => [g.userId, g._count.id]));

  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
    joinedAt: m.joinedAt,
    isOwner: m.userId === challenge?.ownerId,
    isAdmin: m.isAdmin,
    checkinsCount: checkinsByUser.get(m.userId) ?? 0,
  }));
}
