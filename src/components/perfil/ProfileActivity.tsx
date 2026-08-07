"use client";

import { useState } from "react";
import { CheckinCalendar } from "@/components/perfil/CheckinCalendar";
import { CheckinCard } from "@/components/feed/CheckinCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { addMonths } from "@/lib/dates";
import type { FeedCheckin } from "@/lib/checkins/queries";

const RECENT_COUNT = 6;

export function ProfileActivity({ checkins }: { checkins: FeedCheckin[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  function goToMonth(delta: number) {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDay(null);
  }

  function handleSelectDay(day: number) {
    // Clicking the already-selected day clears the filter.
    setSelectedDay((current) => (current === day ? null : day));
  }

  const visibleCheckins =
    selectedDay === null
      ? checkins.slice(0, RECENT_COUNT)
      : checkins.filter(
          (c) =>
            c.createdAt.getFullYear() === year &&
            c.createdAt.getMonth() === month &&
            c.createdAt.getDate() === selectedDay
        );

  // Built from the same local-time getters buildMonthCalendar uses to
  // bucket check-ins into days, so the title always matches the day the
  // user actually clicked.
  const selectedDateLabel =
    selectedDay === null
      ? null
      : `${String(selectedDay).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;

  return (
    <>
      <div className="mx-auto max-w-[560px]">
        <CheckinCalendar
          year={year}
          month={month}
          checkins={checkins}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          onPrevMonth={() => goToMonth(-1)}
          onNextMonth={() => goToMonth(1)}
        />
      </div>

      <div className="mt-8">
        <div className="mb-[18px] flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {selectedDateLabel ? `Check-ins (${selectedDateLabel}).` : "Últimos check-ins."}
          </h2>
          {selectedDateLabel && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs text-white/45 transition-colors hover:text-white/70"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {visibleCheckins.length === 0 ? (
          <EmptyState
            title={
              selectedDateLabel
                ? "Nenhum check-in nesse dia."
                : "Você ainda não postou nenhum check-in."
            }
            description={
              selectedDateLabel
                ? "Escolha outro dia no calendário acima."
                : "Seus check-ins aparecem aqui assim que você postar o primeiro."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {visibleCheckins.map((checkin) => (
              <CheckinCard key={checkin.id} checkin={checkin} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
