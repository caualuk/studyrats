import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfMonth, startOfWeek } from "@/lib/dates";

export type RankingRow = {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  checkinsCount: number;
};

export type RankingPeriod = "day" | "week" | "month";

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

/** Ranks users by how many check-ins they've logged since the start of `period`. */
export async function getRanking(period: RankingPeriod, limit = 10): Promise<RankingRow[]> {
  const since = periodStart(period);

  const grouped = await prisma.checkin.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since }, checkedOutAt: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return grouped.map((g, index) => {
    const user = userById.get(g.userId);
    return {
      position: index + 1,
      userId: g.userId,
      name: user?.name ?? "Usuário removido",
      avatarUrl: user?.avatarUrl ?? null,
      checkinsCount: g._count.id,
    };
  });
}
