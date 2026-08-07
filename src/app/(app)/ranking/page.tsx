import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getRanking, type RankingMetric, type RankingPeriod } from "@/lib/ranking/queries";
import { RankingList } from "@/components/ranking/RankingList";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Ranking" };

const PERIODS: {
  value: RankingPeriod;
  label: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    value: "day",
    label: "Dia",
    subtitle: "Quem mais fez check-in hoje.",
    emptyTitle: "Ninguém fez check-in hoje ainda.",
    emptyDescription: "O ranking reinicia à meia-noite. Seja o primeiro a aparecer aqui.",
  },
  {
    value: "week",
    label: "Semana",
    subtitle: "Quem mais fez check-in essa semana.",
    emptyTitle: "Ninguém fez check-in essa semana ainda.",
    emptyDescription: "O ranking é reiniciado toda segunda-feira. Seja o primeiro a aparecer aqui.",
  },
  {
    value: "month",
    label: "Mês",
    subtitle: "Quem mais fez check-in esse mês.",
    emptyTitle: "Ninguém fez check-in esse mês ainda.",
    emptyDescription: "O ranking é reiniciado todo início de mês. Seja o primeiro a aparecer aqui.",
  },
];

const METRICS: { value: RankingMetric; label: string }[] = [
  { value: "checkins", label: "Check-ins" },
  { value: "hours", label: "Horas" },
];

const DEFAULT_PERIOD: RankingPeriod = "week";
const DEFAULT_METRIC: RankingMetric = "checkins";

function buildHref(period: RankingPeriod, metric: RankingMetric): string {
  const params = new URLSearchParams();
  if (period !== DEFAULT_PERIOD) params.set("period", period);
  if (metric !== DEFAULT_METRIC) params.set("metric", metric);
  const qs = params.toString();
  return qs ? `/ranking?${qs}` : "/ranking";
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; metric?: string }>;
}) {
  const { period: rawPeriod, metric: rawMetric } = await searchParams;
  const activePeriod =
    PERIODS.find((p) => p.value === rawPeriod) ??
    PERIODS.find((p) => p.value === DEFAULT_PERIOD)!;
  const activeMetric =
    METRICS.find((m) => m.value === rawMetric) ??
    METRICS.find((m) => m.value === DEFAULT_METRIC)!;

  const user = await getCurrentUser();
  const rows = await getRanking(activePeriod.value, activeMetric.value, user.id);

  return (
    <div className="mx-auto max-w-[820px] px-6 pb-20 pt-14 text-center">
      <h1 className="mb-2 text-[42px] font-extrabold">Ranking.</h1>
      <p className="mb-6 text-sm text-white/50">{activePeriod.subtitle}</p>

      <div className="mb-3 inline-flex gap-1 rounded-full border border-border-strong p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={buildHref(p.value, activeMetric.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors",
              p.value === activePeriod.value
                ? "bg-accent text-accent-ink"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <div className="mb-8 flex justify-center">
        <div className="inline-flex gap-1 rounded-full border border-border-strong p-1">
          {METRICS.map((m) => (
            <Link
              key={m.value}
              href={buildHref(activePeriod.value, m.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors",
                m.value === activeMetric.value
                  ? "bg-accent text-accent-ink"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={activePeriod.emptyTitle} description={activePeriod.emptyDescription} />
      ) : (
        <RankingList rows={rows} metric={activeMetric.value} />
      )}
    </div>
  );
}
