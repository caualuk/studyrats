"use client";

import { useMemo, useState } from "react";
import { PillTabs } from "@/components/ui/PillTabs";
import { RankingList } from "@/components/ranking/RankingList";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RankingMetric, RankingRow } from "@/lib/ranking/queries";

const METRICS: { value: RankingMetric; label: string }[] = [
  { value: "hours", label: "Horas" },
  { value: "checkins", label: "Check-ins" },
];

/**
 * Every member's checkins/hours totals are already fetched server-side, so
 * switching the metric here is a pure client-side re-sort -- no navigation,
 * no server round-trip, no scroll jump.
 */
export function ChallengeRanking({ rows }: { rows: RankingRow[] }) {
  const [metric, setMetric] = useState<RankingMetric>("hours");

  const sortedRows = useMemo(() => {
    return rows
      .filter((row) => row.checkinsCount > 0)
      .sort((a, b) => (metric === "hours" ? b.studyMs - a.studyMs : b.checkinsCount - a.checkinsCount))
      .map((row, index) => ({ ...row, position: index + 1 }));
  }, [rows, metric]);

  return (
    <>
      <PillTabs className="mb-4" active={metric} onSelect={setMetric} options={METRICS} />
      {sortedRows.length > 0 ? (
        <RankingList rows={sortedRows} metric={metric} />
      ) : (
        <EmptyState title="Ninguém fez check-in nesse desafio ainda." />
      )}
    </>
  );
}
