"use client";

import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { PillTabs } from "@/components/ui/PillTabs";
import { StatsGrid } from "@/components/stats/StatsGrid";
import { GrowingNumber } from "@/components/checkins/GrowingNumber";
import { AccuracyChart } from "@/components/estatisticas/AccuracyChart";
import { HoursChart, type HoursBar } from "@/components/estatisticas/HoursChart";
import {
  addDays,
  formatDatePtBR,
  fromDateKey,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateKey,
  WEEKDAY_SHORT_PT,
} from "@/lib/dates";
import { cn } from "@/lib/cn";
import type { StatsCheckin } from "@/lib/checkins/queries";

type Period = "day" | "week" | "month";

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

const QUICK_DAYS = [
  { label: "Hoje", offset: 0 },
  { label: "Ontem", offset: -1 },
  { label: "Anteontem", offset: -2 },
] as const;

/** The stat tiles' date range: exactly the selected day / this week / this month. */
function periodRange(period: Period, referenceDay: Date): { start: Date; end: Date } {
  if (period === "day") {
    const start = startOfDay(referenceDay);
    return { start, end: addDays(start, 1) };
  }
  if (period === "week") {
    const start = startOfWeek(referenceDay);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfMonth(referenceDay);
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
}

/**
 * The hours-chart's date range -- wider than periodRange for "day" (a
 * single day would render as one bar, not a chart), same range otherwise.
 */
function chartRange(period: Period, referenceDay: Date): { start: Date; end: Date } {
  if (period === "day") {
    const end = addDays(startOfDay(referenceDay), 1);
    return { start: addDays(end, -14), end };
  }
  return periodRange(period, referenceDay);
}

function inRange(date: Date, range: { start: Date; end: Date }): boolean {
  return date >= range.start && date < range.end;
}

/**
 * Filters, period tiles, and both charts for the user's study/questions
 * history -- everything is computed client-side from the full check-in list
 * the server already fetched, so switching Dia/Semana/Mês (or picking a
 * different day) is instant with no round-trip.
 */
export function StatsView({ checkins }: { checkins: StatsCheckin[] }) {
  const [period, setPeriod] = useState<Period>("week");
  const [selectedDay, setSelectedDay] = useState(() => startOfDay());
  // Which half of the calendar month the "Horas por dia" chart shows, while
  // period === "month" -- all ~30 bars at once made the chart unreadably
  // cramped, so it's split into 1-15 / 16-end, paged with the arrows below.
  const [monthHalf, setMonthHalf] = useState<0 | 1>(0);

  const range = useMemo(() => periodRange(period, selectedDay), [period, selectedDay]);
  const periodCheckins = useMemo(
    () => checkins.filter((c) => inRange(c.createdAt, range)),
    [checkins, range]
  );

  const totalHoursMs = periodCheckins.reduce((sum, c) => sum + c.durationMs, 0);
  const tracked = periodCheckins.filter((c) => c.questionsTotal != null);
  const totalAnswered = tracked.reduce((sum, c) => sum + c.questionsTotal!, 0);
  const totalCorrect = tracked.reduce((sum, c) => sum + (c.questionsCorrect ?? 0), 0);
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const avgAnswered = tracked.length > 0 ? totalAnswered / tracked.length : 0;
  const avgCorrect = tracked.length > 0 ? totalCorrect / tracked.length : 0;

  const hRange = useMemo(() => chartRange(period, selectedDay), [period, selectedDay]);
  const hoursBars = useMemo(() => {
    const msByDay = new Map<string, number>();
    for (const c of checkins) {
      if (!inRange(c.createdAt, hRange)) continue;
      const key = toDateKey(c.createdAt);
      msByDay.set(key, (msByDay.get(key) ?? 0) + c.durationMs);
    }

    const selectedKey = toDateKey(selectedDay);
    const bars: HoursBar[] = [];
    for (let cursor = new Date(hRange.start); cursor < hRange.end; cursor = addDays(cursor, 1)) {
      const key = toDateKey(cursor);
      bars.push({
        key,
        label: period === "week" ? WEEKDAY_SHORT_PT[cursor.getDay()] : String(cursor.getDate()),
        fullLabel: formatDatePtBR(cursor),
        hours: (msByDay.get(key) ?? 0) / 3_600_000,
        highlighted: period === "day" && key === selectedKey,
      });
    }
    return bars;
  }, [checkins, hRange, period, selectedDay]);

  const daysInMonth = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 0).getDate();
  // Bar `key` is a "YYYY-MM-DD" toDateKey string -- the last two chars are
  // the day-of-month, cheaper than re-parsing a Date per bar.
  const displayedBars =
    period === "month"
      ? hoursBars.filter((b) => (Number(b.key.slice(-2)) <= 15) === (monthHalf === 0))
      : hoursBars;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PillTabs
          active={period}
          options={PERIODS}
          onSelect={(value) => {
            setPeriod(value);
            setSelectedDay(startOfDay());
            setMonthHalf(0);
          }}
        />

        {period === "day" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {QUICK_DAYS.map((quick) => {
              const date = addDays(startOfDay(), quick.offset);
              const isActive = toDateKey(date) === toDateKey(selectedDay);
              return (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => setSelectedDay(date)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-strong text-white/55 hover:text-white/80"
                  )}
                >
                  {quick.label}
                </button>
              );
            })}
            <input
              type="date"
              value={toDateKey(selectedDay)}
              max={toDateKey(new Date())}
              onChange={(event) => {
                if (event.target.value) setSelectedDay(fromDateKey(event.target.value));
              }}
              className="rounded-full border border-border-strong bg-white/5 px-3 py-1.5 text-[12px] text-white/70 outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      <StatsGrid
        size="sm"
        stats={[
          {
            value: <GrowingNumber value={totalHoursMs / 3_600_000} decimals={1} suffix="h" />,
            label: "Horas estudadas",
          },
          { value: totalAnswered, label: "Questões respondidas" },
          { value: totalCorrect, label: "Questões corretas" },
          { value: accuracyPct === null ? "--" : `${accuracyPct}%`, label: "Aproveitamento" },
        ]}
      />

      <Card className="px-5 py-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Horas por dia.</h2>
          {period === "month" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMonthHalf(0)}
                disabled={monthHalf === 0}
                aria-label="Primeira quinzena"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border-strong text-white/60 transition-colors hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/60"
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setMonthHalf(1)}
                disabled={monthHalf === 1}
                aria-label="Segunda quinzena"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border-strong text-white/60 transition-colors hover:text-white disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/60"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        <p className="mb-5 text-[11px] text-white/40">
          {period === "day"
            ? "Últimos 14 dias"
            : period === "week"
              ? "Essa semana"
              : monthHalf === 0
                ? "Dia 1 ao 15"
                : `Dia 16 ao ${daysInMonth}`}
        </p>
        <HoursChart
          bars={displayedBars}
          gap={period === "week" ? 48 : 10}
          labelClassName={period === "week" ? "text-xl" : "text-base"}
        />
      </Card>

      <Card className="px-5 py-5">
        <h2 className="mb-1 text-sm font-bold">Média de questões.</h2>
        <p className="mb-5 text-[11px] text-white/40">
          Respondidas x acertadas por check-in, no período selecionado.
        </p>
        {tracked.length === 0 ? (
          <p className="py-6 text-center text-xs text-white/40">
            Nenhuma questão registrada nesse período.
          </p>
        ) : (
          <AccuracyChart avgAnswered={avgAnswered} avgCorrect={avgCorrect} />
        )}
      </Card>
    </div>
  );
}
