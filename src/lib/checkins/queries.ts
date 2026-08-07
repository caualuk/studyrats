import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDatePtBR, fromDateKey } from "@/lib/dates";

export type FeedCheckin = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string;
  tag: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  dateLabel: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  /** Whether the viewer is the author -- gates the edit/delete controls. */
  isOwner: boolean;
};

function feedCheckinInclude(currentUserId: string) {
  return {
    user: { select: { name: true, username: true, avatarUrl: true } },
    challenge: { select: { name: true } },
    _count: { select: { likes: true, comments: true } },
    // Only fetches *my* like row (if any) instead of every like, so we can
    // derive `likedByMe` without loading the whole likes list.
    likes: { where: { userId: currentUserId }, select: { id: true } },
  } satisfies Prisma.CheckinInclude;
}

type CheckinWithRelations = Prisma.CheckinGetPayload<{
  include: ReturnType<typeof feedCheckinInclude>;
}>;

function toFeedCheckin(c: CheckinWithRelations, currentUserId: string): FeedCheckin {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    photoUrl: c.photoUrl,
    tag: c.challenge?.name ?? "Check-in livre",
    authorId: c.userId,
    authorName: c.user.name,
    authorUsername: c.user.username,
    authorAvatarUrl: c.user.avatarUrl,
    dateLabel: formatDatePtBR(c.createdAt),
    createdAt: c.createdAt,
    likesCount: c._count.likes,
    commentsCount: c._count.comments,
    likedByMe: c.likes.length > 0,
    isOwner: c.userId === currentUserId,
  };
}

export async function getFeedCheckins(
  currentUserId: string,
  limit = 30
): Promise<FeedCheckin[]> {
  const checkins = await prisma.checkin.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: feedCheckinInclude(currentUserId),
  });

  return checkins.map((c) => toFeedCheckin(c, currentUserId));
}

/**
 * A user's study streak calendar, sourced from `study_days` -- not from
 * check-in timestamps. This is what makes the streak independent of
 * whether any given check-in post still exists (see deleteCheckin).
 */
export async function getUserStudyDays(userId: string): Promise<Date[]> {
  const rows = await prisma.studyDay.findMany({
    where: { userId },
    select: { date: true },
  });
  return rows.map((r) => fromDateKey(r.date));
}

/**
 * A user's check-ins, full detail (photo, likes, comments included) --
 * used on the profile page (own or a friend's) for the activity calendar
 * and the per-day check-in list. `viewerId` is separate from `userId`
 * (whose check-ins) so `isOwner`/`likedByMe` reflect the actual viewer on
 * someone else's profile, not the profile owner -- defaults to `userId`
 * for the common case of viewing your own profile.
 */
export async function getUserCheckins(
  userId: string,
  viewerId: string = userId
): Promise<FeedCheckin[]> {
  const checkins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: feedCheckinInclude(viewerId),
  });

  return checkins.map((c) => toFeedCheckin(c, viewerId));
}

/**
 * Every check-in timestamp under a challenge, grouped by author -- used to
 * compute each member's current streak *within that challenge* for the
 * "pista" race (as opposed to `checkinsCount`, a plain total). This stays
 * check-in-based on purpose: a challenge's pista tracks consistency within
 * that specific challenge, not the user's overall study streak.
 */
export async function getChallengeCheckinDatesByMember(
  challengeId: string
): Promise<Map<string, Date[]>> {
  const rows = await prisma.checkin.findMany({
    where: { challengeId },
    select: { userId: true, createdAt: true },
  });

  const byUser = new Map<string, Date[]>();
  for (const row of rows) {
    const dates = byUser.get(row.userId);
    if (dates) dates.push(row.createdAt);
    else byUser.set(row.userId, [row.createdAt]);
  }
  return byUser;
}

/** All check-ins posted under a challenge, used on the challenge detail page. */
export async function getChallengeCheckins(
  challengeId: string,
  currentUserId: string,
  limit = 60
): Promise<FeedCheckin[]> {
  const checkins = await prisma.checkin.findMany({
    where: { challengeId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: feedCheckinInclude(currentUserId),
  });

  return checkins.map((c) => toFeedCheckin(c, currentUserId));
}
