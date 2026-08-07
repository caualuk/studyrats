"use client";

import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  buildMonthCalendar,
  formatMonthYearPtBR,
  WEEKDAY_LABELS_PT,
} from "@/lib/dates";

export function CheckinCalendar({
  year,
  month,
  checkins,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number;
  checkins: Array<{ createdAt: Date; photoUrl: string }>;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const cells = buildMonthCalendar(year, month, checkins);
  const activeCount = cells.filter((c) => c.isActive).length;

  return (
    <Card className="p-5 text-left">
      <div className="mb-1 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="text-white/40 hover:text-white"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className="text-sm font-bold">{formatMonthYearPtBR(year, month)}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="text-white/40 hover:text-white"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>
      <div className="mb-3.5 text-center text-[11px] text-white/35">
        {activeCount} {activeCount === 1 ? "dia com check-in" : "dias com check-in"}
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS_PT.map((label, index) => (
          <div key={index} className="text-center text-[11px] text-white/35">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, index) => (
          <button
            key={index}
            type="button"
            disabled={cell.day === null}
            onClick={() => cell.day !== null && onSelectDay(cell.day)}
            className={cn(
              "relative h-16 overflow-hidden rounded-lg text-xs sm:h-20",
              cell.day === null && "invisible",
              !cell.isActive && cell.day !== null && "bg-white/5 text-white/75 hover:bg-white/10",
              cell.isActive && "cursor-pointer",
              cell.isToday && !cell.isActive && "ring-1 ring-inset ring-accent/60",
              cell.day === selectedDay && "ring-2 ring-accent"
            )}
          >
            {cell.isActive && cell.photoUrl && (
              <>
                <Image
                  src={cell.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 80px, 64px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/45" />
              </>
            )}
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center font-bold",
                cell.isActive ? "text-white drop-shadow" : "font-normal"
              )}
            >
              {cell.day}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
