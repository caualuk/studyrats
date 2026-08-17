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
  /** Study time for this session: checkedOutAt - createdAt, minus pausedMs. Same calc as getStudyHoursThisMonth, just per-checkin. */
  durationMs: number;
  /** Both null when the "respondeu questões?" flag was off at check-out -- see Checkin.questionsTotal. Pre-fills EditCheckinDialog's own copy of that flag. */
  questionsTotal: number | null;
  questionsCorrect: number | null;
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
    durationMs: c.checkedOutAt!.getTime() - c.createdAt.getTime() - c.pausedMs,
    questionsTotal: c.questionsTotal,
    questionsCorrect: c.questionsCorrect,
    likesCount: c._count.likes,
    commentsCount: c._count.comments,
    likedByMe: c.likes.length > 0,
    isOwner,
    canDelete: isOwner || allChallenges.some((ch) => managedChallengeIds.has(ch.id)),
  };
}

/** Default page size for every cursor-paginated check-in list below (feed, challenge, profile). */
export const CHECKIN_PAGE_SIZE = 12;

export type CheckinPage = {
  items: FeedCheckin[];
  /** The last item's id, to pass back in as `cursor` for the next page -- null once there's nothing more to load. */
  nextCursor: string | null;
};

/**
 * Runs a findMany for one more row than `limit`, and turns the raw rows plus
 * that lookahead row into a CheckinPage -- the one bit of bookkeeping shared
 * by every cursor-paginated query below (feed, challenge, profile). Ordering
 * must stay `createdAt desc, id desc` (matching every caller here): the
 * id tiebreaker is what keeps the keyset stable when two check-ins share a
 * `createdAt`, which a plain `createdAt` cursor alone can't disambiguate.
 */
function toPage(
  checkins: CheckinWithRelations[],
  limit: number,
  currentUserId: string,
  managedChallengeIds: Set<string>,
  visibleChallengeIds: Set<string>
): CheckinPage {
  const hasMore = checkins.length > limit;
  const page = hasMore ? checkins.slice(0, limit) : checkins;
  return {
    items: page.map((c) => toFeedCheckin(c, currentUserId, managedChallengeIds, visibleChallengeIds)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
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
 *
 * Cursor-paginated (see toPage): the page component's initial render passes
 * no cursor, and the "Ver mais" button re-calls this (via a server action)
 * with the previous page's `nextCursor` to fetch the next batch.
 */
export async function getFeedCheckinsPage(
  currentUserId: string,
  cursor?: string,
  limit = CHECKIN_PAGE_SIZE
): Promise<CheckinPage> {
  const friendships = await prisma.friendship.findMany({
    where: { userId: currentUserId },
    select: { friendId: true },
  });
  const friendIds = friendships.map((f) => f.friendId);
  if (friendIds.length === 0) return { items: [], nextCursor: null };

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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: feedCheckinInclude(currentUserId),
    }),
    getManagedChallengeIds(currentUserId),
  ]);

  return toPage(checkins, limit, currentUserId, managedChallengeIds, myChallengeIds);
}

/**
 * Just the count, for contexts that show a stat tile but shouldn't fetch
 * (and thus never even hold in memory) photo URLs or other detail -- e.g. a
 * private profile's stats-only view for non-friends.
 */
export async function getUserCheckinsCount(userId: string): Promise<number> {
  return prisma.checkin.count({ where: { userId, ...COMPLETED } });
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
 * cursor-paginated (see toPage), used on the profile page (own or a
 * friend's) for the "últimos check-ins" list below the activity calendar.
 * `viewerId` is separate from `userId` (whose check-ins) so
 * `isOwner`/`likedByMe` reflect the actual viewer on someone else's
 * profile, not the profile owner.
 */
export async function getUserCheckinsPage(
  userId: string,
  viewerId: string,
  cursor?: string,
  limit = CHECKIN_PAGE_SIZE
): Promise<CheckinPage> {
  const [checkins, managedChallengeIds, myChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: { userId, ...COMPLETED },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: feedCheckinInclude(viewerId),
    }),
    getManagedChallengeIds(viewerId),
    getMyChallengeIds(viewerId),
  ]);

  return toPage(checkins, limit, viewerId, managedChallengeIds, myChallengeIds);
}

export type CalendarCheckin = { createdAt: Date; photoUrl: string };

/**
 * Just enough to paint the activity calendar for one month -- no likes,
 * comments, or challenge joins, unlike getUserCheckinsPage. Fetched fresh
 * whenever the calendar's month changes (see ProfileActivity) instead of
 * requiring the whole check-in history up front, which is what let the
 * calendar page through arbitrarily old months before pagination existed.
 */
export async function getUserCheckinsForMonth(
  userId: string,
  year: number,
  month: number
): Promise<CalendarCheckin[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const rows = await prisma.checkin.findMany({
    where: { userId, ...COMPLETED, createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, photoUrl: true },
  });
  return rows.map((r) => ({ createdAt: r.createdAt, photoUrl: r.photoUrl! }));
}

/**
 * Every check-in a user posted on one specific calendar day, full detail --
 * what the profile's "últimos check-ins" list switches to once a calendar
 * day is clicked (see ProfileActivity). Not paginated: a single day's worth
 * of check-ins is small enough not to need it.
 */
export async function getUserCheckinsForDay(
  userId: string,
  viewerId: string,
  year: number,
  month: number,
  day: number
): Promise<FeedCheckin[]> {
  const start = new Date(year, month, day);
  const end = new Date(year, month, day + 1);

  const [checkins, managedChallengeIds, myChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: { userId, ...COMPLETED, createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      include: feedCheckinInclude(viewerId),
    }),
    getManagedChallengeIds(viewerId),
    getMyChallengeIds(viewerId),
  ]);

  return checkins.map((c) => toFeedCheckin(c, viewerId, managedChallengeIds, myChallengeIds));
}

/**
 * All check-ins posted under a challenge, cursor-paginated (see toPage),
 * used on the challenge detail page. A check-in linked to several
 * challenges shows up on each of their pages -- it's still a single post,
 * just cross-listed (see CheckinChallenge).
 */
export async function getChallengeCheckinsPage(
  challengeId: string,
  currentUserId: string,
  cursor?: string,
  limit = CHECKIN_PAGE_SIZE
): Promise<CheckinPage> {
  const [checkins, managedChallengeIds, myChallengeIds] = await Promise.all([
    prisma.checkin.findMany({
      where: { ...COMPLETED, challenges: { some: { challengeId } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: feedCheckinInclude(currentUserId),
    }),
    getManagedChallengeIds(currentUserId),
    getMyChallengeIds(currentUserId),
  ]);

  return toPage(checkins, limit, currentUserId, managedChallengeIds, myChallengeIds);
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

export type StatsCheckin = {
  createdAt: Date;
  /** Study time for this session: checkedOutAt - createdAt, minus pausedMs -- same calc as getStudyHoursThisMonth, kept per-checkin here. */
  durationMs: number;
  /** Both null when the "respondeu questões?" flag was off at check-out -- see Checkin.questionsTotal. */
  questionsTotal: number | null;
  questionsCorrect: number | null;
};

/**
 * Every completed check-in's date, study duration, and (if tracked)
 * question accuracy -- the raw material for the /estatisticas page. Fetched
 * in full (not pre-aggregated) so the client can slice by day/week/month
 * and by an arbitrary picked day without a round-trip per filter change.
 */
export async function getUserStatsCheckins(userId: string): Promise<StatsCheckin[]> {
  const rows = await prisma.checkin.findMany({
    where: { userId, ...COMPLETED },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      checkedOutAt: true,
      pausedMs: true,
      questionsTotal: true,
      questionsCorrect: true,
    },
  });

  return rows.map((r) => ({
    createdAt: r.createdAt,
    durationMs: r.checkedOutAt!.getTime() - r.createdAt.getTime() - r.pausedMs,
    questionsTotal: r.questionsTotal,
    questionsCorrect: r.questionsCorrect,
  }));
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
