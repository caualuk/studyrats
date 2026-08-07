import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDatePtBR, fromDateKey, startOfMonth } from "@/lib/dates";
import { getManagedChallengeIds, getMyChallengeIds } from "@/lib/challenges/queries";

/** Every completed-checkin query filters on this -- an in-progress session (no checkedOutAt) never "counts" anywhere. */
const COMPLETED: Prisma.CheckinWhereInput = { checkedOutAt: { not: null } };

export type FeedCheckin = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string;
  /** Every challenge this check-in was posted under -- empty means "check-in livre". Chosen at check-out, see checkOutCheckin. */
  challenges: { id: string; name: string }[];
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  dateLabel: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  /** Whether the viewer is the author -- gates the edit control (and, together with canDelete, the delete control). */
  isOwner: boolean;
  /** Author, or an owner/admin of any challenge this check-in is linked to -- gates the delete control. */
  canDelete: boolean;
};

function feedCheckinInclude(currentUserId: string) {
  return {
    user: { select: { name: true, username: true, avatarUrl: true } },
    challenges: { select: { challenge: { select: { id: true, name: true } } } },
    _count: { select: { likes: true, comments: true } },
    // Only fetches *my* like row (if any) instead of every like, so we can
    // derive `likedByMe` without loading the whole likes list.
    likes: { where: { userId: currentUserId }, select: { id: true } },
  } satisfies Prisma.CheckinInclude;
}

type CheckinWithRelations = Prisma.CheckinGetPayload<{
  include: ReturnType<typeof feedCheckinInclude>;
}>;

function toFeedCheckin(
  c: CheckinWithRelations,
  currentUserId: string,
  managedChallengeIds: Set<string>,
  visibleChallengeIds: Set<string>
): FeedCheckin {
  const isOwner = c.userId === currentUserId;
  const allChallenges = c.challenges.map((link) => link.challenge);
  // Badges only show challenges the *viewer* is also a member of -- a
  // check-in can stay visible (via friendship, or another shared challenge)
  // without leaking the name of a challenge the viewer isn't part of.
  // canDelete still checks the full, unfiltered list: moderation authority
  // doesn't depend on what's shown.
  const challenges = allChallenges.filter((ch) => visibleChallengeIds.has(ch.id));
  return {
    id: c.id,
    // Non-null: every caller here queries with the COMPLETED filter, and
    // title/photoUrl are only ever null before check-out (see checkOutCheckin,
    // which sets both together with checkedOutAt in the same update).
    title: c.title!,
    description: c.description,
    photoUrl: c.photoUrl!,
    challenges,
    authorId: c.userId,
    authorName: c.user.name,
    authorUsername: c.user.username,
    authorAvatarUrl: c.user.avatarUrl,
    dateLabel: formatDatePtBR(c.createdAt),
    createdAt: c.createdAt,
    likesCount: c._count.likes,
    commentsCount: c._count.comments,
    likedByMe: c.likes.length > 0,
    isOwner,
    canDelete: isOwner || allChallenges.some((ch) => managedChallengeIds.has(ch.id)),
  };
}

/**
 * The Feed shows only friends' check-ins -- not the viewer's own, and
 * nothing at all if they have no friends yet. A friend's check-in linked to
 * one or more challenges additionally only shows if the *viewer* also
 * participates in at least one of them (posting in a challenge someone
 * isn't part of shouldn't leak into their friends' feeds just because
 * they're friends with a member) -- a check-in with no challenge links at
 * all is always visible to friends.
 */
export async function getFeedCheckins(
  currentUserId: string,
  limit = 30
): Promise<FeedCheckin[]> {
  const friendships = await prisma.friendship.findMany({
    where: { userId: currentUserId },
    select: { friendId: true },
  });
  const friendIds = friendships.map((f) => f.friendId);
  if (friendIds.length === 0) return [];

  const myChallengeIds = await getMyChallengeIds(currentUserId);

  const [checkins, managedChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: {
        ...COMPLETED,
        userId: { in: friendIds },
        OR: [
          { challenges: { none: {} } },
          { challenges: { some: { challengeId: { in: [...myChallengeIds] } } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: feedCheckinInclude(currentUserId),
    }),
    getManagedChallengeIds(currentUserId),
  ]);

  return checkins.map((c) => toFeedCheckin(c, currentUserId, managedChallengeIds, myChallengeIds));
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
  const [checkins, managedChallengeIds, myChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: { userId, ...COMPLETED },
      orderBy: { createdAt: "desc" },
      include: feedCheckinInclude(viewerId),
    }),
    getManagedChallengeIds(viewerId),
    getMyChallengeIds(viewerId),
  ]);

  return checkins.map((c) => toFeedCheckin(c, viewerId, managedChallengeIds, myChallengeIds));
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
    where: { ...COMPLETED, challenges: { some: { challengeId } } },
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

/**
 * All check-ins posted under a challenge, used on the challenge detail
 * page. A check-in linked to several challenges shows up on each of their
 * pages -- it's still a single post, just cross-listed (see CheckinChallenge).
 */
export async function getChallengeCheckins(
  challengeId: string,
  currentUserId: string,
  limit = 60
): Promise<FeedCheckin[]> {
  const [checkins, managedChallengeIds, myChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: { ...COMPLETED, challenges: { some: { challengeId } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: feedCheckinInclude(currentUserId),
    }),
    getManagedChallengeIds(currentUserId),
    getMyChallengeIds(currentUserId),
  ]);

  return checkins.map((c) => toFeedCheckin(c, currentUserId, managedChallengeIds, myChallengeIds));
}

export type ActiveCheckin = {
  id: string;
  createdAt: Date;
  /** Set while on a break -- see Checkin.pausedAt. Null means currently running (or never started a pause). */
  pausedAt: Date | null;
  /** Accumulated paused duration in ms, not counting an in-progress pause (pausedAt) -- see Checkin.pausedMs. */
  pausedMs: number;
};

/**
 * The user's in-progress check-in (started, not yet checked out), if any --
 * drives the navbar timer and the cronometer page. At most one at a time,
 * see startCheckin. Which challenges (if any) it'll be linked to is chosen
 * at check-out, not here, so there's nothing challenge-related to select yet.
 */
export async function getActiveCheckin(userId: string): Promise<ActiveCheckin | null> {
  return prisma.checkin.findFirst({
    where: { userId, checkedOutAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, pausedAt: true, pausedMs: true },
  });
}

/** Total hours studied this calendar month, summed from completed check-ins' check-in-to-check-out duration minus any paused time. Drives the profile's "Este mês" stat. */
export async function getStudyHoursThisMonth(userId: string): Promise<number> {
  const rows = await prisma.checkin.findMany({
    where: { userId, checkedOutAt: { not: null, gte: startOfMonth() } },
    select: { createdAt: true, checkedOutAt: true, pausedMs: true },
  });

  const totalMs = rows.reduce(
    (sum, r) => sum + (r.checkedOutAt!.getTime() - r.createdAt.getTime() - r.pausedMs),
    0
  );
  return totalMs / (1000 * 60 * 60);
}
