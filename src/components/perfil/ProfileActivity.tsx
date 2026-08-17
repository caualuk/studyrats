"use client";

import { useState, useTransition } from "react";
import { CheckinCalendar } from "@/components/perfil/CheckinCalendar";
import { CheckinCard } from "@/components/feed/CheckinCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { addMonths } from "@/lib/dates";
import { loadCalendarMonth, loadCheckinsForDay, loadMoreUserCheckins } from "@/lib/checkins/actions";
import type { CalendarCheckin, FeedCheckin } from "@/lib/checkins/queries";
import { cn } from "@/lib/cn";

/**
 * The profile's activity calendar + "últimos check-ins" list, below the
 * stats grid. Three pieces of server state live here, each fetched
 * independently instead of all up front:
 *  - `calendarCheckins`: just this month's {createdAt, photoUrl}, refetched
 *    whenever the calendar navigates to a different month (see
 *    getUserCheckinsForMonth) -- this used to require the user's *entire*
 *    check-in history client-side just so old months could still render.
 *  - `recentItems`/`recentCursor`: the paginated "últimos check-ins" list,
 *    grown by the "Ver mais" button (see getUserCheckinsPage).
 *  - `dayItems`: full detail for whichever single day is selected on the
 *    calendar, fetched fresh on click (see getUserCheckinsForDay) rather
 *    than filtered out of whatever page of `recentItems` happens to be
 *    loaded -- a day outside the loaded pages would otherwise show empty
 *    even when it actually has check-ins.
 */
export function ProfileActivity({
  userId,
  initialCheckins,
  initialCursor,
  initialCalendarCheckins,
}: {
  userId: string;
  initialCheckins: FeedCheckin[];
  initialCursor: string | null;
  initialCalendarCheckins: CalendarCheckin[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [calendarCheckins, setCalendarCheckins] = useState(initialCalendarCheckins);
  const [recentItems, setRecentItems] = useState(initialCheckins);
  const [recentCursor, setRecentCursor] = useState(initialCursor);
  const [dayItems, setDayItems] = useState<FeedCheckin[]>([]);

  const [isCalendarPending, startCalendarTransition] = useTransition();
  const [isDayPending, startDayTransition] = useTransition();
  const [isLoadMorePending, startLoadMoreTransition] = useTransition();

  function goToMonth(delta: number) {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDay(null);
    startCalendarTransition(async () => {
      setCalendarCheckins(await loadCalendarMonth(userId, next.year, next.month));
    });
  }

  function handleSelectDay(day: number) {
    // Clicking the already-selected day clears the filter. Read
    // `selectedDay` from the closure rather than a setState updater --
    // React can invoke an updater during render (Strict Mode's
    // double-render, a bailout replay), and starting a transition as a
    // side effect from inside one throws "Cannot call startTransition
    // while rendering" and sends the click into a retry loop.
    const next = selectedDay === day ? null : day;
    setSelectedDay(next);
    if (next !== null) {
      startDayTransition(async () => {
        setDayItems(await loadCheckinsForDay(userId, year, month, next));
      });
    }
  }

  function handleLoadMore() {
    if (!recentCursor) return;
    startLoadMoreTransition(async () => {
      const page = await loadMoreUserCheckins(userId, recentCursor);
      setRecentItems((current) => [...current, ...page.items]);
      setRecentCursor(page.nextCursor);
    });
  }

  const isDaySelected = selectedDay !== null;
  const visibleCheckins = isDaySelected ? dayItems : recentItems;

  // Built from the same local-time getters buildMonthCalendar uses to
  // bucket check-ins into days, so the title always matches the day the
  // user actually clicked.
  const selectedDateLabel = isDaySelected
    ? `${String(selectedDay).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`
    : null;

  return (
    <>
      <div className={cn("mx-auto max-w-[560px] transition-opacity", isCalendarPending && "opacity-60")}>
        <CheckinCalendar
          year={year}
          month={month}
          checkins={calendarCheckins}
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

        {isDaySelected && isDayPending ? (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px]" />
            ))}
          </div>
        ) : visibleCheckins.length === 0 ? (
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
          <>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {visibleCheckins.map((checkin) => (
                <CheckinCard key={checkin.id} checkin={checkin} />
              ))}
            </div>
            {!isDaySelected && recentCursor && (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLoadMore}
                  disabled={isLoadMorePending}
                >
                  {isLoadMorePending ? "Carregando..." : "Ver mais"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
