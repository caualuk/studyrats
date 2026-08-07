import type { Metadata } from "next";
import Link from "next/link";
import { getRanking, type RankingPeriod } from "@/lib/ranking/queries";
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

const DEFAULT_PERIOD: RankingPeriod = "week";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const active =
    PERIODS.find((p) => p.value === rawPeriod) ??
    PERIODS.find((p) => p.value === DEFAULT_PERIOD)!;

  const rows = await getRanking(active.value);

  return (
    <div className="mx-auto max-w-[820px] px-6 pb-20 pt-14 text-center">
      <h1 className="mb-2 text-[42px] font-extrabold">Ranking.</h1>
      <p className="mb-6 text-sm text-white/50">{active.subtitle}</p>

      <div className="mb-8 inline-flex gap-1 rounded-full border border-border-strong p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={p.value === DEFAULT_PERIOD ? "/ranking" : `/ranking?period=${p.value}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors",
              p.value === active.value
                ? "bg-accent text-accent-ink"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={active.emptyTitle} description={active.emptyDescription} />
      ) : (
        <RankingList rows={rows} />
      )}
    </div>
  );
}
