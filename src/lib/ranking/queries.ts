import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfMonth, startOfWeek } from "@/lib/dates";

export type RankingRow = {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  checkinsCount: number;
  studyMs: number;
};

export type RankingPeriod = "day" | "week" | "month";
export type RankingMetric = "checkins" | "hours";

function periodStart(period: RankingPeriod): Date {
  switch (period) {
    case "day":
      return startOfDay();
    case "week":
      return startOfWeek();
    case "month":
      return startOfMonth();
  }
}

/**
 * Ranks users by check-ins or total study time logged since the start of
 * `period`, scoped to `currentUserId` and their friends -- same audience as
 * the feed, so ranking never surfaces strangers. Fetched as raw rows (not a
 * groupBy) because both metrics are needed regardless of which one is
 * sorted on -- the inactive metric still shows in the row, same tradeoff as
 * getStudyHoursThisMonth.
 */
export async function getRanking(
  period: RankingPeriod,
  metric: RankingMetric = "checkins",
  currentUserId: string,
  limit = 10
): Promise<RankingRow[]> {
  const since = periodStart(period);

  const friendships = await prisma.friendship.findMany({
    where: { userId: currentUserId },
    select: { friendId: true },
  });
  const audienceIds = [currentUserId, ...friendships.map((f) => f.friendId)];

  const checkins = await prisma.checkin.findMany({
    where: {
      userId: { in: audienceIds },
      createdAt: { gte: since },
      checkedOutAt: { not: null },
    },
    select: { userId: true, createdAt: true, checkedOutAt: true, pausedMs: true },
  });

  const statsByUser = new Map<string, { count: number; ms: number }>();
  for (const c of checkins) {
    const stats = statsByUser.get(c.userId) ?? { count: 0, ms: 0 };
    stats.count += 1;
    stats.ms += c.checkedOutAt!.getTime() - c.createdAt.getTime() - c.pausedMs;
    statsByUser.set(c.userId, stats);
  }

  const ranked = [...statsByUser.entries()]
    .sort((a, b) => (metric === "hours" ? b[1].ms - a[1].ms : b[1].count - a[1].count))
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map(([userId]) => userId) } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return ranked.map(([userId, stats], index) => {
    const user = userById.get(userId);
    return {
      position: index + 1,
      userId,
      name: user?.name ?? "Usuário removido",
      avatarUrl: user?.avatarUrl ?? null,
      checkinsCount: stats.count,
      studyMs: stats.ms,
    };
  });
}
